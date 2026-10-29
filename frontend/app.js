/**
 * KogniSync — Multi-Modal Explore Engine & Verified Booking Reliability
 * Frontend Logic & Client-Side Routing
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation & Page Views
  const navTabs = document.querySelectorAll('.nav-tab-link');
  const homeView = document.getElementById('homeView');
  const exploreView = document.getElementById('exploreView');
  const bookingsView = document.getElementById('bookingsView');
  const homeExploreCtaBtn = document.getElementById('homeExploreCtaBtn');
  const homeBookingsCtaBtn = document.getElementById('homeBookingsCtaBtn');

  // Explore Form Elements
  const form = document.getElementById('journeySearchForm');
  const originInput = document.getElementById('originInput');
  const destinationInput = document.getElementById('destinationInput');
  const swapLocationsBtn = document.getElementById('swapLocationsBtn');
  const travelDateInput = document.getElementById('travelDateInput');
  const passengerCountInput = document.getElementById('passengerCountInput');
  const decPassengersBtn = document.getElementById('decPassengersBtn');
  const incPassengersBtn = document.getElementById('incPassengersBtn');
  const arrivalDeadlineInput = document.getElementById('arrivalDeadlineInput');
  const budgetInput = document.getElementById('budgetInput');
  const transferLimitSelect = document.getElementById('transferLimitSelect');
  const cabinSelect = document.getElementById('cabinSelect');
  const searchSubmitBtn = document.getElementById('searchSubmitBtn');
  const searchSpinner = document.getElementById('searchSpinner');
  const placesList = document.getElementById('placesList');

  // Transport Modes Bar & Service Tiers
  const transportModeCheckboxes = document.querySelectorAll('input[name="transport_mode"]');
  const serviceTierRadios = document.querySelectorAll('input[name="service_tier"]');

  // Results & Statistics Elements
  const resultsHeader = document.getElementById('resultsHeader');
  const statCandidates = document.getElementById('statCandidates');
  const statFeasible = document.getElementById('statFeasible');
  const statInfeasible = document.getElementById('statInfeasible');
  const statPassengers = document.getElementById('statPassengers');
  const activePreferenceBadge = document.getElementById('activePreferenceBadge');
  const feedbackAlert = document.getElementById('feedbackAlert');
  const journeysContainer = document.getElementById('journeysContainer');

  // Rejected Candidates Section
  const rejectedSection = document.getElementById('rejectedSection');
  const rejectedToggleBtn = document.getElementById('rejectedToggleBtn');
  const rejectedBody = document.getElementById('rejectedBody');
  const rejectedCardsList = document.getElementById('rejectedCardsList');
  const rejectedCountBadge = document.getElementById('rejectedCountBadge');
  const accordionArrow = document.getElementById('accordionArrow');

  // Bookings Monitor Elements
  const bookingsHistoryList = document.getElementById('bookingsHistoryList');
  const refreshBookingsBtn = document.getElementById('refreshBookingsBtn');

  // Booking Modal Elements
  const bookingModalBackdrop = document.getElementById('bookingModalBackdrop');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalJourneySummary = document.getElementById('modalJourneySummary');
  const bookingUserId = document.getElementById('bookingUserId');
  const bookingIdempotencyKey = document.getElementById('bookingIdempotencyKey');
  const regenerateIdempotencyBtn = document.getElementById('regenerateIdempotencyBtn');
  const executeBookingBtn = document.getElementById('executeBookingBtn');
  const bookingSpinner = document.getElementById('bookingSpinner');
  const bookingOutcome = document.getElementById('bookingOutcome');

  let currentSelectedJourney = null;
  const API_BASE = window.location.origin;

  // ==========================================================================
  // 1. Client-Side Routing & Tab Navigation
  // ==========================================================================

  function getRouteFromLocation() {
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    if (hash === 'home' || hash === 'explore' || hash === 'bookings') {
      return hash;
    }
    const path = window.location.pathname.replace(/^\//, '').toLowerCase();
    if (path === 'home' || path === 'explore' || path === 'bookings') {
      return path;
    }
    return 'explore'; // Default view
  }

  function setActiveView(route, updateHistory = true) {
    const validRoute = ['home', 'explore', 'bookings'].includes(route) ? route : 'explore';

    // Toggle views
    if (homeView) homeView.style.display = validRoute === 'home' ? 'block' : 'none';
    if (exploreView) exploreView.style.display = validRoute === 'explore' ? 'block' : 'none';
    if (bookingsView) {
      bookingsView.style.display = validRoute === 'bookings' ? 'block' : 'none';
      if (validRoute === 'bookings') {
        renderBookingsHistory();
      }
    }

    // Update active tab styling
    navTabs.forEach(tab => {
      if (tab.dataset.route === validRoute) {
        tab.classList.add('active');
        tab.setAttribute('aria-current', 'page');
      } else {
        tab.classList.remove('active');
        tab.removeAttribute('aria-current');
      }
    });

    if (updateHistory) {
      if (window.location.hash !== `#/${validRoute}`) {
        window.history.pushState({ route: validRoute }, '', `#/${validRoute}`);
      }
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Nav tab link clicks
  navTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const route = tab.dataset.route;
      setActiveView(route, true);
    });
  });

  // Hero CTA buttons
  if (homeExploreCtaBtn) {
    homeExploreCtaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      setActiveView('explore', true);
    });
  }

  if (homeBookingsCtaBtn) {
    homeBookingsCtaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      setActiveView('bookings', true);
    });
  }

  // Handle browser back/forward buttons
  window.addEventListener('popstate', () => {
    const route = getRouteFromLocation();
    setActiveView(route, false);
  });

  window.addEventListener('hashchange', () => {
    const route = getRouteFromLocation();
    setActiveView(route, false);
  });

  // Initial Route Dispatch
  setActiveView(getRouteFromLocation(), false);

  // ==========================================================================
  // 2. Transport Mode Category Selection
  // ==========================================================================

  transportModeCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const parentLabel = checkbox.closest('.mode-toggle');
      if (parentLabel) {
        parentLabel.classList.toggle('active', checkbox.checked);
      }
    });
  });

  function getSelectedTransportModes() {
    const checked = [];
    document.querySelectorAll('input[name="transport_mode"]:checked').forEach(cb => {
      checked.push(cb.value);
    });
    return checked;
  }

  // ==========================================================================
  // 3. Origin & Destination Handling + Swap Button
  // ==========================================================================

  if (swapLocationsBtn) {
    swapLocationsBtn.addEventListener('click', () => {
      const currentOrigin = originInput.value;
      const currentDestination = destinationInput.value;

      // Animate rotation
      swapLocationsBtn.style.transform = 'rotate(180deg)';
      setTimeout(() => {
        swapLocationsBtn.style.transform = '';
      }, 300);

      originInput.value = currentDestination;
      destinationInput.value = currentOrigin;
    });
  }

  // Load canonical places for autocomplete
  async function loadPlaces() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/journeys/places`);
      if (res.ok) {
        const places = await res.json();
        placesList.innerHTML = '';
        places.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.name;
          opt.label = p.display_label;
          placesList.appendChild(opt);
        });
      }
    } catch (err) {
      console.warn('Could not load places datalist:', err);
    }
  }
  loadPlaces();

  // ==========================================================================
  // 4. Passenger Stepper (1 to 9 Passengers)
  // ==========================================================================

  function updatePassengerCount(newVal) {
    let val = Math.max(1, Math.min(9, newVal));
    passengerCountInput.value = val;
    if (statPassengers) {
      statPassengers.textContent = `${val} Passenger${val > 1 ? 's' : ''}`;
    }
  }

  if (decPassengersBtn) {
    decPassengersBtn.addEventListener('click', () => {
      const current = parseInt(passengerCountInput.value, 10) || 1;
      updatePassengerCount(current - 1);
    });
  }

  if (incPassengersBtn) {
    incPassengersBtn.addEventListener('click', () => {
      const current = parseInt(passengerCountInput.value, 10) || 1;
      updatePassengerCount(current + 1);
    });
  }

  // ==========================================================================
  // 5. Service Tiers & Optimization Preferences
  // ==========================================================================

  serviceTierRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.tier-card').forEach(c => c.classList.remove('active'));
      const parentCard = radio.closest('.tier-card');
      if (parentCard) parentCard.classList.add('active');

      const tier = radio.value;
      if (tier === 'budget') {
        setPreferenceRadio('lowest_cost');
        if (cabinSelect) cabinSelect.value = 'economy';
      } else if (tier === 'balanced') {
        setPreferenceRadio('balanced');
        if (cabinSelect) cabinSelect.value = 'any';
      } else if (tier === 'premium') {
        setPreferenceRadio('shortest_duration');
        if (cabinSelect) cabinSelect.value = 'business';
      }
    });
  });

  function getSelectedServiceTier() {
    return document.querySelector('input[name="service_tier"]:checked')?.value || 'balanced';
  }

  function setPreferenceRadio(val) {
    const radio = document.querySelector(`input[name="preference"][value="${val}"]`);
    if (radio) radio.checked = true;
  }

  // Preset Scenarios Handler
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      updatePassengerCount(1);

      // Ensure Flights is active for presets
      const flightsCb = document.querySelector('input[name="transport_mode"][value="flights"]');
      if (flightsCb && !flightsCb.checked) {
        flightsCb.checked = true;
        flightsCb.closest('.mode-toggle')?.classList.add('active');
      }

      if (preset === 'direct') {
        originInput.value = 'Kochi';
        destinationInput.value = 'Mumbai';
        travelDateInput.value = '2026-09-03';
        arrivalDeadlineInput.value = '';
        budgetInput.value = '';
        transferLimitSelect.value = '2';
        setServiceTier('balanced');
      } else if (preset === 'connecting') {
        originInput.value = 'Bengaluru';
        destinationInput.value = 'Pune';
        travelDateInput.value = '2026-09-04';
        arrivalDeadlineInput.value = '';
        budgetInput.value = '';
        transferLimitSelect.value = '2';
        setServiceTier('balanced');
      } else if (preset === 'budget') {
        originInput.value = 'Bengaluru';
        destinationInput.value = 'Pune';
        travelDateInput.value = '2026-09-04';
        arrivalDeadlineInput.value = '';
        budgetInput.value = '5000';
        transferLimitSelect.value = '2';
        setServiceTier('budget');
      } else if (preset === 'deadline') {
        originInput.value = 'Bengaluru';
        destinationInput.value = 'Pune';
        travelDateInput.value = '2026-09-04';
        arrivalDeadlineInput.value = '2026-09-04T12:00';
        budgetInput.value = '';
        transferLimitSelect.value = '2';
        setServiceTier('balanced');
        setPreferenceRadio('shortest_duration');
      }
      form.requestSubmit();
    });
  });

  function setServiceTier(tier) {
    const radio = document.querySelector(`input[name="service_tier"][value="${tier}"]`);
    if (radio) {
      radio.checked = true;
      document.querySelectorAll('.tier-card').forEach(c => c.classList.remove('active'));
      radio.closest('.tier-card')?.classList.add('active');
    }
  }

  // ==========================================================================
  // 6. Search Form Submission & Execution
  // ==========================================================================

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const origin = originInput.value.trim();
    const destination = destinationInput.value.trim();
    const travelDate = travelDateInput.value;
    const passengers = parseInt(passengerCountInput.value, 10) || 1;
    const arrivalDeadline = arrivalDeadlineInput.value ? `${arrivalDeadlineInput.value}:00+05:30` : null;
    const maxBudget = budgetInput.value ? parseFloat(budgetInput.value) : null;
    const preference = document.querySelector('input[name="preference"]:checked')?.value || 'balanced';
    const serviceTier = getSelectedServiceTier();
    const transportModes = getSelectedTransportModes();
    const transferLimit = parseInt(transferLimitSelect.value, 10);
    const cabinClass = cabinSelect.value;

    // Client-side validations
    if (!origin || !destination) {
      showAlert('Please specify both an origin and a destination city or airport.', 'danger');
      return;
    }
    if (origin.toLowerCase() === destination.toLowerCase()) {
      showAlert('Origin and destination cannot be identical. Please select different locations.', 'danger');
      return;
    }
    if (transportModes.length === 0) {
      showAlert('Please select at least one transport category (e.g. Flights).', 'danger');
      return;
    }

    const payload = {
      origin,
      destination,
      travel_date: travelDate,
      passengers,
      arrival_deadline: arrivalDeadline,
      max_budget: maxBudget,
      preference,
      service_tier: serviceTier,
      transport_modes: transportModes,
      transfer_limit: transferLimit,
      cabin_class: cabinClass
    };

    setLoading(true);
    hideAlert();
    activePreferenceBadge.innerHTML = `Mode: <strong>${capitalize(preference.replace('_', ' '))}</strong> · Tier: <strong>${capitalize(serviceTier)}</strong>`;
    if (statPassengers) {
      statPassengers.textContent = `${passengers} Passenger${passengers > 1 ? 's' : ''}`;
    }

    try {
      const response = await fetch(`${API_BASE}/api/v1/journeys/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        showAlert(data.detail || 'Search request failed. Please check your inputs.', 'danger');
        renderJourneys([]);
        renderRejected([]);
        return;
      }

      statCandidates.textContent = `${data.total_candidates_found} candidates found`;
      statFeasible.textContent = `${data.feasible_count} feasible`;
      statInfeasible.textContent = `${data.infeasible_count} rejected`;

      if (data.feasible_count === 0 && data.infeasible_count === 0) {
        showAlert(data.message, 'warning');
      } else if (data.feasible_count === 0 && data.infeasible_count > 0) {
        showAlert(`Hard constraint rejection: ${data.message}`, 'warning');
      }

      renderJourneys(data.journeys || [], passengers);
      renderRejected(data.rejected_journeys || []);

    } catch (err) {
      console.error('Search error:', err);
      showAlert(`Network or server error communicating with Journey API: ${err.message}`, 'danger');
    } finally {
      setLoading(false);
    }
  });

  // ==========================================================================
  // 7. Render Feasible Journey Cards
  // ==========================================================================

  function renderJourneys(journeys, passengers = 1) {
    journeysContainer.innerHTML = '';

    if (!journeys || journeys.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-state';
      emptyDiv.innerHTML = `
        <div class="empty-icon">🔎</div>
        <h3>No Feasible Journey Recommendations</h3>
        <p>No valid journeys satisfied all current hard constraints (route, budget, arrival deadline, transfer limits, transport modes).</p>
      `;
      journeysContainer.appendChild(emptyDiv);
      return;
    }

    journeys.forEach(jny => {
      const card = document.createElement('div');
      card.className = `journey-card ${jny.rank === 1 ? 'rank-1-card' : ''}`;

      const depDate = new Date(jny.departure_time);
      const arrDate = new Date(jny.arrival_time);
      const depTimeStr = formatTime(depDate);
      const arrTimeStr = formatTime(arrDate);

      const elapsedHours = Math.floor(jny.total_elapsed_duration_minutes / 60);
      const elapsedMins = jny.total_elapsed_duration_minutes % 60;
      const durationStr = elapsedHours > 0 ? `${elapsedHours}h ${elapsedMins}m` : `${elapsedMins}m`;

      const rankBadgeClass = jny.rank === 1 ? 'badge-rank-1' : 'badge-rank-other';
      const rankLabel = jny.rank === 1 ? '★ Rank #1 · Top Recommendation' : `Rank #${jny.rank}`;

      const transferBadgeClass = jny.transfer_count === 0 ? 'transfers-direct' : 'transfers-connecting';
      const transferLabel = jny.transfer_count === 0 ? 'Direct Flight' : `${jny.transfer_count} Transfer`;

      // Price breakdown for multi-passenger bookings
      const partySize = jny.passengers || passengers || 1;
      let priceSubtext = '';
      if (partySize > 1 && jny.unit_cost_per_passenger) {
        priceSubtext = `<div class="price-per-person">₹${formatMoney(jny.unit_cost_per_passenger)} / person (${partySize} pax)</div>`;
      }

      card.innerHTML = `
        <div class="card-top-bar">
          <div class="badges-group">
            <span class="badge-rank ${rankBadgeClass}">${rankLabel}</span>
            <span class="badge-transfers ${transferBadgeClass}">${transferLabel}</span>
            <span class="stat-pill">✈️ Flights · APS-05</span>
            ${jny.composite_score !== null ? `<span class="stat-pill">Score: ${jny.composite_score}</span>` : ''}
          </div>
          <span class="journey-id-label">${jny.journey_id}</span>
        </div>

        <div class="route-main-row">
          <div class="endpoint-block origin-side">
            <div class="endpoint-time">${depTimeStr}</div>
            <div class="endpoint-code">${jny.legs[0].origin_airport_iata}</div>
            <div class="endpoint-city">${jny.legs[0].origin_city_name}</div>
          </div>

          <div class="route-flight-visual">
            <span class="duration-text">${durationStr}</span>
            <div class="visual-line">
              <span class="visual-dot dot-start"></span>
              <span class="visual-plane">✈️</span>
              <span class="visual-dot dot-end"></span>
            </div>
            ${jny.transfer_count > 0 ? `<span class="layover-pill">${jny.waiting_duration_minutes}m layover in ${jny.legs[0].dest_city_name}</span>` : ''}
          </div>

          <div class="endpoint-block dest-side">
            <div class="endpoint-time">${arrTimeStr}</div>
            <div class="endpoint-code">${jny.legs[jny.legs.length - 1].dest_airport_iata}</div>
            <div class="endpoint-city">${jny.legs[jny.legs.length - 1].dest_city_name}</div>
          </div>

          <div class="price-booking-column">
            <div>
              <span class="price-currency">${jny.currency}</span>
              <span class="price-amount">${formatMoney(jny.total_cost)}</span>
              ${priceSubtext}
            </div>
            <button type="button" class="btn-select-journey" data-journey-id="${jny.journey_id}">
              Select & Book →
            </button>
          </div>
        </div>

        <!-- Deterministic AI Explanation -->
        <div class="explanation-banner ${jny.rank === 1 ? 'rank-1-banner' : ''}">
          <span class="explanation-icon">💡</span>
          <div>${escapeHtml(jny.explanation)}</div>
        </div>

        <!-- Legs Accordion Toggle -->
        <button type="button" class="legs-toggle-btn" data-target="legs_${jny.journey_id}">
          <span>▼ Show Leg Details (${jny.number_of_legs} flight segment${jny.number_of_legs > 1 ? 's' : ''})</span>
        </button>

        <!-- Detailed Flight Legs List -->
        <div class="legs-container" id="legs_${jny.journey_id}" style="display: none;">
          ${jny.legs.map((leg, i) => `
            ${i > 0 ? `
              <div class="transfer-layover-divider">
                <span>⏱️ Transfer Layover at ${leg.origin_airport_name} (${leg.origin_airport_iata})</span>
              </div>
            ` : ''}
            <div class="leg-card">
              <div class="leg-carrier-info">
                <span class="leg-flight-num">${escapeHtml(leg.flight_number)}</span>
                <span class="leg-airline-name">${escapeHtml(leg.airline_name)}</span>
              </div>
              <div class="leg-route-times">
                <span class="leg-orig-dest">${leg.origin_airport_iata} ${formatTime(new Date(leg.departs_at))}</span>
                <span>→</span>
                <span class="leg-orig-dest">${leg.dest_airport_iata} ${formatTime(new Date(leg.arrives_at))}</span>
                <span class="stat-pill">${leg.duration_minutes}m flight</span>
                <span class="stat-pill">${leg.carbon_kg} kg CO₂</span>
              </div>
              <div class="leg-pricing-info">
                <div><strong>${leg.currency} ${formatMoney(leg.total_fare)}</strong></div>
                <div class="leg-fare-class">${leg.cabin_class} (${leg.fare_id})</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      journeysContainer.appendChild(card);
    });

    // Attach Leg Accordion Toggles
    document.querySelectorAll('.legs-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          const isHidden = targetEl.style.display === 'none';
          targetEl.style.display = isHidden ? 'flex' : 'none';
          btn.querySelector('span').textContent = isHidden ? '▲ Hide Leg Details' : '▼ Show Leg Details';
        }
      });
    });

    // Attach Booking Selection Handlers
    document.querySelectorAll('.btn-select-journey').forEach(btn => {
      btn.addEventListener('click', () => {
        const journeyId = btn.dataset.journeyId;
        const selected = journeys.find(j => j.journey_id === journeyId);
        if (selected) {
          openBookingModal(selected, passengers);
        }
      });
    });
  }

  // ==========================================================================
  // 8. Render Infeasible Rejected Candidates
  // ==========================================================================

  function renderRejected(rejected) {
    if (!rejected || rejected.length === 0) {
      rejectedSection.style.display = 'none';
      return;
    }

    rejectedSection.style.display = 'block';
    rejectedCountBadge.textContent = rejected.length;
    rejectedCardsList.innerHTML = '';

    rejected.forEach(cand => {
      const card = document.createElement('div');
      card.className = 'rejected-card';

      card.innerHTML = `
        <div class="rejected-card-header">
          <span>${cand.origin_display} → ${cand.destination_display} (${cand.transfer_count === 0 ? 'Direct' : cand.transfer_count + ' Transfer'})</span>
          <span>${cand.currency} ${formatMoney(cand.total_cost)} · ${cand.total_elapsed_duration_minutes}m</span>
        </div>
        <ul class="rejection-reasons-list">
          ${cand.rejection_reasons.map(r => `
            <li class="rejection-reason-item">
              <span>✕</span>
              <span>${escapeHtml(r)}</span>
            </li>
          `).join('')}
        </ul>
      `;
      rejectedCardsList.appendChild(card);
    });
  }

  // Toggle Rejected Accordion
  rejectedToggleBtn.addEventListener('click', () => {
    const isHidden = rejectedBody.style.display === 'none';
    rejectedBody.style.display = isHidden ? 'flex' : 'none';
    accordionArrow.classList.toggle('rotated', isHidden);
  });

  // ==========================================================================
  // 9. Booking Modal Handlers & Contract Execution
  // ==========================================================================

  function openBookingModal(journey, passengers = 1) {
    currentSelectedJourney = journey;
    generateNewIdempotencyKey();
    bookingOutcome.style.display = 'none';
    executeBookingBtn.disabled = false;
    executeBookingBtn.style.display = 'flex';

    const partySize = journey.passengers || passengers || 1;

    modalJourneySummary.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: 700; color: #ffffff;">${journey.origin_display} → ${journey.destination_display}</span>
        <span style="font-size: 1.15rem; font-weight: 800; color: var(--accent-cyan);">${journey.currency} ${formatMoney(journey.total_cost)}</span>
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 12px; flex-wrap: wrap;">
        <span>Passengers: <strong>${partySize}</strong></span>
        <span>Segments: <strong>${journey.number_of_legs}</strong></span>
        <span>Flights: <strong>${journey.legs.map(l => l.flight_number).join(', ')}</strong></span>
        <span>Duration: <strong>${journey.total_elapsed_duration_minutes}m</strong></span>
      </div>
    `;

    bookingModalBackdrop.style.display = 'flex';
  }

  function closeBookingModal() {
    bookingModalBackdrop.style.display = 'none';
    currentSelectedJourney = null;
  }

  modalCloseBtn.addEventListener('click', closeBookingModal);
  bookingModalBackdrop.addEventListener('click', (e) => {
    if (e.target === bookingModalBackdrop) closeBookingModal();
  });

  function generateNewIdempotencyKey() {
    const rand = Math.random().toString(36).substring(2, 10);
    bookingIdempotencyKey.value = `idem_${Date.now()}_${rand}`;
  }
  regenerateIdempotencyBtn.addEventListener('click', generateNewIdempotencyKey);

  // Execute Booking via Backend Contract
  executeBookingBtn.addEventListener('click', async () => {
    if (!currentSelectedJourney) return;

    const partySize = currentSelectedJourney.passengers || parseInt(passengerCountInput.value, 10) || 1;

    const payload = {
      journey_id: currentSelectedJourney.journey_id,
      user_id: bookingUserId.value.trim(),
      idempotency_key: bookingIdempotencyKey.value.trim(),
      total_amount: currentSelectedJourney.total_cost,
      currency: currentSelectedJourney.currency,
      items: currentSelectedJourney.legs.map(l => ({
        leg_index: l.leg_index,
        flight_id: l.flight_id,
        flight_number: l.flight_number,
        fare_id: l.fare_id,
        inventory_id: l.inventory_id,
        for_date: l.departs_at.substring(0, 10),
        units: partySize,
        unit_price: l.base_fare,
        taxes: l.taxes,
        currency: l.currency
      }))
    };

    bookingSpinner.style.display = 'inline-block';
    executeBookingBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/v1/journeys/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      renderBookingOutcome(data);

      // Save to session history for Bookings & Sagas Monitor
      recordSessionBooking({
        timestamp: new Date().toISOString(),
        journey: currentSelectedJourney,
        passengers: partySize,
        payload,
        result: data
      });

    } catch (err) {
      console.error('Booking execution error:', err);
      bookingOutcome.className = 'booking-outcome-container outcome-failed';
      bookingOutcome.innerHTML = `<div class="outcome-msg">Network error invoking booking contract: ${err.message}</div>`;
      bookingOutcome.style.display = 'flex';
    } finally {
      bookingSpinner.style.display = 'none';
    }
  });

  function renderBookingOutcome(res) {
    bookingOutcome.style.display = 'flex';
    let outcomeClass = 'outcome-confirmed';
    let badgeClass = 'badge-confirmed';

    if (res.status === 'PARTIALLY_FAILED') {
      outcomeClass = 'outcome-partially-failed';
      badgeClass = 'badge-partially-failed';
    } else if (res.status === 'FAILED' || res.status === 'REJECTED_NO_INVENTORY') {
      outcomeClass = 'outcome-failed';
      badgeClass = 'badge-failed';
    }

    bookingOutcome.className = `booking-outcome-container ${outcomeClass}`;
    bookingOutcome.innerHTML = `
      <div class="outcome-header">
        <span class="outcome-status-badge ${badgeClass}">${res.status}</span>
        ${res.booking_reference ? `<span class="outcome-ref">${res.booking_reference}</span>` : ''}
      </div>
      <p class="outcome-msg">${escapeHtml(res.message)}</p>
      <div class="outcome-legs-list">
        ${res.legs.map(leg => `
          <div class="outcome-leg-row">
            <span>Leg ${leg.leg_index + 1}: ${leg.flight_number} (${leg.fare_id})</span>
            <span style="font-weight: 700; color: ${leg.status === 'CONFIRMED' || leg.status === 'HELD' ? 'var(--accent-emerald)' : 'var(--accent-rose)'};">
              ${leg.status} ${leg.error_message ? `— ${escapeHtml(leg.error_message)}` : ''}
            </span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ==========================================================================
  // 10. Bookings & Sagas Session History Monitor
  // ==========================================================================

  const STORAGE_KEY = 'kognisync_session_bookings';

  function recordSessionBooking(record) {
    try {
      const existing = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
      existing.unshift(record);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.warn('Session storage write error:', e);
    }
  }

  function getSessionBookings() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function renderBookingsHistory() {
    if (!bookingsHistoryList) return;

    const records = getSessionBookings();
    if (records.length === 0) {
      bookingsHistoryList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No Bookings Executed Yet in Current Session</h3>
          <p>Select any journey from the <a href="#/explore" class="inline-link" id="emptyBookingsExploreLink">Explore Page</a> and invoke the booking contract to view live saga tracking.</p>
        </div>
      `;
      document.getElementById('emptyBookingsExploreLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveView('explore', true);
      });
      return;
    }

    bookingsHistoryList.innerHTML = '';
    records.forEach(rec => {
      const card = document.createElement('div');
      card.className = 'booking-record-card';
      const timeStr = new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      let badgeClass = 'badge-confirmed';
      if (rec.result.status === 'PARTIALLY_FAILED') badgeClass = 'badge-partially-failed';
      else if (rec.result.status === 'FAILED') badgeClass = 'badge-failed';

      card.innerHTML = `
        <div class="record-header">
          <div class="record-meta">
            <span class="outcome-status-badge ${badgeClass}">${rec.result.status}</span>
            <span class="record-ref">${rec.result.booking_reference || 'NO_REF'}</span>
            <span class="stat-pill">${timeStr}</span>
          </div>
          <span class="record-idempotency mono-font">Key: ${escapeHtml(rec.payload.idempotency_key)}</span>
        </div>

        <div class="record-route-row">
          <div>
            <strong>${rec.journey.origin_display} → ${rec.journey.destination_display}</strong>
            <span class="stat-pill" style="margin-left: 8px;">${rec.passengers} Passenger${rec.passengers > 1 ? 's' : ''}</span>
          </div>
          <div class="record-amount">${rec.journey.currency} ${formatMoney(rec.payload.total_amount)}</div>
        </div>

        <div class="record-legs-grid">
          ${rec.result.legs.map(l => `
            <div class="record-leg-item">
              <span>Leg ${l.leg_index + 1}: ${l.flight_number}</span>
              <span class="leg-status-tag ${l.status.toLowerCase()}">${l.status}</span>
            </div>
          `).join('')}
        </div>

        <div class="record-actions">
          <button type="button" class="btn-retry-idempotent" data-idem="${rec.payload.idempotency_key}">
            🔁 Test Idempotent Retry (Exact Same Key)
          </button>
        </div>
      `;
      bookingsHistoryList.appendChild(card);
    });

    // Wire up idempotent retry buttons to demonstrate deduplication contract
    document.querySelectorAll('.btn-retry-idempotent').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.idem;
        const record = records.find(r => r.payload.idempotency_key === key);
        if (!record) return;

        btn.disabled = true;
        btn.textContent = 'Submitting idempotent retry...';

        try {
          const res = await fetch(`${API_BASE}/api/v1/journeys/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record.payload)
          });
          const data = await res.json();
          alert(`Idempotent Response Received:\nStatus: ${data.status}\nBooking Ref: ${data.booking_reference}\nMessage: ${data.message}\nContract Guarantee: Zero duplicate inventory holds created.`);
        } catch (e) {
          alert(`Idempotent retry error: ${e.message}`);
        } finally {
          btn.disabled = false;
          btn.textContent = '🔁 Test Idempotent Retry (Exact Same Key)';
        }
      });
    });
  }

  if (refreshBookingsBtn) {
    refreshBookingsBtn.addEventListener('click', renderBookingsHistory);
  }

  // ==========================================================================
  // 11. Utility Helpers
  // ==========================================================================

  function setLoading(loading) {
    searchSubmitBtn.disabled = loading;
    searchSpinner.style.display = loading ? 'inline-block' : 'none';
  }

  function showAlert(msg, type = 'info') {
    feedbackAlert.className = `alert-box alert-${type}`;
    feedbackAlert.textContent = msg;
    feedbackAlert.style.display = 'block';
  }

  function hideAlert() {
    feedbackAlert.style.display = 'none';
  }

  function formatMoney(amount) {
    return parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatTime(d) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
