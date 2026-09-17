-- KV Hackathon 2026 · travel data model v1.1.0-rc1
-- Only the 20 tables this problem statement needs.

-- SQLite has no DECIMAL type, and NUMERIC affinity would turn '8500.00' into the
-- float 8500.0. Money columns are therefore TEXT so the exact value survives.
PRAGMA foreign_keys = ON;

-- currencies  (Reference & geography)
CREATE TABLE currencies (
  currency_id                  TEXT PRIMARY KEY,
  iso4217                      TEXT NOT NULL UNIQUE,
  name                         TEXT NOT NULL,
  symbol                       TEXT NOT NULL,
  minor_unit_exponent          INTEGER NOT NULL,
  display_locale               TEXT NOT NULL,
  updated_at                   TEXT NOT NULL
);

-- fx_rates  (Reference & geography)
CREATE TABLE fx_rates (
  fx_rate_id                   TEXT PRIMARY KEY,
  base_currency                TEXT NOT NULL,
  quote_currency               TEXT NOT NULL,
  rate_date                    TEXT NOT NULL,
  rate                         NUMERIC(18,8) NOT NULL,
  source                       TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (base_currency) REFERENCES currencies(iso4217),
  FOREIGN KEY (quote_currency) REFERENCES currencies(iso4217),
  UNIQUE (base_currency, quote_currency, rate_date)
);

-- inventory_calendar  (Availability & pricing)
CREATE TABLE inventory_calendar (
  inventory_id                 TEXT PRIMARY KEY,
  entity_type                  TEXT NOT NULL,
  entity_id                    TEXT NOT NULL,
  for_date                     TEXT NOT NULL,
  total_units                  INTEGER NOT NULL,
  booked_units                 INTEGER NOT NULL,
  held_units                   INTEGER NOT NULL,
  price                        TEXT NOT NULL,
  currency                     TEXT NOT NULL,
  min_stay_nights              INTEGER NOT NULL,
  closed_to_arrival            INTEGER NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (currency) REFERENCES currencies(iso4217),
  UNIQUE (entity_type, entity_id, for_date),
  CHECK (booked_units + held_units <= total_units)
);

-- languages  (Reference & geography)
CREATE TABLE languages (
  language_id                  TEXT PRIMARY KEY,
  bcp47                        TEXT NOT NULL UNIQUE,
  english_name                 TEXT NOT NULL,
  native_name                  TEXT NOT NULL,
  script                       TEXT NOT NULL,
  rtl                          INTEGER NOT NULL,
  tts_supported                INTEGER NOT NULL,
  updated_at                   TEXT NOT NULL
);

-- countries  (Reference & geography)
CREATE TABLE countries (
  country_id                   TEXT PRIMARY KEY,
  iso2                         TEXT NOT NULL UNIQUE,
  iso3                         TEXT NOT NULL UNIQUE,
  name                         TEXT NOT NULL,
  default_currency             TEXT NOT NULL,
  calling_code                 TEXT NOT NULL,
  region                       TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (default_currency) REFERENCES currencies(iso4217)
);

-- airlines  (Reference & geography)
CREATE TABLE airlines (
  airline_id                   TEXT PRIMARY KEY,
  iata                         TEXT NOT NULL UNIQUE,
  name                         TEXT NOT NULL,
  alliance                     TEXT,
  country_id                   TEXT NOT NULL,
  low_cost                     INTEGER NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (country_id) REFERENCES countries(country_id)
);

-- cities  (Reference & geography)
CREATE TABLE cities (
  city_id                      TEXT PRIMARY KEY,
  name                         TEXT NOT NULL,
  state                        TEXT,
  country_id                   TEXT NOT NULL,
  country_code                 TEXT NOT NULL,
  lat                          NUMERIC(9,6) NOT NULL,
  lng                          NUMERIC(9,6) NOT NULL,
  timezone                     TEXT NOT NULL,
  region                       TEXT NOT NULL,
  population                   INTEGER,
  season_profile               TEXT NOT NULL,
  peak_months                  TEXT NOT NULL,
  primary_language             TEXT NOT NULL,
  description                  TEXT,
  status                       TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (country_id) REFERENCES countries(country_id),
  FOREIGN KEY (primary_language) REFERENCES languages(bcp47)
);

-- hotels  (Supply & catalogue)
CREATE TABLE hotels (
  hotel_id                     TEXT PRIMARY KEY,
  city_id                      TEXT NOT NULL,
  name                         TEXT NOT NULL,
  property_type                TEXT NOT NULL,
  star_rating                  INTEGER NOT NULL,
  guest_score                  NUMERIC(2,1),
  review_count                 INTEGER NOT NULL,
  address_line                 TEXT NOT NULL,
  lat                          NUMERIC(9,6) NOT NULL,
  lng                          NUMERIC(9,6) NOT NULL,
  distance_to_centre_km        NUMERIC(6,2) NOT NULL,
  description                  TEXT NOT NULL,
  base_currency                TEXT NOT NULL,
  checkin_time                 TEXT NOT NULL,
  checkout_time                TEXT NOT NULL,
  chain_code                   TEXT,
  has_xr_scene                 INTEGER NOT NULL,
  status                       TEXT NOT NULL,
  created_at                   TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (city_id) REFERENCES cities(city_id),
  FOREIGN KEY (base_currency) REFERENCES currencies(iso4217)
);

-- users  (Identity & preference)
CREATE TABLE users (
  user_id                      TEXT PRIMARY KEY,
  display_name                 TEXT NOT NULL,
  email                        TEXT NOT NULL UNIQUE,
  home_city_id                 TEXT NOT NULL,
  home_currency                TEXT NOT NULL,
  locale                       TEXT NOT NULL,
  budget_band                  TEXT NOT NULL,
  travel_style                 TEXT NOT NULL,
  traveller_type               TEXT NOT NULL,
  segment                      TEXT NOT NULL,
  date_of_signup               TEXT NOT NULL,
  loyalty_tier                 TEXT,
  status                       TEXT NOT NULL,
  created_at                   TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (home_city_id) REFERENCES cities(city_id),
  FOREIGN KEY (home_currency) REFERENCES currencies(iso4217),
  FOREIGN KEY (locale) REFERENCES languages(bcp47)
);

-- airports  (Reference & geography)
CREATE TABLE airports (
  airport_id                   TEXT PRIMARY KEY,
  iata                         TEXT NOT NULL UNIQUE,
  icao                         TEXT,
  name                         TEXT NOT NULL,
  city_id                      TEXT NOT NULL,
  lat                          NUMERIC(9,6) NOT NULL,
  lng                          NUMERIC(9,6) NOT NULL,
  timezone                     TEXT NOT NULL,
  is_international             INTEGER NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (city_id) REFERENCES cities(city_id)
);

-- flights  (Supply & catalogue)
CREATE TABLE flights (
  flight_id                    TEXT PRIMARY KEY,
  airline_id                   TEXT NOT NULL,
  flight_number                TEXT NOT NULL,
  origin_airport_id            TEXT NOT NULL,
  dest_airport_id              TEXT NOT NULL,
  departs_at                   TEXT NOT NULL,
  arrives_at                   TEXT NOT NULL,
  duration_minutes             INTEGER NOT NULL,
  stops                        INTEGER NOT NULL,
  aircraft_type                TEXT,
  cabin_classes                TEXT NOT NULL,
  carbon_kg                    NUMERIC(8,3) NOT NULL,
  status                       TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (airline_id) REFERENCES airlines(airline_id),
  FOREIGN KEY (origin_airport_id) REFERENCES airports(airport_id),
  FOREIGN KEY (dest_airport_id) REFERENCES airports(airport_id)
);

-- hotel_room_types  (Supply & catalogue)
CREATE TABLE hotel_room_types (
  room_type_id                 TEXT PRIMARY KEY,
  hotel_id                     TEXT NOT NULL,
  name                         TEXT NOT NULL,
  max_occupancy                INTEGER NOT NULL,
  max_adults                   INTEGER NOT NULL,
  max_children                 INTEGER NOT NULL,
  bed_config                   TEXT NOT NULL,
  size_sqm                     INTEGER,
  base_rate                    TEXT NOT NULL,
  currency                     TEXT NOT NULL,
  total_units                  INTEGER NOT NULL,
  smoking_allowed              INTEGER NOT NULL,
  status                       TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id),
  FOREIGN KEY (currency) REFERENCES currencies(iso4217)
);

-- trips  (Trip & itinerary)
CREATE TABLE trips (
  trip_id                      TEXT PRIMARY KEY,
  owner_user_id                TEXT NOT NULL,
  title                        TEXT NOT NULL,
  origin_city_id               TEXT,
  destination_city_id          TEXT NOT NULL,
  start_date                   TEXT NOT NULL,
  end_date                     TEXT NOT NULL,
  party_size                   INTEGER NOT NULL,
  adults                       INTEGER NOT NULL,
  children                     INTEGER NOT NULL,
  trip_type                    TEXT NOT NULL,
  is_group_trip                INTEGER NOT NULL,
  status                       TEXT NOT NULL,
  home_currency                TEXT NOT NULL,
  notes                        TEXT,
  created_at                   TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (owner_user_id) REFERENCES users(user_id),
  FOREIGN KEY (origin_city_id) REFERENCES cities(city_id),
  FOREIGN KEY (destination_city_id) REFERENCES cities(city_id),
  FOREIGN KEY (home_currency) REFERENCES currencies(iso4217)
);

-- flight_fares  (Supply & catalogue)
CREATE TABLE flight_fares (
  fare_id                      TEXT PRIMARY KEY,
  flight_id                    TEXT NOT NULL,
  cabin_class                  TEXT NOT NULL,
  fare_class                   TEXT NOT NULL,
  base_fare                    TEXT NOT NULL,
  taxes                        TEXT NOT NULL,
  currency                     TEXT NOT NULL,
  baggage_kg                   INTEGER NOT NULL,
  cabin_baggage_kg             INTEGER NOT NULL,
  changeable                   INTEGER NOT NULL,
  change_fee                   TEXT,
  refundable                   INTEGER NOT NULL,
  seats_total                  INTEGER NOT NULL,
  status                       TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (flight_id) REFERENCES flights(flight_id),
  FOREIGN KEY (currency) REFERENCES currencies(iso4217)
);

-- hotel_rate_plans  (Supply & catalogue)
CREATE TABLE hotel_rate_plans (
  rate_plan_id                 TEXT PRIMARY KEY,
  room_type_id                 TEXT NOT NULL,
  plan_type                    TEXT NOT NULL,
  name                         TEXT NOT NULL,
  price_delta                  TEXT NOT NULL,
  currency                     TEXT NOT NULL,
  cancellation_window_hours    INTEGER NOT NULL,
  cancellation_penalty_pct     INTEGER NOT NULL,
  includes_breakfast           INTEGER NOT NULL,
  min_stay_nights              INTEGER NOT NULL,
  status                       TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (room_type_id) REFERENCES hotel_room_types(room_type_id),
  FOREIGN KEY (currency) REFERENCES currencies(iso4217)
);

-- itineraries  (Trip & itinerary)
CREATE TABLE itineraries (
  itinerary_id                 TEXT PRIMARY KEY,
  trip_id                      TEXT NOT NULL,
  name                         TEXT NOT NULL,
  version                      INTEGER NOT NULL,
  is_active                    INTEGER NOT NULL,
  generated_by                 TEXT NOT NULL,
  total_cost                   TEXT NOT NULL,
  currency                     TEXT NOT NULL,
  total_duration_minutes       INTEGER NOT NULL,
  total_carbon_kg              NUMERIC(10,3) NOT NULL,
  optimizer_weights            TEXT,
  status                       TEXT NOT NULL,
  created_at                   TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
  FOREIGN KEY (currency) REFERENCES currencies(iso4217)
);

-- bookings  (Booking & money)
CREATE TABLE bookings (
  booking_id                   TEXT PRIMARY KEY,
  user_id                      TEXT NOT NULL,
  trip_id                      TEXT,
  itinerary_id                 TEXT,
  booking_reference            TEXT NOT NULL UNIQUE,
  channel                      TEXT NOT NULL,
  total_amount                 TEXT NOT NULL,
  currency                     TEXT NOT NULL,
  tax_amount                   TEXT NOT NULL,
  idempotency_key              TEXT NOT NULL UNIQUE,
  status                       TEXT NOT NULL,
  confirmed_at                 TEXT,
  cancelled_at                 TEXT,
  cancellation_reason          TEXT,
  created_at                   TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
  FOREIGN KEY (itinerary_id) REFERENCES itineraries(itinerary_id),
  FOREIGN KEY (currency) REFERENCES currencies(iso4217)
);

-- holds  (Availability & pricing)
CREATE TABLE holds (
  hold_id                      TEXT PRIMARY KEY,
  inventory_id                 TEXT NOT NULL,
  user_id                      TEXT NOT NULL,
  units                        INTEGER NOT NULL,
  idempotency_key              TEXT NOT NULL UNIQUE,
  created_at                   TEXT NOT NULL,
  expires_at                   TEXT NOT NULL,
  released_at                  TEXT,
  booking_id                   TEXT,
  status                       TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (inventory_id) REFERENCES inventory_calendar(inventory_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

-- payments  (Booking & money)
CREATE TABLE payments (
  payment_id                   TEXT PRIMARY KEY,
  booking_id                   TEXT NOT NULL,
  method                       TEXT NOT NULL,
  status                       TEXT NOT NULL,
  authorised_amount            TEXT NOT NULL,
  captured_amount              TEXT NOT NULL,
  refunded_amount              TEXT NOT NULL,
  currency                     TEXT NOT NULL,
  gateway_reference            TEXT NOT NULL,
  idempotency_key              TEXT NOT NULL UNIQUE,
  failure_code                 TEXT,
  authorised_at                TEXT,
  captured_at                  TEXT,
  created_at                   TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
  FOREIGN KEY (currency) REFERENCES currencies(iso4217)
);

-- booking_items  (Booking & money)
CREATE TABLE booking_items (
  booking_item_id              TEXT PRIMARY KEY,
  booking_id                   TEXT NOT NULL,
  entity_type                  TEXT NOT NULL,
  entity_id                    TEXT NOT NULL,
  inventory_id                 TEXT,
  title                        TEXT NOT NULL,
  for_date                     TEXT,
  units                        INTEGER NOT NULL,
  unit_price                   TEXT NOT NULL,
  line_total                   TEXT NOT NULL,
  currency                     TEXT NOT NULL,
  status                       TEXT NOT NULL,
  compensated_at               TEXT,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
  FOREIGN KEY (inventory_id) REFERENCES inventory_calendar(inventory_id),
  FOREIGN KEY (currency) REFERENCES currencies(iso4217)
);
