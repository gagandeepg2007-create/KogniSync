import re
import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from typing import Optional, List
from app.core.config import settings
from app.core.logging import logger
from .schemas import TravelContext, TravelIntent
from .prompts import build_intent_extraction_prompt


class GeminiIntentService:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = (api_key or settings.GEMINI_API_KEY or "").strip()
        self.model_name = model or getattr(settings, "GEMINI_MODEL", "models/gemini-3.5-flash-lite")
        # Ensure model name has 'models/' prefix for the Gemini REST endpoint
        if not self.model_name.startswith("models/"):
            self.model_name = f"models/{self.model_name}"

    def parse_travel_intent(
        self,
        text: str,
        current_context: Optional[TravelContext] = None,
        now: Optional[datetime] = None,
    ) -> TravelIntent:
        """
        Parses user travel intent using official Gemini API with structured JSON schema output.
        Distinguishes between authentication errors, quota limits, timeouts, and validation errors.
        """
        if not text or not text.strip():
            raise ValueError("Input text cannot be empty.")

        if not self.api_key:
            logger.error("GEMINI_API_KEY is missing from environment configuration.")
            raise ValueError("GEMINI_API_KEY is not configured on the backend.")

        if now is None:
            now = datetime.now()

        # Build dynamic prompt with Asia/Kolkata date context
        prompt = build_intent_extraction_prompt(text, current_context, now)
        schema = TravelIntent.model_json_schema()

        # Candidate models for high availability: primary verified model + fallback lite model
        candidate_models = [self.model_name]
        if self.model_name != "models/gemini-flash-lite-latest":
            candidate_models.append("models/gemini-flash-lite-latest")

        last_error = None

        for model in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/{model}:generateContent?key={self.api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "responseSchema": schema,
                    "temperature": 0.1,
                },
            }

            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=25.0) as resp:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    candidates = resp_data.get("candidates", [])
                    if not candidates:
                        raise ValueError("Gemini returned empty candidates.")

                    raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    if not raw_text:
                        raise ValueError("Gemini returned empty content text.")

                    parsed_json = json.loads(raw_text)
                    intent = TravelIntent.model_validate(parsed_json)
                    intent = self._apply_text_heuristics(intent, text, now=now)
                    merged_intent = self._merge_context(intent, current_context)
                    logger.info(f"Gemini ({model}) parsed intent successfully: {merged_intent.origin} -> {merged_intent.destination}")
                    return merged_intent

            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8", errors="replace")
                error_msg = err_body
                try:
                    err_json = json.loads(err_body)
                    error_msg = err_json.get("error", {}).get("message", err_body)
                except Exception:
                    pass

                logger.warning(f"Gemini API call to {model} failed (HTTP {e.code}): {error_msg}")

                if e.code in (401, 403):
                    raise PermissionError(f"Gemini API authentication failed (HTTP {e.code}): {error_msg}")
                elif e.code == 429:
                    raise RuntimeError(f"Gemini quota/rate limit exceeded (HTTP 429): {error_msg}")
                elif e.code == 404:
                    last_error = RuntimeError(f"Gemini model not found (HTTP 404): {error_msg}")
                elif e.code == 503:
                    # High demand spike, attempt next candidate model
                    last_error = RuntimeError(f"Gemini service unavailable (HTTP 503): {error_msg}")
                    continue
                else:
                    last_error = RuntimeError(f"Gemini API error (HTTP {e.code}): {error_msg}")

            except (urllib.error.URLError, TimeoutError) as e:
                logger.warning(f"Network timeout contacting Gemini model {model}: {e}")
                last_error = TimeoutError(f"Network timeout connecting to Gemini API: {e}")
                continue
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Gemini JSON output: {e}")
                last_error = ValueError(f"Invalid JSON response returned by Gemini: {e}")
                break
            except Exception as e:
                logger.error(f"Unexpected error in Gemini intent extraction: {e}")
                last_error = e
                break

        if last_error:
            raise last_error

        raise RuntimeError("Failed to extract travel intent from Gemini.")

    def _apply_text_heuristics(
        self, intent: TravelIntent, text: str, now: Optional[datetime] = None
    ) -> TravelIntent:
        """Safety fallback heuristic to ensure explicit endpoints and parameters in text are never lost."""
        t = text.strip()
        ref_now = now or datetime.now()

        # Check for 'reach <Dest> from <Origin>' pattern
        m_reach = re.search(r'\breach\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+from\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b', t, re.IGNORECASE)
        if m_reach:
            dest_cand, orig_cand = m_reach.group(1).strip().title(), m_reach.group(2).strip().title()
            if not intent.destination or intent.destination.strip().lower() == orig_cand.lower():
                intent.destination = dest_cand
            if not intent.origin:
                intent.origin = orig_cand

        # Check for 'from <Origin> to <Dest>' pattern
        m_from_to = re.search(r'\bfrom\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+to\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b', t, re.IGNORECASE)
        if m_from_to:
            orig_cand, dest_cand = m_from_to.group(1).strip().title(), m_from_to.group(2).strip().title()
            dest_cand = re.sub(r'\s+(?:this|tomorrow|today|next|before|by|on|at|under|with|for)\b.*$', '', dest_cand, flags=re.IGNORECASE).strip()
            if not intent.origin:
                intent.origin = orig_cand
            if not intent.destination:
                intent.destination = dest_cand

        # Check for 'to <Dest> from <Origin>' pattern
        m_to_from = re.search(r'\bto\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+from\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b', t, re.IGNORECASE)
        if m_to_from:
            dest_cand, orig_cand = m_to_from.group(1).strip().title(), m_to_from.group(2).strip().title()
            orig_cand = re.sub(r'\s+(?:this|tomorrow|today|next|before|by|on|at|under|with|for)\b.*$', '', orig_cand, flags=re.IGNORECASE).strip()
            if not intent.destination:
                intent.destination = dest_cand
            if not intent.origin:
                intent.origin = orig_cand

        # Check for explicit destination overrides like 'destination to <Dest>', 'change destination to <Dest>'
        m_dest_override = re.search(r'\b(?:destination\s+to|change\s+destination\s+to|to|reach|heading\s+to)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b', t, re.IGNORECASE)
        if m_dest_override and not m_from_to and not m_reach and not m_to_from:
            cand = m_dest_override.group(1).strip().title()
            cand = re.sub(r'\s+(?:from|to|this|tomorrow|today|next|before|by|on|at|under|with|for)\b.*$', '', cand, flags=re.IGNORECASE).strip()
            # Avoid matching stop words
            if cand and cand.lower() not in ('save', 'saving', 'speed', 'tomorrow', 'today', 'reach', 'find', 'get', 'anytime', 'from', 'to'):
                intent.destination = cand

        # Check for explicit origin overrides like 'origin to <Origin>', 'from <Origin>'
        m_orig_override = re.search(r'\b(?:origin\s+to|change\s+origin\s+to|leaving\s+from|from)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b', t, re.IGNORECASE)
        if m_orig_override and not m_from_to and not m_reach and not m_to_from:
            cand = m_orig_override.group(1).strip().title()
            cand = re.sub(r'\s+(?:to|from|this|tomorrow|today|next|before|by|on|at|under|with|for)\b.*$', '', cand, flags=re.IGNORECASE).strip()
            if cand and cand.lower() not in ('save', 'saving', 'speed', 'tomorrow', 'today', 'reach', 'find', 'get', 'to', 'from'):
                intent.origin = cand

        # Check for explicit budget if missing
        if intent.budget is None:
            m_budget = re.search(r'(?:₹|rs\.?|inr|budget\s*(?:is|of)?\s*)(\d{3,6})', t, re.IGNORECASE)
            if m_budget:
                intent.budget = float(m_budget.group(1))

        # Check for explicit arrival deadline if missing
        if not intent.arrival_deadline:
            m_arr = re.search(r'\b(?:before|by|arrive\s+by)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b', t, re.IGNORECASE)
            if m_arr:
                hour = int(m_arr.group(1))
                minute = m_arr.group(2) or "00"
                ampm = (m_arr.group(3) or "").lower()
                if ampm == "pm" and hour < 12:
                    hour += 12
                elif ampm == "am" and hour == 12:
                    hour = 0
                intent.arrival_deadline = f"{hour:02d}:{minute}"

        # Check for relative date keywords if missing
        if not intent.date:
            if re.search(r'\btomorrow\b', t, re.IGNORECASE):
                intent.date = (ref_now + timedelta(days=1)).strftime("%Y-%m-%d")
            elif re.search(r'\btoday\b', t, re.IGNORECASE):
                intent.date = ref_now.strftime("%Y-%m-%d")
            elif re.search(r'\bday\s+after\s+tomorrow\b', t, re.IGNORECASE):
                intent.date = (ref_now + timedelta(days=2)).strftime("%Y-%m-%d")
            elif re.search(r'\b(?:this\s+)?saturday\b', t, re.IGNORECASE):
                days_ahead = (5 - ref_now.weekday()) % 7
                if days_ahead == 0:
                    days_ahead = 7
                intent.date = (ref_now + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

        # Check for sustainability keywords if low
        if re.search(r'\b(?:eco-friendly|eco\s+friendly|green\s+trip|sustainable)\b', t, re.IGNORECASE):
            if intent.sustainability < 0.8:
                intent.sustainability = 1.0

        return intent

    def _merge_context(
        self, intent: TravelIntent, context: Optional[TravelContext]
    ) -> TravelIntent:
        """Preserves context fields if not extracted from text, ensuring no destination == origin collision."""
        if not context:
            return intent

        # Only merge origin from context if intent has no origin and it won't collide with intent.destination
        if not intent.origin and context.origin:
            if not intent.destination or intent.destination.strip().lower() != context.origin.strip().lower():
                intent.origin = context.origin

        # Only merge destination from context if intent has no destination and it won't collide with intent.origin
        if not intent.destination and context.destination:
            if not intent.origin or intent.origin.strip().lower() != context.destination.strip().lower():
                intent.destination = context.destination

        if not intent.date and context.date:
            intent.date = context.date
        if intent.budget is None and context.budget is not None:
            intent.budget = context.budget
        if intent.passengers == 1 and context.passengers > 1:
            intent.passengers = context.passengers
        if not intent.departure_time and context.departure_time:
            intent.departure_time = context.departure_time
        if not intent.arrival_deadline and context.arrival_deadline:
            intent.arrival_deadline = context.arrival_deadline
        if not intent.preferred_modes and context.preferred_modes:
            intent.preferred_modes = context.preferred_modes

        return intent


intent_service = GeminiIntentService()
