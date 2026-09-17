# APS-05 — Distributed Booking & Inventory System

**Start here.** This folder holds the data your team has been given for this problem statement, and the process for the design submission and hackathon day. The statement itself, its 24-hour scope and the XR requirement are on your statement's page in the hackathon application.

Kognivera Hackathon 2026 · Travel & Tourism · data model v1.1.0-rc1

## The seven steps, in order

### 1 · Read your statement in the application — 30 minutes

The problem statement, the 24-hour MVP scope, what a complete solution looks like and the XR device requirement all live on your statement's page in the hackathon application. Read all of it, including the parts that describe the full ambition — that is deliberately larger than what you will build.

### 2 · Fix your scope — 15 minutes

The MVP scope on that page is what you are actually building in 24 hours, and it is what your design will be read against. The gap between the full ambition and the MVP is not an oversight: deciding what to leave out, and being able to say why, is a large part of what separates a strong team from a busy one.

### 3 · Understand your data — 45 minutes

`01_YOUR_DATA_MODEL.pdf` lists all 20 tables you have been given — 14 that this statement lives in, plus reference tables — with every field.

Then do two things rather than just reading:

- **Open `02_DATA_MODEL_DIAGRAM.html`.** Download it first and open it from your own machine; SharePoint hands HTML over as a download rather than rendering it. It shows only your tables. Click each one.
- **Run `data/queries/starter_queries.sql`.** 7 queries, each with a comment explaining what it shows, all of them running as-is against `data/APS-05.db`:

```bash
sqlite3 data/APS-05.db < data/queries/starter_queries.sql
```

That is 41,855 rows of real, queryable travel data. It is fully synthetic — no real people, no personal data — so it is safe to commit to a public repository.

Before you write code, read `data/WORKING_WITH_THE_DATA.md`. It is short, and it covers the three conventions that cost teams the most time: money is a string and must never touch a float, IDs are opaque and must not be parsed, and language is a BCP-47 tag.

### 4 · Design it — this week

`03_DESIGN_SUBMISSION_GUIDE` lists exactly what your design document must contain: scope in and out, user journey, architecture, which tables you will use and what you are adding, your AI approach and how you will know it works, the tech stack, an hour-by-hour plan for the 24 hours, and your fallbacks.

### 5 · Submit the design — by 2 September

Through the hackathon application. Accepted formats, the 25 MB per-file limit and the 10-file limit are all in `03_DESIGN_SUBMISSION_GUIDE`.

> **You get one upload, and it locks.** There is no replace and no second attempt. Assemble everything, have someone outside the team read it, then upload.

### 6 · Build — 24 September 12:00 to 25 September 12:00

`04_HACKATHON_DAY_PROCESS` covers the whole thing: what to have ready beforehand, how the day runs, mentors, the 09:00 rule on the second morning, and what you submit at 12:00.

### 7 · Present — 25 September, after lunch. Finale 26 September

Presentations start post-lunch on the 25th. Results and prizes on the 26th. Also in `04_HACKATHON_DAY_PROCESS`.

---

## What is in this folder

| File | What it is |
|---|---|
| `01_YOUR_DATA_MODEL.md` / `.pdf` | Every table and field you have been given, and what each one is for. The PDF previews in SharePoint; the markdown is easier to search. |
| `02_DATA_MODEL_DIAGRAM.html` | Clickable diagram of your tables. Download, then open in a browser. |
| `03_DESIGN_SUBMISSION_GUIDE.md` / `.pdf` | What to submit on 2 September, in what format, and how. |
| `04_HACKATHON_DAY_PROCESS.md` / `.pdf` | How 24–26 September run. |
| `data/APS-05.db` | SQLite, indexed, only your tables. No setup. |
| `data/csv/` | The same rows as CSV, numbered in load order. |
| `data/queries/starter_queries.sql` | Queries that run as-is. Start here. |
| `data/schema.sql` · `data/schema.sqlite.sql` | DDL for your tables. |
| `data/enums.json` | The legal values for every enum column. |
| `data/WORKING_WITH_THE_DATA.md` | Loading instructions and the conventions. |
| `tools/validate_conformance.py` | Checks your data still conforms. Run it early. |
| `SHA256SUMS.txt` | `sha256sum -c SHA256SUMS.txt` to confirm your copy is intact. |

---

## Your deliverables and dates

| Date | What is due | Where |
|---|---|---|
| **2 September 2026** | Design submission — one upload, then locked | Hackathon application |
| By 17 September 2026 | Teams confirmed | — |
| **24 Sep 12:00 → 25 Sep 12:00** | The 24-hour build | On the day |
| **25 September, 12:00** | Running demo · solution write-up · final presentation · source repository and architecture note | On the day |
| 25 September, post-lunch | Presentations | On the day |
| 26 September 2026 | Finale and prizes | On the day |

---

## Two things worth knowing now

**A working build beats a polished deck.** Every statement is expected to show a genuine, working AI feature — not a mock, not a screenshot.

**Multilingual support matters.** At least one Indian language, wherever it is natural to your statement. The data is already multilingual, so this is less work than it sounds.

## Where to ask

Questions about **the data** go to the data channel named in the email that sent you this folder. Questions about **the process, the application or the dates** go to the organisers. Not DMs, and not your college group — an answer given once, in the right place, reaches everyone.
