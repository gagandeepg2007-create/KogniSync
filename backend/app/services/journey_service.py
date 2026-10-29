import hashlib
from datetime import datetime, date, timezone
from decimal import Decimal
from typing import List, Dict, Any, Optional, Tuple

from app.schemas.journey import (
    JourneySearchRequest,
    JourneySearchResponse,
    JourneyOption,
    JourneyLeg,
    PlaceItem
)
from app.services.transport_repository import TransportRepository


class JourneyIntelligenceService:
    """
    Core Journey Intelligence orchestrator:
    1. Validates and resolves search requests.
    2. Constructs candidate journeys from actual transport records.
    3. Performs deterministic cost, duration, and layover calculations.
    4. Evaluates hard constraints (budget, deadline, transfers) for feasibility.
    5. Ranks feasible candidates using preference-aware algorithms.
    6. Generates deterministic, metric-grounded explanations.
    """

    def __init__(self, repository: Optional[TransportRepository] = None):
        self.repo = repository or TransportRepository()

    def get_places(self) -> List[PlaceItem]:
        return self.repo.get_all_places()

    def search_journeys(self, request: JourneySearchRequest) -> JourneySearchResponse:
        # 1. Resolve Origin and Destination
        origin_matches = self.repo.resolve_airports_for_query(request.origin)
        if not origin_matches:
            return JourneySearchResponse(
                origin_queried=request.origin,
                destination_queried=request.destination,
                travel_date=request.travel_date,
                preference=request.preference,
                total_candidates_found=0,
                feasible_count=0,
                infeasible_count=0,
                journeys=[],
                rejected_journeys=[],
                message=f"Origin '{request.origin}' could not be resolved to any airport in the transport dataset."
            )

        dest_matches = self.repo.resolve_airports_for_query(request.destination)
        if not dest_matches:
            return JourneySearchResponse(
                origin_queried=request.origin,
                destination_queried=request.destination,
                travel_date=request.travel_date,
                preference=request.preference,
                total_candidates_found=0,
                feasible_count=0,
                infeasible_count=0,
                journeys=[],
                rejected_journeys=[],
                message=f"Destination '{request.destination}' could not be resolved to any airport in the transport dataset."
            )

        origin_airport_ids = [m["airport_id"] for m in origin_matches]
        dest_airport_ids = [m["airport_id"] for m in dest_matches]

        # Check disjoint locations
        if set(origin_airport_ids).issubset(set(dest_airport_ids)) or set(dest_airport_ids).issubset(set(origin_airport_ids)):
            return JourneySearchResponse(
                origin_queried=request.origin,
                destination_queried=request.destination,
                travel_date=request.travel_date,
                preference=request.preference,
                total_candidates_found=0,
                feasible_count=0,
                infeasible_count=0,
                journeys=[],
                rejected_journeys=[],
                message="Origin and destination resolve to the same location. Please select distinct endpoints."
            )

        # Check transport modes filter
        active_modes = [m.lower() for m in (request.transport_modes or ["flights"])]
        if "flights" not in active_modes:
            return JourneySearchResponse(
                origin_queried=request.origin,
                destination_queried=request.destination,
                travel_date=request.travel_date,
                preference=request.preference,
                total_candidates_found=0,
                feasible_count=0,
                infeasible_count=0,
                journeys=[],
                rejected_journeys=[],
                message=(
                    f"Selected transport mode(s) ({', '.join(request.transport_modes or [])}) are not currently available "
                    f"in the canonical schedule dataset (APS-05 currently covers air travel). Please enable Flights to see live schedules."
                )
            )

        # 2. Candidate Construction
        candidates: List[JourneyOption] = []
        max_transfers = request.transfer_limit if request.transfer_limit is not None else 2

        # Service tier cabin mapping
        cabin_pref = request.cabin_class or "any"
        if request.service_tier == "premium" and cabin_pref == "any":
            cabin_pref = "business"
        elif request.service_tier == "budget" and cabin_pref == "any":
            cabin_pref = "economy"

        # Construct Direct (0 transfers)
        direct_flights = self.repo.search_direct_flights(
            origin_airport_ids=origin_airport_ids,
            dest_airport_ids=dest_airport_ids,
            travel_date=request.travel_date
        )
        for flt in direct_flights:
            candidate = self._build_candidate_journey(
                [flt],
                request.travel_date,
                cabin_pref,
                passengers=request.passengers,
                service_tier=request.service_tier or "balanced"
            )
            if candidate:
                candidates.append(candidate)

        # Construct 1-Stop Connecting (1 transfer) if allowed
        if max_transfers >= 1:
            connecting_pairs = self.repo.search_connecting_1stop_flights(
                origin_airport_ids=origin_airport_ids,
                dest_airport_ids=dest_airport_ids,
                travel_date=request.travel_date
            )
            for leg1, leg2 in connecting_pairs:
                candidate = self._build_candidate_journey(
                    [leg1, leg2],
                    request.travel_date,
                    cabin_pref,
                    passengers=request.passengers,
                    service_tier=request.service_tier or "balanced"
                )
                if candidate:
                    candidates.append(candidate)

        # 3. Deduplicate candidates by flight and fare sequence
        unique_candidates: List[JourneyOption] = []
        seen_keys = set()
        for c in candidates:
            key = tuple((leg.flight_id, leg.fare_id) for leg in c.legs)
            if key not in seen_keys:
                seen_keys.add(key)
                unique_candidates.append(c)

        # 4. Feasibility Evaluation (Hard Constraints Before Ranking)
        feasible_candidates: List[JourneyOption] = []
        infeasible_candidates: List[JourneyOption] = []

        for candidate in unique_candidates:
            is_feasible, reasons = self._evaluate_feasibility(candidate, request)
            candidate.feasible = is_feasible
            candidate.rejection_reasons = reasons
            if is_feasible:
                feasible_candidates.append(candidate)
            else:
                infeasible_candidates.append(candidate)

        # 5. Preference-Aware Ranking of Feasible Candidates
        ranked_journeys = self._rank_candidates(feasible_candidates, request.preference)

        # 6. Generate Deterministic Explanations
        self._generate_explanations(ranked_journeys, request.preference)

        msg = (
            f"Found {len(ranked_journeys)} feasible journey(s) and "
            f"{len(infeasible_candidates)} infeasible candidate(s) for {request.origin} -> {request.destination}."
        )
        if not ranked_journeys and not infeasible_candidates:
            msg = f"No scheduled flights or connections found between '{request.origin}' and '{request.destination}' on {request.travel_date}."
        elif not ranked_journeys and infeasible_candidates:
            msg = f"Transport routes exist, but no feasible journey satisfies your constraints (budget, deadline, or transfer limit)."

        return JourneySearchResponse(
            origin_queried=request.origin,
            destination_queried=request.destination,
            travel_date=request.travel_date,
            preference=request.preference,
            total_candidates_found=len(unique_candidates),
            feasible_count=len(ranked_journeys),
            infeasible_count=len(infeasible_candidates),
            journeys=ranked_journeys,
            rejected_journeys=infeasible_candidates,
            message=msg
        )

    def _build_candidate_journey(
        self,
        flight_dicts: List[Dict[str, Any]],
        travel_date: date,
        cabin_preference: str,
        passengers: int = 1,
        service_tier: str = "balanced"
    ) -> Optional[JourneyOption]:
        """
        Constructs a candidate JourneyOption from a sequence of flight dictionaries.
        Fetches fares, attaches inventory references, and calculates exact durations and costs.
        Scales total cost and carbon footprint by passenger count.
        """
        legs: List[JourneyLeg] = []
        base_unit_cost = Decimal("0.00")
        base_unit_carbon = Decimal("0.000")
        currency = "INR"

        for idx, flt in enumerate(flight_dicts):
            fares = self.repo.get_flight_fares(flt["flight_id"], cabin_preference)
            if not fares:
                # If preferred cabin class is not available and wasn't 'any', fallback to any active fare
                if cabin_preference != "any":
                    fares = self.repo.get_flight_fares(flt["flight_id"], "any")
            if not fares:
                return None  # No valid fare found for this flight

            selected_fare = fares[0]  # lowest available fare
            base_fare = Decimal(str(selected_fare["base_fare"]))
            taxes = Decimal(str(selected_fare["taxes"]))
            leg_total = base_fare + taxes
            currency = selected_fare["currency"]
            leg_carbon = Decimal(str(flt["carbon_kg"]))

            # Check inventory calendar for this fare on this flight date
            inv_record = self.repo.get_inventory_status(selected_fare["fare_id"], travel_date)
            inv_id = inv_record["inventory_id"] if inv_record else None
            avail_units = None
            if inv_record:
                avail_units = inv_record["total_units"] - inv_record["booked_units"] - inv_record["held_units"]

            departs_at = datetime.fromisoformat(flt["departs_at"])
            arrives_at = datetime.fromisoformat(flt["arrives_at"])

            leg = JourneyLeg(
                leg_index=idx,
                flight_id=flt["flight_id"],
                flight_number=flt["flight_number"],
                airline_id=flt["airline_id"],
                airline_name=flt["airline_name"],
                airline_iata=flt["airline_iata"],
                origin_airport_id=flt["origin_airport_id"],
                origin_airport_iata=flt["origin_airport_iata"],
                origin_airport_name=flt["origin_airport_name"],
                origin_city_name=flt["origin_city_name"],
                dest_airport_id=flt["dest_airport_id"],
                dest_airport_iata=flt["dest_airport_iata"],
                dest_airport_name=flt["dest_airport_name"],
                dest_city_name=flt["dest_city_name"],
                departs_at=departs_at,
                arrives_at=arrives_at,
                duration_minutes=int(flt["duration_minutes"]),
                aircraft_type=flt.get("aircraft_type"),
                cabin_class=selected_fare["cabin_class"],
                fare_id=selected_fare["fare_id"],
                base_fare=base_fare,
                taxes=taxes,
                total_fare=leg_total,
                currency=currency,
                carbon_kg=leg_carbon,
                inventory_id=inv_id,
                available_units=avail_units
            )
            legs.append(leg)
            base_unit_cost += leg_total
            base_unit_carbon += leg_carbon

        # Calculate overall journey metrics
        first_leg = legs[0]
        last_leg = legs[-1]
        departure_time = first_leg.departs_at
        arrival_time = last_leg.arrives_at

        # Elapsed minutes = (arrival_time - departure_time)
        total_elapsed_minutes = int((arrival_time - departure_time).total_seconds() / 60)
        flight_duration_minutes = sum(l.duration_minutes for l in legs)

        waiting_duration_minutes = 0
        for i in range(len(legs) - 1):
            layover = int((legs[i + 1].departs_at - legs[i].arrives_at).total_seconds() / 60)
            waiting_duration_minutes += layover

        # Scale cost and carbon for party size
        scaled_total_cost = base_unit_cost * passengers
        scaled_total_carbon = base_unit_carbon * passengers

        # Deterministic journey ID
        id_seed = f"{passengers}:" + ":".join(f"{l.flight_id}_{l.fare_id}" for l in legs)
        jny_hash = hashlib.sha256(id_seed.encode("utf-8")).hexdigest()[:10]
        journey_id = f"jny_{jny_hash}"

        origin_display = f"{first_leg.origin_city_name} ({first_leg.origin_airport_iata})"
        dest_display = f"{last_leg.dest_city_name} ({last_leg.dest_airport_iata})"

        return JourneyOption(
            journey_id=journey_id,
            origin_display=origin_display,
            destination_display=dest_display,
            departure_time=departure_time,
            arrival_time=arrival_time,
            total_elapsed_duration_minutes=total_elapsed_minutes,
            flight_duration_minutes=flight_duration_minutes,
            waiting_duration_minutes=waiting_duration_minutes,
            number_of_legs=len(legs),
            transfer_count=len(legs) - 1,
            total_cost=scaled_total_cost,
            currency=currency,
            passengers=passengers,
            unit_cost_per_passenger=base_unit_cost,
            transport_mode="flights",
            service_tier=service_tier,
            total_carbon_kg=scaled_total_carbon,
            legs=legs,
            feasible=True,
            rejection_reasons=[]
        )

    def _evaluate_feasibility(
        self,
        candidate: JourneyOption,
        request: JourneySearchRequest
    ) -> Tuple[bool, List[str]]:
        """
        Evaluates all hard constraints:
        1. Arrival deadline.
        2. Maximum budget.
        3. Transfer limit.
        Returns (is_feasible, rejection_reasons).
        """
        reasons: List[str] = []

        # 1. Arrival Deadline Check
        if request.arrival_deadline is not None:
            if candidate.arrival_time > request.arrival_deadline:
                reasons.append(
                    f"Arrives at {candidate.arrival_time.strftime('%H:%M %Z')}, "
                    f"which exceeds the required arrival deadline of {request.arrival_deadline.strftime('%H:%M %Z')}."
                )

        # 2. Maximum Budget Check
        if request.max_budget is not None:
            if candidate.total_cost > request.max_budget:
                reasons.append(
                    f"Total cost of {candidate.currency} {candidate.total_cost:,.2f} "
                    f"exceeds maximum allowed budget of {candidate.currency} {request.max_budget:,.2f}."
                )

        # 3. Transfer Limit Check
        if request.transfer_limit is not None:
            if candidate.transfer_count > request.transfer_limit:
                reasons.append(
                    f"Route has {candidate.transfer_count} transfer(s), exceeding the allowed limit of {request.transfer_limit}."
                )

        return (len(reasons) == 0, reasons)

    def _rank_candidates(
        self,
        candidates: List[JourneyOption],
        preference: str
    ) -> List[JourneyOption]:
        """
        Ranks feasible candidates using a deterministic method.
        - 'lowest_cost': Sorts by total_cost asc, elapsed duration asc, departure_time asc.
        - 'shortest_duration': Sorts by elapsed duration asc, total_cost asc, departure_time asc.
        - 'balanced': Normalizes cost and duration to [0, 1] scales to prevent currency units
          from overpowering minutes, then computes composite score = 0.5 * norm_cost + 0.5 * norm_dur.
        """
        if not candidates:
            return []

        if preference == "lowest_cost":
            sorted_candidates = sorted(
                candidates,
                key=lambda j: (j.total_cost, j.total_elapsed_duration_minutes, j.departure_time)
            )
            for idx, jny in enumerate(sorted_candidates):
                jny.rank = idx + 1
                jny.preference = preference
            return sorted_candidates

        elif preference == "shortest_duration":
            sorted_candidates = sorted(
                candidates,
                key=lambda j: (j.total_elapsed_duration_minutes, j.total_cost, j.departure_time)
            )
            for idx, jny in enumerate(sorted_candidates):
                jny.rank = idx + 1
                jny.preference = preference
            return sorted_candidates

        else:  # 'balanced'
            min_cost = min(j.total_cost for j in candidates)
            max_cost = max(j.total_cost for j in candidates)
            min_dur = min(j.total_elapsed_duration_minutes for j in candidates)
            max_dur = max(j.total_elapsed_duration_minutes for j in candidates)

            cost_range = max_cost - min_cost
            dur_range = max_dur - min_dur

            for jny in candidates:
                if cost_range > 0:
                    norm_cost = float((jny.total_cost - min_cost) / cost_range)
                else:
                    norm_cost = 0.0

                if dur_range > 0:
                    norm_dur = float((jny.total_elapsed_duration_minutes - min_dur) / dur_range)
                else:
                    norm_dur = 0.0

                # Composite score: equal weighting (0.5 cost + 0.5 duration)
                score = (0.5 * norm_cost) + (0.5 * norm_dur)
                jny.normalized_cost_score = round(norm_cost, 4)
                jny.normalized_duration_score = round(norm_dur, 4)
                jny.composite_score = round(score, 4)
                jny.preference = preference

            sorted_candidates = sorted(
                candidates,
                key=lambda j: (j.composite_score or 0.0, j.total_cost, j.total_elapsed_duration_minutes, j.departure_time)
            )
            for idx, jny in enumerate(sorted_candidates):
                jny.rank = idx + 1
            return sorted_candidates

    def _generate_explanations(self, ranked: List[JourneyOption], preference: str):
        """
        Generates deterministic, metric-grounded explanations that agree with actual numbers.
        """
        if not ranked:
            return

        top = ranked[0]
        dur_hrs = top.total_elapsed_duration_minutes // 60
        dur_mins = top.total_elapsed_duration_minutes % 60
        time_str = f"{dur_hrs}h {dur_mins}m" if dur_hrs > 0 else f"{dur_mins}m"

        # Top Recommendation Explanation
        if preference == "lowest_cost":
            savings_str = ""
            if len(ranked) > 1:
                diff = ranked[1].total_cost - top.total_cost
                if diff > 0:
                    savings_str = f" Saves {top.currency} {diff:,.2f} compared to the next cheapest option."
            top.explanation = (
                f"Rank #1 (Lowest Cost): Most affordable route at {top.currency} {top.total_cost:,.2f} "
                f"with {top.transfer_count} transfer(s) and {time_str} total travel time.{savings_str}"
            )
        elif preference == "shortest_duration":
            saved_time_str = ""
            if len(ranked) > 1:
                time_diff = ranked[1].total_elapsed_duration_minutes - top.total_elapsed_duration_minutes
                if time_diff > 0:
                    saved_time_str = f" Reaches destination {time_diff} minutes faster than alternative options."
            top.explanation = (
                f"Rank #1 (Shortest Duration): Fastest journey taking only {time_str} "
                f"({top.transfer_count} transfer(s), {top.currency} {top.total_cost:,.2f}).{saved_time_str}"
            )
        else:  # balanced
            top.explanation = (
                f"Rank #1 (Balanced): Optimal trade-off between price ({top.currency} {top.total_cost:,.2f}) "
                f"and travel duration ({time_str}, {top.transfer_count} transfer(s)). Balanced score: {top.composite_score:.2f}."
            )

        # Subsequent Candidates Explanation
        for jny in ranked[1:]:
            j_hrs = jny.total_elapsed_duration_minutes // 60
            j_mins = jny.total_elapsed_duration_minutes % 60
            j_time_str = f"{j_hrs}h {j_mins}m" if j_hrs > 0 else f"{j_mins}m"

            cost_diff = jny.total_cost - top.total_cost
            time_diff = jny.total_elapsed_duration_minutes - top.total_elapsed_duration_minutes

            parts = [f"Rank #{jny.rank}:"]
            if cost_diff > 0:
                parts.append(f"+{jny.currency} {cost_diff:,.2f} higher cost")
            elif cost_diff < 0:
                parts.append(f"{jny.currency} {abs(cost_diff):,.2f} lower cost")
            else:
                parts.append("Identical cost")

            if time_diff > 0:
                parts.append(f"{time_diff} mins longer duration")
            elif time_diff < 0:
                parts.append(f"{abs(time_diff)} mins shorter duration")
            else:
                parts.append("identical duration")

            if jny.transfer_count == 0:
                parts.append("(Direct flight)")
            else:
                parts.append(f"({jny.transfer_count} transfer)")

            jny.explanation = " ".join(parts) + f". Total: {jny.currency} {jny.total_cost:,.2f}, {j_time_str}."
