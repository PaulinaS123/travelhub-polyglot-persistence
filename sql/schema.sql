-- 3NF: trip attributes belong to trips, activity attributes belong to activities.
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  destination TEXT NOT NULL CHECK (length(trim(destination)) BETWEEN 1 AND 120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- PostgreSQL does not automatically index referencing columns.
CREATE INDEX IF NOT EXISTS idx_activities_trip_id ON activities(trip_id);
