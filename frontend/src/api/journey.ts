import { apiClient, USE_MOCK_FALLBACK } from './client';
import { Journey, TravelRequest } from '../types/journey';
import { MOCK_JOURNEYS } from './mockData';

export async function searchJourneys(request: TravelRequest): Promise<Journey[]> {
  try {
    if (!USE_MOCK_FALLBACK) {
      return await apiClient<Journey[]>('/api/v1/journeys/search', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    }
  } catch (err) {
    console.warn('Backend journey search unavailable, utilizing mock orchestration engine.', err);
  }

  // Realistic mock filtering and scoring based on weights
  await new Promise((resolve) => setTimeout(resolve, 600)); // simulated latency

  let results = [...MOCK_JOURNEYS];

  if (request.budgetMax && request.budgetMax > 0) {
    // If budget specified, categorize
    results = results.map((j) => {
      if (j.totalPrice > request.budgetMax!) {
        return {
          ...j,
          aiExplanation: {
            ...j.aiExplanation,
            summary: `${j.aiExplanation.summary} Note: Exceeds specified budget of ₹${request.budgetMax} by ₹${j.totalPrice - request.budgetMax!}.`,
          },
        };
      }
      return j;
    });
  }

  return results;
}

export async function getJourneyById(id: string): Promise<Journey | null> {
  try {
    if (!USE_MOCK_FALLBACK) {
      return await apiClient<Journey>(`/api/v1/journeys/${id}`);
    }
  } catch (err) {
    console.warn('Backend journey detail unavailable, reading from local cache/mock.', err);
  }

  await new Promise((resolve) => setTimeout(resolve, 300));
  const found = MOCK_JOURNEYS.find((j) => j.id === id);
  return found || null;
}

export interface TravelContext {
  origin?: string | null;
  destination?: string | null;
  date?: string | null;
  departure_time?: string | null;
  arrival_deadline?: string | null;
  passengers?: number;
  budget?: number | null;
  currency?: string;
  time_priority?: number;
  comfort?: number;
  sustainability?: number;
  preferred_modes?: string[];
}

export interface TravelIntent {
  origin?: string | null;
  destination?: string | null;
  date?: string | null;
  departure_time?: string | null;
  arrival_deadline?: string | null;
  passengers?: number;
  budget?: number | null;
  currency?: string;
  time_priority?: number;
  comfort?: number;
  sustainability?: number;
  preferred_modes?: string[];
  intent_summary?: string | null;
  confidence?: number;
}

export async function parseTravelIntent(
  text: string,
  currentContext?: TravelContext
): Promise<TravelIntent> {
  const res = await apiClient<{ intent: TravelIntent }>('/api/ai/parse-travel-intent', {
    method: 'POST',
    body: JSON.stringify({
      text,
      current_context: currentContext,
    }),
  });
  if (res?.intent) {
    return res.intent;
  }
  throw new Error('Gemini API did not return structured travel intent.');
}

export interface ExtractedIntent {
  origin?: string;
  destination?: string;
  budget?: number;
  timePriority?: 'speed' | 'economy' | 'balance' | 'eco';
  arrivalBefore?: string;
  inferredDate?: string;
  weights: {
    cost: number;
    duration: number;
    comfort: number;
    carbon: number;
  };
}

export async function extractTravelIntent(prompt: string): Promise<ExtractedIntent> {
  try {
    if (!USE_MOCK_FALLBACK) {
      return await apiClient<ExtractedIntent>('/api/v1/ai/extract-intent', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
    }
  } catch {
    // Graceful client fallback parser
  }

  // Client-side rule-based extractor for instant hackathon demo feedback
  await new Promise((resolve) => setTimeout(resolve, 400));

  const lower = prompt.toLowerCase();
  const intent: ExtractedIntent = {
    weights: { cost: 0.4, duration: 0.3, comfort: 0.2, carbon: 0.1 },
  };

  // Extract locations
  if (lower.includes('bangalore') || lower.includes('bengaluru')) {
    if (lower.indexOf('from bangalore') !== -1 || lower.indexOf('bangalore to') !== -1) {
      intent.origin = 'Bangalore';
    } else if (lower.indexOf('to bangalore') !== -1) {
      intent.destination = 'Bangalore';
    }
  }

  if (lower.includes('chennai')) {
    if (lower.indexOf('to chennai') !== -1 || lower.indexOf('reach chennai') !== -1) {
      intent.destination = 'Chennai';
    } else if (lower.indexOf('from chennai') !== -1) {
      intent.origin = 'Chennai';
    }
  }

  if (lower.includes('mumbai')) {
    if (lower.indexOf('to mumbai') !== -1) intent.destination = 'Mumbai';
    else intent.origin = 'Mumbai';
  }

  if (lower.includes('pune')) {
    if (lower.indexOf('to pune') !== -1) intent.destination = 'Pune';
    else intent.origin = 'Pune';
  }

  if (lower.includes('delhi')) {
    if (lower.indexOf('to delhi') !== -1) intent.destination = 'Delhi';
    else intent.origin = 'Delhi';
  }

  if (lower.includes('jaipur')) {
    if (lower.indexOf('to jaipur') !== -1) intent.destination = 'Jaipur';
    else intent.origin = 'Jaipur';
  }

  // Default demo pair if missing
  if (!intent.origin && !intent.destination) {
    intent.origin = 'Bangalore';
    intent.destination = 'Chennai';
  } else if (!intent.origin) {
    intent.origin = 'Bangalore';
  } else if (!intent.destination) {
    intent.destination = 'Chennai';
  }

  // Extract budget (₹ or Rs or number)
  const budgetMatch = prompt.match(/(?:₹|rs\.?|inr|budget\s*(?:is|of)?\s*)(\d{3,6})/i);
  if (budgetMatch && budgetMatch[1]) {
    intent.budget = parseInt(budgetMatch[1], 10);
  }

  // Extract time: e.g. "before 2 PM", "by 14:00"
  const timeMatch = prompt.match(/before\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const min = timeMatch[2] || '00';
    const ampm = timeMatch[3]?.toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    intent.arrivalBefore = `${hour.toString().padStart(2, '0')}:${min}`;
  }

  // Weight inferences
  if (lower.includes('saving money') || lower.includes('cheapest') || lower.includes('low budget') || lower.includes('budget')) {
    intent.weights = { cost: 0.55, duration: 0.2, comfort: 0.15, carbon: 0.1 };
    intent.timePriority = 'economy';
  } else if (lower.includes('fast') || lower.includes('speed') || lower.includes('urgent') || lower.includes('asap')) {
    intent.weights = { cost: 0.15, duration: 0.6, comfort: 0.2, carbon: 0.05 };
    intent.timePriority = 'speed';
  } else if (lower.includes('green') || lower.includes('carbon') || lower.includes('eco') || lower.includes('emission')) {
    intent.weights = { cost: 0.2, duration: 0.2, comfort: 0.1, carbon: 0.5 };
    intent.timePriority = 'eco';
  } else if (lower.includes('comfort') || lower.includes('luxury') || lower.includes('business')) {
    intent.weights = { cost: 0.15, duration: 0.3, comfort: 0.45, carbon: 0.1 };
    intent.timePriority = 'balance';
  }

  return intent;
}
