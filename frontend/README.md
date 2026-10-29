# KogniSync Frontend

The official frontend portal for **KogniSync** — an AI-powered multi-modal travel orchestration platform that understands natural-language travel intent, compares complete door-to-door journeys, optimizes Pareto trade-offs (cost, duration, comfort, carbon footprint), and coordinates distributed inventory holds.

---

## 🚀 Technology Stack

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with curated dark-slate/indigo/emerald aesthetic
- **Routing:** [React Router v7](https://reactrouter.com/)
- **State Management & Caching:** [TanStack Query v5](https://tanstack.com/query)
- **Iconography:** [Lucide React](https://lucide.dev/)
- **Typography:** Outfit (Display) & Plus Jakarta Sans (Body) via Google Fonts

---

## 🧭 Route Structure

| Route | View | Description |
| :--- | :--- | :--- |
| `/` | **Home / Journey Planner** | Hero section with natural language travel input, demo scenario chips, and multi-objective optimization sliders |
| `/plan` | **Journey Results** | Category tabs (*All*, *Cheapest*, *Best Value*, *Fastest*, *Greenest*), sorting controls, and Pareto trade-off matrix |
| `/plan/:journeyId` | **Journey Details** | Intermodal route spatial topology map, sequential transit timeline, transfer buffers, and AI rationale breakdown |
| `/booking/:journeyId` | **Booking Flow** | Distributed inventory hold activation (10m TTL countdown), traveler details intake, and payment authorization |
| `/trips/:tripId` | **Trip Confirmation** | Unified master PNR, QR code validation, per-segment tickets (platform, seat), calendar sync, and PDF pass export |

---

## 🛠️ Local Setup & Commands

### 1. Prerequisites
- **Node.js:** v18+ (verified on v22.22)
- **npm:** v9+

### 2. Installation
From the `frontend/` directory:
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Default | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://127.0.0.1:8000` | Base URL for FastAPI backend services |
| `VITE_USE_MOCK` | `true` | When `true`, provides high-fidelity mock fallback journeys if backend is offline or routes are in development |

### 4. Development Server
```bash
npm run dev
```
Launches the Vite local server at `http://localhost:5173`.

### 5. Production Build & Verification
```bash
npm run build
```
Executes TypeScript type checking (`tsc -b`) and bundles production assets into `dist/`.

---

## 🔌 API Integration & Architecture

API communication is centralized in `src/api/`:
- **`src/api/client.ts`**: Configurable fetch client with unified error handling and status code translation.
- **`src/api/journey.ts`**: Endpoints for `searchJourneys`, `getJourneyById`, and `extractTravelIntent`.
- **`src/api/booking.ts`**: Endpoints for `createHold`, `confirmBooking`, and `processPayment`.
- **`src/api/trips.ts`**: Endpoints for `getTripById` and unified ticket generation.

### Mock/Demo Mode
The frontend is built to be 100% testable out-of-the-box before backend journey endpoints are finalized. If the backend is unavailable or returns 404, it seamlessly activates the built-in multi-modal scenario engine covering:
1. **Cheapest:** Intercity AC Bus (₹850 · 6h 20m)
2. **Best Value:** Vande Bharat Express + Direct Metro Sync (₹1,450 · 5h 10m)
3. **Fastest:** Cab + IndiGo Flight Shuttle + Metro (₹4,800 · 3h 10m)
4. **Greenest:** All-Electric BYD Cab + Electric Shatabdi Quiet Coach (₹1,850 · 5h 30m · 6.2 kg CO₂)

---

## 🗺️ Google Maps / Routing Integration Strategy

The `JourneyMap` component (`src/components/details/JourneyMap.tsx`) uses a decoupled abstraction layer:
- Renders an interactive vector topology graph displaying origin, transfer nodes, destination, and transit legs colored by mode.
- Built with a pluggable provider interface:
  ```typescript
  interface JourneyMapProps {
    segments: JourneySegment[];
    selectedSegmentId?: string;
    onSegmentClick?: (id: string) => void;
  }
  ```
- To switch to Google Maps Platform JavaScript API or MapLibre, replace the inner renderer of `JourneyMap` with `@react-google-maps/api` or `maplibre-gl` without altering the `DetailsPage` consumer.

---

## 🔒 Invariant Preservation & Saga Guarantees

KogniSync enforces strict consistency throughout the UI:
- **Inventory Holds:** The UI displays a live 10-minute hold countdown timer matching backend Redis 7 key expiration.
- **Atomic Compensation:** If payment fails or a traveler cancels during checkout, the UI guarantees that held seats across all interline vendors are released cleanly.
