# Working with the data — APS-05

Everything in this folder is yours to use. It is fully synthetic: no real people, no personal
data, nothing scraped. It is safe to commit to a public repository.

**41,855 rows across 20 tables**, of which 14 are the tables your
statement is actually built on. The rest are small reference tables the others point at.

## Ninety seconds to your first query

```bash
sqlite3 data/APS-05.db < data/queries/starter_queries.sql
```

Or open `data/APS-05.db` in any SQLite client. Nothing to install, nothing to import.

## Into Postgres, if you would rather build properly

```bash
createdb travel
psql -d travel -f data/schema.sql
for f in data/csv/*.csv; do
  t=$(basename "$f" .csv | sed 's/^[0-9]*_//')
  psql -d travel -c "\copy $t FROM '$f' CSV HEADER"
done
```

The CSV filenames are numbered in load order, so foreign keys resolve as you go.

## The eight rules

These apply to the fields that came with the data. Anything you add yourself is entirely your
own business.

| # | Rule |
|---|---|
| R1 | **Additive only.** Add columns, tables and stores freely. Never rename, drop or repurpose a field that came with the data. If you need different semantics, add a new field beside it. |
| R2 | **IDs are opaque prefixed strings** — `htl_a91f3c`, `usr_0f22b1`. Never integers, never parsed for meaning, never re-issued. |
| R3 | **Money is a pair**: a fixed-point decimal with exactly 2 places, plus an ISO-4217 currency code. Never a float. |
| R4 | **Time is ISO-8601 with an offset.** Instant fields end `_at` and carry an offset; calendar dates end `_date` and have no zone. |
| R5 | **Enums are lowercase snake_case**, and the legal values are in `data/enums.json`. |
| R6 | **Language is a BCP-47 tag** — `ta`, `hi`, `en-IN`. Never "Tamil". |
| R7 | **Geography is WGS-84** decimal degrees to 6 places. A row has both `lat` and `lng`, or neither. |
| R8 | **Nothing is hard-deleted.** Mutable rows carry `status` and `updated_at`; cancellations and removals stay visible. |

They exist so that sixteen independent builds can be put together afterwards without a rewrite.

## Money, in full — the one that costs people an hour

The danger is not the storage type. It is the moment a value passes through a float on its way
somewhere, and a naive CSV parser does exactly that.

```python
# Python
from decimal import Decimal
rate = Decimal(row["base_rate"])          # never float(...)
```
```python
# pandas — keep money columns as text, then convert
df = pd.read_csv(p, dtype={"base_rate": str, "currency": str})
df["base_rate"] = df["base_rate"].map(Decimal)
```
```javascript
// JavaScript — a JSON number is an IEEE-754 double. Use a decimal library.
import Decimal from "decimal.js";
const rate = new Decimal(row.base_rate);  // row.base_rate is a STRING on purpose
```
```java
// Java / Kotlin
BigDecimal rate = new BigDecimal(row.get("base_rate"));
```

In `APS-05.db` the money columns are declared `TEXT`. That is deliberate: SQLite's NUMERIC
affinity would turn `8500.00` into the float `8500.0` and the exact value would be gone. Cast
to a number only for sorting, never for arithmetic you will show someone.

Splitting money between people uses **largest-remainder** allocation so the parts sum exactly to
the whole: ₹1000.00 three ways is `333.34 + 333.33 + 333.33`, never three times `333.33`.

## Currencies with 0 or 3 decimal places

JPY and KRW have no minor unit; KWD and BHD have three. They are still stored as 2-place
decimals with trailing zeros. The true exponent is in `currencies.minor_unit_exponent` and is
for display only.

## Checking your work

```bash
python3 tools/validate_conformance.py data/APS-05.db     # or point it at your own export
```

Standard library only, no install. It checks the mandatory core: IDs carry their prefixes, enum
values are legal, money is a 2-place decimal paired with a currency, timestamps carry offsets,
and foreign keys resolve. It prints PASS or FAIL. Run it in your first week rather than the hour
before you submit.

## If something in the data looks wrong

Ask on the data channel named in the email that sent you this folder — not in a DM and not in
your college group. If it is a real problem we would rather know early, and the answer goes to
everyone at once.
