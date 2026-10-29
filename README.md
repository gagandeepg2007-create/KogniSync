# KogniSync — AI-Powered Multi-Modal Travel Orchestration
**KogniVera Hackathon 2026 · Problem Statement APS-05**  
*Booking Correctness Under Concurrency | PostgreSQL Row Locking | Reliability Testing*

---

## 🌟 Overview & Core Differentiator
KogniSync combines **Journey Intelligence** with **Verified Booking Reliability**. While orchestrating complex multi-modal travel across hotels, flights, and activities, KogniSync guarantees absolute booking correctness under high concurrency.

### Central Invariant
$$\text{booked\_units} + \text{held\_units} \le \text{total\_units}$$
During concurrent hold requests, hold expirations, retries, and payment failures, this invariant is guaranteed never to be violated ($\text{overallocation} = 0$).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.13 / 3.14
- Docker & Docker Compose
- PostgreSQL 16 (included in Docker Compose)
- Redis 7 (included in Docker Compose)

### 2. Start Infrastructure
```powershell
docker compose up -d
```
PostgreSQL runs on port `5434`, Redis on port `6380`.

### 3. Initialize Database
Loads canonical schema and starter datasets from `BookingInventory/` (pristine & untouched):
```powershell
.\.venv\Scripts\python.exe scripts/init_db.py
```

### 4. Run Backend Server
```powershell
.\.venv\Scripts\uvicorn.exe backend.app.main:app --reload --port 8000
```
API Documentation will be available at `http://localhost:8000/docs`.

---

## 🧪 Testing & Verification

### Run Full Test Suite (34/34 Passed)
```powershell
.\.venv\Scripts\pytest.exe backend/tests/ -v
```

### Run 12 Concurrency Scenarios (A–L)
```powershell
.\.venv\Scripts\pytest.exe backend/tests/test_concurrency.py -v
```

### Run 500-Request Contention Benchmark
```powershell
.\.venv\Scripts\python.exe scripts/run_concurrency_experiment.py
```

### Run Solution A vs Solution B Benchmark
```powershell
.\.venv\Scripts\python.exe scripts/compare_concurrency_solutions.py
```

---

## 📊 Live Benchmark Results (500 Requests / 3 Units)

Executed against real PostgreSQL 16:
```text
==============================================================================
KOGNISYNC CONCURRENCY ARCHITECTURE COMPARISON — 500 REQUESTS / 3 UNITS
==============================================================================
Metric                           | Solution A (Pessimistic) | Solution B (Optimistic)
------------------------------------------------------------------------------
Initial Capacity                 | 3                        | 3                   
Concurrent Requests              | 500                      | 500                 
Successful Allocations           | 3                        | 3                   
Rejected Requests                | 497                      | 497                 
Final Held Units                 | 3                        | 3                   
Overallocations                  | 0                        | 0                   
Invariant Violations             | 0                        | 0                   
Total Elapsed Time               | 2.67s                    | 0.63s
Throughput (req/s)               | 187.1 req/s              | 796.1 req/s
p50 Latency                      | 1711.9 ms                | 284.9 ms
p95 Latency                      | 2596.6 ms                | 576.0 ms
p99 Latency                      | 2627.1 ms                | 611.3 ms
Correctness Guarantee            | 100% (0 violations)      | 100% (0 violations) 
==============================================================================
```

---

## 🛡️ Organizer Immutability Guarantee
The directory `BookingInventory/` remains **100% immutable and untouched** (`git diff -- BookingInventory/` returns 0 modifications). All 20 canonical tables and data relationships conform strictly to the organizer specification.
