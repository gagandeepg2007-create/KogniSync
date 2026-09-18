# KogniSync Team Development Workflow

## Team Overview
KogniSync is developed by a 3-member engineering team. This document outlines the Git branching strategy, collaboration rules, and quality gates required to maintain project stability.

---

## 🛑 Immutable Core Rule
**DO NOT MODIFY ANYTHING INSIDE `BookingInventory/`.**
The `BookingInventory/` directory contains organizer-provided canonical schemas, reference data, SQLite databases, enum specifications, and validation scripts. It is the single source of truth for all domain rules (R1–R8) and MUST REMAIN COMPLETELY UNTOUCHED.

---

## Branching Strategy

All team members work on isolated feature or fix branches created from `main`.

### Naming Conventions:
* **Features:** `feature/<member-name>/<feature-name>`  
  *(Example: `feature/gagan/hold-expiration-service`)*
* **Bug Fixes:** `fix/<member-name>/<issue-name>`  
  *(Example: `fix/alex/enum-validation-bug`)*
* **Infrastructure / Scaffolding:** `infra/<member-name>/<topic>`  
  *(Example: `infra/team-lead/redis-port-config`)*

---

## Daily Development Workflow

1. **Synchronize Before Starting:**  
   Always update your local `main` branch and rebase your feature branch before starting new work:
   ```bash
   git checkout main
   git pull --rebase origin main
   git checkout feature/<your-name>/<feature-name>
   git rebase main
   ```

2. **Isolated Environment & Service Ports:**  
   Local infrastructure services run via Docker Compose on dedicated ports:
   * **PostgreSQL:** Port `5434`
   * **Redis:** Port `6380`

3. **Running Foundation Verification Tests:**  
   Before creating a Pull Request, run the automated test suite:
   ```bash
   .\.venv\Scripts\pytest backend/tests/ -v
   ```
   All tests must pass cleanly.

---

## Pull Request & Merge Policy

1. **Direct pushes to `main` are prohibited.** All work must enter `main` via reviewed Pull Requests.
2. **Pre-merge Requirements:**
   * Automated tests pass (`pytest` green).
   * Organizer validation script passes (`python BookingInventory/tools/validate_conformance.py data/APS-05.db`).
   * Zero changes inside `BookingInventory/`.
3. **Infrastructure Changes:**  
   Changes to shared infrastructure (`docker-compose.yml`, root `.env.example`, database migrations) must be coordinated by the Team Lead before merging.
