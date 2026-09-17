-- KV Hackathon 2026 · travel data model v1.1.0-rc1
-- Only the 20 tables this problem statement needs.

CREATE EXTENSION IF NOT EXISTS vector;   -- optional, for embedding search

-- currencies  (Reference & geography)
CREATE TABLE currencies (
  currency_id                  TEXT PRIMARY KEY,
  iso4217                      CHAR(3) NOT NULL UNIQUE,
  name                         TEXT NOT NULL,
  symbol                       TEXT NOT NULL,
  minor_unit_exponent          SMALLINT NOT NULL,
  display_locale               TEXT NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- fx_rates  (Reference & geography)
CREATE TABLE fx_rates (
  fx_rate_id                   TEXT PRIMARY KEY,
  base_currency                CHAR(3) NOT NULL,
  quote_currency               CHAR(3) NOT NULL,
  rate_date                    DATE NOT NULL,
  rate                         NUMERIC(18,8) NOT NULL,
  source                       TEXT NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL,
  UNIQUE (base_currency, quote_currency, rate_date)
);

-- inventory_calendar  (Availability & pricing)
CREATE TABLE inventory_calendar (
  inventory_id                 TEXT PRIMARY KEY,
  entity_type                  TEXT NOT NULL CHECK (entity_type IN ('room_type', 'flight_fare', 'guide', 'poi')),
  entity_id                    TEXT NOT NULL,
  for_date                     DATE NOT NULL,
  total_units                  INTEGER NOT NULL,
  booked_units                 INTEGER NOT NULL,
  held_units                   INTEGER NOT NULL,
  price                        NUMERIC(12,2) NOT NULL,
  currency                     CHAR(3) NOT NULL,
  min_stay_nights              SMALLINT NOT NULL,
  closed_to_arrival            BOOLEAN NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL,
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
  rtl                          BOOLEAN NOT NULL,
  tts_supported                BOOLEAN NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- countries  (Reference & geography)
CREATE TABLE countries (
  country_id                   TEXT PRIMARY KEY,
  iso2                         CHAR(2) NOT NULL UNIQUE,
  iso3                         CHAR(3) NOT NULL UNIQUE,
  name                         TEXT NOT NULL,
  default_currency             CHAR(3) NOT NULL,
  calling_code                 TEXT NOT NULL,
  region                       TEXT NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- airlines  (Reference & geography)
CREATE TABLE airlines (
  airline_id                   TEXT PRIMARY KEY,
  iata                         CHAR(2) NOT NULL UNIQUE,
  name                         TEXT NOT NULL,
  alliance                     TEXT,
  country_id                   TEXT NOT NULL,
  low_cost                     BOOLEAN NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- cities  (Reference & geography)
CREATE TABLE cities (
  city_id                      TEXT PRIMARY KEY,
  name                         TEXT NOT NULL,
  state                        TEXT,
  country_id                   TEXT NOT NULL,
  country_code                 CHAR(2) NOT NULL,
  lat                          NUMERIC(9,6) NOT NULL,
  lng                          NUMERIC(9,6) NOT NULL,
  timezone                     TEXT NOT NULL,
  region                       TEXT NOT NULL,
  population                   INTEGER,
  season_profile               TEXT NOT NULL CHECK (season_profile IN ('winter', 'summer', 'monsoon', 'post_monsoon', 'spring', 'autumn')),
  peak_months                  TEXT NOT NULL,
  primary_language             TEXT NOT NULL,
  description                  TEXT,
  status                       TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived', 'draft')),
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- hotels  (Supply & catalogue)
CREATE TABLE hotels (
  hotel_id                     TEXT PRIMARY KEY,
  city_id                      TEXT NOT NULL,
  name                         TEXT NOT NULL,
  property_type                TEXT NOT NULL CHECK (property_type IN ('hotel', 'resort', 'homestay', 'hostel', 'apartment', 'boutique', 'heritage', 'guesthouse')),
  star_rating                  SMALLINT NOT NULL,
  guest_score                  NUMERIC(2,1),
  review_count                 INTEGER NOT NULL,
  address_line                 TEXT NOT NULL,
  lat                          NUMERIC(9,6) NOT NULL,
  lng                          NUMERIC(9,6) NOT NULL,
  distance_to_centre_km        NUMERIC(6,2) NOT NULL,
  description                  TEXT NOT NULL,
  base_currency                CHAR(3) NOT NULL,
  checkin_time                 TEXT NOT NULL,
  checkout_time                TEXT NOT NULL,
  chain_code                   TEXT,
  has_xr_scene                 BOOLEAN NOT NULL,
  status                       TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived', 'draft')),
  created_at                   TIMESTAMPTZ NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- users  (Identity & preference)
CREATE TABLE users (
  user_id                      TEXT PRIMARY KEY,
  display_name                 TEXT NOT NULL,
  email                        TEXT NOT NULL UNIQUE,
  home_city_id                 TEXT NOT NULL,
  home_currency                CHAR(3) NOT NULL,
  locale                       TEXT NOT NULL,
  budget_band                  TEXT NOT NULL CHECK (budget_band IN ('shoestring', 'value', 'mid', 'premium', 'luxury')),
  travel_style                 TEXT NOT NULL CHECK (travel_style IN ('budget', 'comfort', 'luxury', 'adventure', 'slow', 'cultural', 'wellness')),
  traveller_type               TEXT NOT NULL CHECK (traveller_type IN ('solo', 'couple', 'family', 'business', 'friends', 'senior', 'backpacker')),
  segment                      TEXT NOT NULL CHECK (segment IN ('heavy', 'light', 'cold_start')),
  date_of_signup               DATE NOT NULL,
  loyalty_tier                 TEXT,
  status                       TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived', 'draft')),
  created_at                   TIMESTAMPTZ NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- airports  (Reference & geography)
CREATE TABLE airports (
  airport_id                   TEXT PRIMARY KEY,
  iata                         CHAR(3) NOT NULL UNIQUE,
  icao                         CHAR(4),
  name                         TEXT NOT NULL,
  city_id                      TEXT NOT NULL,
  lat                          NUMERIC(9,6) NOT NULL,
  lng                          NUMERIC(9,6) NOT NULL,
  timezone                     TEXT NOT NULL,
  is_international             BOOLEAN NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- flights  (Supply & catalogue)
CREATE TABLE flights (
  flight_id                    TEXT PRIMARY KEY,
  airline_id                   TEXT NOT NULL,
  flight_number                TEXT NOT NULL,
  origin_airport_id            TEXT NOT NULL,
  dest_airport_id              TEXT NOT NULL,
  departs_at                   TIMESTAMPTZ NOT NULL,
  arrives_at                   TIMESTAMPTZ NOT NULL,
  duration_minutes             INTEGER NOT NULL,
  stops                        SMALLINT NOT NULL,
  aircraft_type                TEXT,
  cabin_classes                TEXT NOT NULL,
  carbon_kg                    NUMERIC(8,3) NOT NULL,
  status                       TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived', 'draft')),
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- hotel_room_types  (Supply & catalogue)
CREATE TABLE hotel_room_types (
  room_type_id                 TEXT PRIMARY KEY,
  hotel_id                     TEXT NOT NULL,
  name                         TEXT NOT NULL,
  max_occupancy                SMALLINT NOT NULL,
  max_adults                   SMALLINT NOT NULL,
  max_children                 SMALLINT NOT NULL,
  bed_config                   TEXT NOT NULL CHECK (bed_config IN ('single', 'twin', 'double', 'queen', 'king', 'bunk', 'twin_double')),
  size_sqm                     SMALLINT,
  base_rate                    NUMERIC(12,2) NOT NULL,
  currency                     CHAR(3) NOT NULL,
  total_units                  INTEGER NOT NULL,
  smoking_allowed              BOOLEAN NOT NULL,
  status                       TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived', 'draft')),
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- trips  (Trip & itinerary)
CREATE TABLE trips (
  trip_id                      TEXT PRIMARY KEY,
  owner_user_id                TEXT NOT NULL,
  title                        TEXT NOT NULL,
  origin_city_id               TEXT,
  destination_city_id          TEXT NOT NULL,
  start_date                   DATE NOT NULL,
  end_date                     DATE NOT NULL,
  party_size                   SMALLINT NOT NULL,
  adults                       SMALLINT NOT NULL,
  children                     SMALLINT NOT NULL,
  trip_type                    TEXT NOT NULL CHECK (trip_type IN ('solo', 'couple', 'family', 'business', 'friends', 'senior', 'backpacker')),
  is_group_trip                BOOLEAN NOT NULL,
  status                       TEXT NOT NULL CHECK (status IN ('draft', 'planning', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  home_currency                CHAR(3) NOT NULL,
  notes                        TEXT,
  created_at                   TIMESTAMPTZ NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- flight_fares  (Supply & catalogue)
CREATE TABLE flight_fares (
  fare_id                      TEXT PRIMARY KEY,
  flight_id                    TEXT NOT NULL,
  cabin_class                  TEXT NOT NULL CHECK (cabin_class IN ('economy', 'premium_economy', 'business', 'first')),
  fare_class                   TEXT NOT NULL CHECK (fare_class IN ('saver', 'flex', 'standard', 'corporate', 'promo')),
  base_fare                    NUMERIC(12,2) NOT NULL,
  taxes                        NUMERIC(12,2) NOT NULL,
  currency                     CHAR(3) NOT NULL,
  baggage_kg                   SMALLINT NOT NULL,
  cabin_baggage_kg             SMALLINT NOT NULL,
  changeable                   BOOLEAN NOT NULL,
  change_fee                   NUMERIC(12,2),
  refundable                   BOOLEAN NOT NULL,
  seats_total                  INTEGER NOT NULL,
  status                       TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived', 'draft')),
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- hotel_rate_plans  (Supply & catalogue)
CREATE TABLE hotel_rate_plans (
  rate_plan_id                 TEXT PRIMARY KEY,
  room_type_id                 TEXT NOT NULL,
  plan_type                    TEXT NOT NULL CHECK (plan_type IN ('refundable', 'non_refundable', 'breakfast_included', 'half_board', 'full_board', 'long_stay')),
  name                         TEXT NOT NULL,
  price_delta                  NUMERIC(12,2) NOT NULL,
  currency                     CHAR(3) NOT NULL,
  cancellation_window_hours    INTEGER NOT NULL,
  cancellation_penalty_pct     SMALLINT NOT NULL,
  includes_breakfast           BOOLEAN NOT NULL,
  min_stay_nights              SMALLINT NOT NULL,
  status                       TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived', 'draft')),
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- itineraries  (Trip & itinerary)
CREATE TABLE itineraries (
  itinerary_id                 TEXT PRIMARY KEY,
  trip_id                      TEXT NOT NULL,
  name                         TEXT NOT NULL,
  version                      INTEGER NOT NULL,
  is_active                    BOOLEAN NOT NULL,
  generated_by                 TEXT NOT NULL CHECK (generated_by IN ('user', 'ai_planner', 'optimizer', 'agent', 'vote', 'import')),
  total_cost                   NUMERIC(12,2) NOT NULL,
  currency                     CHAR(3) NOT NULL,
  total_duration_minutes       INTEGER NOT NULL,
  total_carbon_kg              NUMERIC(10,3) NOT NULL,
  optimizer_weights            TEXT,
  status                       TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived', 'draft')),
  created_at                   TIMESTAMPTZ NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- bookings  (Booking & money)
CREATE TABLE bookings (
  booking_id                   TEXT PRIMARY KEY,
  user_id                      TEXT NOT NULL,
  trip_id                      TEXT,
  itinerary_id                 TEXT,
  booking_reference            TEXT NOT NULL UNIQUE,
  channel                      TEXT NOT NULL CHECK (channel IN ('web', 'mobile_app', 'partner', 'call_centre', 'agent')),
  total_amount                 NUMERIC(12,2) NOT NULL,
  currency                     CHAR(3) NOT NULL,
  tax_amount                   NUMERIC(12,2) NOT NULL,
  idempotency_key              TEXT NOT NULL UNIQUE,
  status                       TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'partially_confirmed', 'cancelled', 'failed', 'refunded')),
  confirmed_at                 TIMESTAMPTZ,
  cancelled_at                 TIMESTAMPTZ,
  cancellation_reason          TEXT,
  created_at                   TIMESTAMPTZ NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- holds  (Availability & pricing)
CREATE TABLE holds (
  hold_id                      TEXT PRIMARY KEY,
  inventory_id                 TEXT NOT NULL,
  user_id                      TEXT NOT NULL,
  units                        INTEGER NOT NULL,
  idempotency_key              TEXT NOT NULL UNIQUE,
  created_at                   TIMESTAMPTZ NOT NULL,
  expires_at                   TIMESTAMPTZ NOT NULL,
  released_at                  TIMESTAMPTZ,
  booking_id                   TEXT,
  status                       TEXT NOT NULL CHECK (status IN ('active', 'confirmed', 'released', 'expired')),
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- payments  (Booking & money)
CREATE TABLE payments (
  payment_id                   TEXT PRIMARY KEY,
  booking_id                   TEXT NOT NULL,
  method                       TEXT NOT NULL CHECK (method IN ('card', 'upi', 'netbanking', 'wallet', 'mock')),
  status                       TEXT NOT NULL CHECK (status IN ('initiated', 'authorised', 'captured', 'failed', 'refunded', 'voided')),
  authorised_amount            NUMERIC(12,2) NOT NULL,
  captured_amount              NUMERIC(12,2) NOT NULL,
  refunded_amount              NUMERIC(12,2) NOT NULL,
  currency                     CHAR(3) NOT NULL,
  gateway_reference            TEXT NOT NULL,
  idempotency_key              TEXT NOT NULL UNIQUE,
  failure_code                 TEXT CHECK (failure_code IN ('hold_expired', 'sold_out', 'over_budget', 'invalid_id', 'currency_mismatch', 'idempotency_conflict', 'constraint_infeasible', 'low_confidence')),
  authorised_at                TIMESTAMPTZ,
  captured_at                  TIMESTAMPTZ,
  created_at                   TIMESTAMPTZ NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- booking_items  (Booking & money)
CREATE TABLE booking_items (
  booking_item_id              TEXT PRIMARY KEY,
  booking_id                   TEXT NOT NULL,
  entity_type                  TEXT NOT NULL CHECK (entity_type IN ('hotel', 'room_type', 'rate_plan', 'flight', 'flight_fare', 'poi', 'package', 'package_component', 'guide', 'transfer', 'event', 'xr_scene')),
  entity_id                    TEXT NOT NULL,
  inventory_id                 TEXT,
  title                        TEXT NOT NULL,
  for_date                     DATE,
  units                        INTEGER NOT NULL,
  unit_price                   NUMERIC(12,2) NOT NULL,
  line_total                   NUMERIC(12,2) NOT NULL,
  currency                     CHAR(3) NOT NULL,
  status                       TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'compensated')),
  compensated_at               TIMESTAMPTZ,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- foreign keys
ALTER TABLE fx_rates ADD CONSTRAINT fk_fx_rates_base_currency FOREIGN KEY (base_currency) REFERENCES currencies(iso4217);
ALTER TABLE fx_rates ADD CONSTRAINT fk_fx_rates_quote_currency FOREIGN KEY (quote_currency) REFERENCES currencies(iso4217);
ALTER TABLE inventory_calendar ADD CONSTRAINT fk_inventory_calendar_currency FOREIGN KEY (currency) REFERENCES currencies(iso4217);
ALTER TABLE countries ADD CONSTRAINT fk_countries_default_currency FOREIGN KEY (default_currency) REFERENCES currencies(iso4217);
ALTER TABLE airlines ADD CONSTRAINT fk_airlines_country_id FOREIGN KEY (country_id) REFERENCES countries(country_id);
ALTER TABLE cities ADD CONSTRAINT fk_cities_country_id FOREIGN KEY (country_id) REFERENCES countries(country_id);
ALTER TABLE cities ADD CONSTRAINT fk_cities_primary_language FOREIGN KEY (primary_language) REFERENCES languages(bcp47);
ALTER TABLE hotels ADD CONSTRAINT fk_hotels_city_id FOREIGN KEY (city_id) REFERENCES cities(city_id);
ALTER TABLE hotels ADD CONSTRAINT fk_hotels_base_currency FOREIGN KEY (base_currency) REFERENCES currencies(iso4217);
ALTER TABLE users ADD CONSTRAINT fk_users_home_city_id FOREIGN KEY (home_city_id) REFERENCES cities(city_id);
ALTER TABLE users ADD CONSTRAINT fk_users_home_currency FOREIGN KEY (home_currency) REFERENCES currencies(iso4217);
ALTER TABLE users ADD CONSTRAINT fk_users_locale FOREIGN KEY (locale) REFERENCES languages(bcp47);
ALTER TABLE airports ADD CONSTRAINT fk_airports_city_id FOREIGN KEY (city_id) REFERENCES cities(city_id);
ALTER TABLE flights ADD CONSTRAINT fk_flights_airline_id FOREIGN KEY (airline_id) REFERENCES airlines(airline_id);
ALTER TABLE flights ADD CONSTRAINT fk_flights_origin_airport_id FOREIGN KEY (origin_airport_id) REFERENCES airports(airport_id);
ALTER TABLE flights ADD CONSTRAINT fk_flights_dest_airport_id FOREIGN KEY (dest_airport_id) REFERENCES airports(airport_id);
ALTER TABLE hotel_room_types ADD CONSTRAINT fk_hotel_room_types_hotel_id FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id);
ALTER TABLE hotel_room_types ADD CONSTRAINT fk_hotel_room_types_currency FOREIGN KEY (currency) REFERENCES currencies(iso4217);
ALTER TABLE trips ADD CONSTRAINT fk_trips_owner_user_id FOREIGN KEY (owner_user_id) REFERENCES users(user_id);
ALTER TABLE trips ADD CONSTRAINT fk_trips_origin_city_id FOREIGN KEY (origin_city_id) REFERENCES cities(city_id);
ALTER TABLE trips ADD CONSTRAINT fk_trips_destination_city_id FOREIGN KEY (destination_city_id) REFERENCES cities(city_id);
ALTER TABLE trips ADD CONSTRAINT fk_trips_home_currency FOREIGN KEY (home_currency) REFERENCES currencies(iso4217);
ALTER TABLE flight_fares ADD CONSTRAINT fk_flight_fares_flight_id FOREIGN KEY (flight_id) REFERENCES flights(flight_id);
ALTER TABLE flight_fares ADD CONSTRAINT fk_flight_fares_currency FOREIGN KEY (currency) REFERENCES currencies(iso4217);
ALTER TABLE hotel_rate_plans ADD CONSTRAINT fk_hotel_rate_plans_room_type_id FOREIGN KEY (room_type_id) REFERENCES hotel_room_types(room_type_id);
ALTER TABLE hotel_rate_plans ADD CONSTRAINT fk_hotel_rate_plans_currency FOREIGN KEY (currency) REFERENCES currencies(iso4217);
ALTER TABLE itineraries ADD CONSTRAINT fk_itineraries_trip_id FOREIGN KEY (trip_id) REFERENCES trips(trip_id);
ALTER TABLE itineraries ADD CONSTRAINT fk_itineraries_currency FOREIGN KEY (currency) REFERENCES currencies(iso4217);
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user_id FOREIGN KEY (user_id) REFERENCES users(user_id);
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_trip_id FOREIGN KEY (trip_id) REFERENCES trips(trip_id);
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_itinerary_id FOREIGN KEY (itinerary_id) REFERENCES itineraries(itinerary_id);
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_currency FOREIGN KEY (currency) REFERENCES currencies(iso4217);
ALTER TABLE holds ADD CONSTRAINT fk_holds_inventory_id FOREIGN KEY (inventory_id) REFERENCES inventory_calendar(inventory_id);
ALTER TABLE holds ADD CONSTRAINT fk_holds_user_id FOREIGN KEY (user_id) REFERENCES users(user_id);
ALTER TABLE holds ADD CONSTRAINT fk_holds_booking_id FOREIGN KEY (booking_id) REFERENCES bookings(booking_id);
ALTER TABLE payments ADD CONSTRAINT fk_payments_booking_id FOREIGN KEY (booking_id) REFERENCES bookings(booking_id);
ALTER TABLE payments ADD CONSTRAINT fk_payments_currency FOREIGN KEY (currency) REFERENCES currencies(iso4217);
ALTER TABLE booking_items ADD CONSTRAINT fk_booking_items_booking_id FOREIGN KEY (booking_id) REFERENCES bookings(booking_id);
ALTER TABLE booking_items ADD CONSTRAINT fk_booking_items_inventory_id FOREIGN KEY (inventory_id) REFERENCES inventory_calendar(inventory_id);
ALTER TABLE booking_items ADD CONSTRAINT fk_booking_items_currency FOREIGN KEY (currency) REFERENCES currencies(iso4217);

-- indexes
CREATE INDEX idx_fx_rates_base_currency ON fx_rates(base_currency);
CREATE INDEX idx_fx_rates_quote_currency ON fx_rates(quote_currency);
CREATE INDEX idx_inventory_calendar_currency ON inventory_calendar(currency);
CREATE INDEX idx_countries_default_currency ON countries(default_currency);
CREATE INDEX idx_airlines_country_id ON airlines(country_id);
CREATE INDEX idx_cities_country_id ON cities(country_id);
CREATE INDEX idx_cities_primary_language ON cities(primary_language);
CREATE INDEX idx_hotels_city_id ON hotels(city_id);
CREATE INDEX idx_hotels_base_currency ON hotels(base_currency);
CREATE INDEX idx_users_home_city_id ON users(home_city_id);
CREATE INDEX idx_users_home_currency ON users(home_currency);
CREATE INDEX idx_users_locale ON users(locale);
CREATE INDEX idx_airports_city_id ON airports(city_id);
CREATE INDEX idx_flights_airline_id ON flights(airline_id);
CREATE INDEX idx_flights_origin_airport_id ON flights(origin_airport_id);
CREATE INDEX idx_flights_dest_airport_id ON flights(dest_airport_id);
CREATE INDEX idx_hotel_room_types_hotel_id ON hotel_room_types(hotel_id);
CREATE INDEX idx_hotel_room_types_currency ON hotel_room_types(currency);
CREATE INDEX idx_trips_owner_user_id ON trips(owner_user_id);
CREATE INDEX idx_trips_origin_city_id ON trips(origin_city_id);
CREATE INDEX idx_trips_destination_city_id ON trips(destination_city_id);
CREATE INDEX idx_trips_home_currency ON trips(home_currency);
CREATE INDEX idx_flight_fares_flight_id ON flight_fares(flight_id);
CREATE INDEX idx_flight_fares_currency ON flight_fares(currency);
CREATE INDEX idx_hotel_rate_plans_room_type_id ON hotel_rate_plans(room_type_id);
CREATE INDEX idx_hotel_rate_plans_currency ON hotel_rate_plans(currency);
CREATE INDEX idx_itineraries_trip_id ON itineraries(trip_id);
CREATE INDEX idx_itineraries_currency ON itineraries(currency);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX idx_bookings_itinerary_id ON bookings(itinerary_id);
CREATE INDEX idx_bookings_currency ON bookings(currency);
CREATE INDEX idx_holds_inventory_id ON holds(inventory_id);
CREATE INDEX idx_holds_user_id ON holds(user_id);
CREATE INDEX idx_holds_booking_id ON holds(booking_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_currency ON payments(currency);
CREATE INDEX idx_booking_items_booking_id ON booking_items(booking_id);
CREATE INDEX idx_booking_items_inventory_id ON booking_items(inventory_id);
CREATE INDEX idx_booking_items_currency ON booking_items(currency);