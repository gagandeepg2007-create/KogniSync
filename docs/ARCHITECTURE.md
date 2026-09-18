# KogniSync Architecture Overview

## Project Objective
KogniSync is a concurrency-safe distributed booking and inventory infrastructure built for Kognivera Hackathon 2026 (Problem Statement APS-05). It provides temporary inventory holds, strict data invariants (`booked + held <= total`), idempotency protection, line-item compensation/sagas, observability, and an AI Reliability Copilot.

---

## 🛑 Organizer Data Immutability Standard
The directory `BookingInventory/` contains organizer-provided canonical schemas, reference data, synthetic database records (`APS-05.db`), enum lists (`enums.json`), and validation tools (`tools/validate_conformance.py`).

**CRITICAL RULE:** The `BookingInventory/` directory is **100% IMMUTABLE AND READ-ONLY**. No files inside `BookingInventory/` may be modified, renamed, deleted, reformatted, or overwritten. All application source code, API routes, background workers, and persistent models are built around this authoritative reference standard.

---

## Verified Phase 0 Foundation Architecture

```mermaid
graph TD
    Client[HTTP Client / Pytest Suite] --> FastAPI[FastAPI App Gateway]
    FastAPI --> HealthRoute["Health Endpoints (/health, /health/db, /health/redis)"]
    
    subgraph Container Infrastructure (Docker Compose)
        HealthRoute --> PG["PostgreSQL 16 (Port 5434)"]
        HealthRoute --> Redis["Redis 7 (Port 6380)"]
    end
    
    subgraph Authoritative Reference Data
        OrgData["BookingInventory/ (Read-Only Schemas, Enums & Dataset)"]
    end

    FastAPI -. Reference Canonical Contract .-> OrgData
```

### Component Details:
1. **Backend Service (`backend/app`)**: FastAPI web framework running on Python 3.13/3.14. Handles application configuration via Pydantic `BaseSettings`, async database connections via SQLAlchemy 2.0 (`asyncpg`), and Redis connectivity (`redis.asyncio`).
2. **PostgreSQL Database (`kognisync-postgres`)**: PostgreSQL 16 container running on host port `5434` (isolated from native host Postgres).
3. **Redis Engine (`kognisync-redis`)**: Redis 7 container running on host port `6380` (isolated from external project Redis instances).
4. **Health & Connectivity Verification**: API endpoints `/health`, `/health/db`, and `/health/redis` providing real-time infrastructure readiness checks.

---

## Future Domain Architecture (Phase 1+)

The following domain components are planned for Phase 1+ implementation:
* **Domain Models & Repositories:** SQLAlchemy schemas reflecting canonical tables (`inventory_calendar`, `holds`, `bookings`, `booking_items`).
* **Distributed Hold Engine:** Sub-second TTL holds using Redis atomic scripts and locks.
* **Saga Compensation Coordinator:** Multi-item line-item booking confirmation and compensation handling.
* **AI Reliability Copilot:** Anomaly detection for inventory contention and hold failures.
* **Frontend Portal:** Client interface for user bookings and inventory monitoring.
