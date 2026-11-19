# TravelHub Mini — Polyglot Persistence (SQL vs NoSQL)

A **local class demonstration** of the same trip-planning feature in PostgreSQL and MongoDB. Pick a database in the UI, then create, read, update and delete trips and activities. **The engines use separate datasets, not synchronized copies.** No login/auth; keep it local.

## 1. Data architecture

**PostgreSQL (normalized, 3NF)**

```text
TRIPS
  id UUID PK
  name TEXT NOT NULL
  destination TEXT NOT NULL
  created_at TIMESTAMPTZ
        | 1
        | ON DELETE CASCADE
        | many
ACTIVITIES
  id UUID PK
  trip_id UUID FK -> trips.id  (indexed)
  title TEXT NOT NULL
  created_at TIMESTAMPTZ
```

See executable DDL: [`sql/schema.sql`](sql/schema.sql). All user input in SQL statements is passed as bound parameters (`$1`, `$2`, etc.). The `trips` and `activities` tables avoid duplicating trip metadata in each activity.

**MongoDB (query-oriented embedded document)**

```json
{
  "_id": "ObjectId('...')",
  "name": "Italy Adventure",
  "destination": "Rome",
  "createdAt": "2026-11-17T00:00:00.000Z",
  "activities": [
    { "id": "UUID", "title": "Visit the Colosseum", "createdAt": "2026-11-17T00:00:00.000Z" }
  ]
}
```

A trip with its activities is read with one MongoDB `findOne` rather than joins/separate collections. MongoDB `$push` and positional `$set` update embedded activities atomically within one document. Embedded arrays should remain reasonably bounded.

## 2. Prerequisites and setup

- Node.js 20+; npm
- Docker Desktop running (with Compose)
- Optional: VS Code, Postman, MongoDB Compass, pgAdmin

```bash
cp .env.example .env
npm install
docker compose up -d
docker compose ps
npm start
```

Open **http://localhost:3000**. The Docker Compose service initializes PostgreSQL schema on **first** volume creation. If you change the schema after initial startup, run the SQL manually, or remove local volumes (destructive): `docker compose down -v && docker compose up -d`.

If MongoDB isn't ready, wait until both Docker health checks pass and restart the Node app.

Useful database inspections:

```bash
# PostgreSQL: tables + inspect records
docker compose exec postgres psql -U travelhub -d travelhub -c '\dt'
docker compose exec postgres psql -U travelhub -d travelhub -c 'SELECT t.name, a.title FROM trips t LEFT JOIN activities a ON a.trip_id=t.id;'

# MongoDB: show embedded trip data
docker compose exec mongo mongosh travelhub_polyglot --quiet --eval 'db.trips.find().pretty()'
```

## 3. API endpoints

Prefix each route with `/api/sql` or `/api/mongo`.

| Method | Route | Description |
|---|---|---|
| GET | `/trips` | List trips, including activities |
| POST | `/trips` | Create trip `{ "name": "...", "destination": "..." }` |
| GET | `/trips/:id` | Read one trip and activities |
| PATCH | `/trips/:id` | Rename trip `{ "name": "..." }` |
| DELETE | `/trips/:id` | Delete trip and all its activities |
| POST | `/trips/:id/activities` | Add activity `{ "title": "..." }` |
| PATCH | `/trips/:id/activities/:activityId` | Rename activity |
| DELETE | `/trips/:id/activities/:activityId` | Delete activity |

Health: `GET /api/health` returns 200 when both database connections respond; 503 if either fails. HTTP responses include 200, 201, 400, 404, and 409 for SQL foreign-key rejection.

## 4. QA testing

With the server running:

```bash
npm run qa
```

The test creates and reads a parent with a related child, updates both, tests bad input (400), deletes the parent, verifies 404 on reread, and intentionally inserts an SQL orphan using a valid but nonexistent trip UUID. Expected: **409** with PostgreSQL code **23503**. MongoDB tests use an embedded array, with no manual cross-collection joins. All QA test records are deleted by the test.

Also manually:
1. Create a SQL trip and activity in the UI; view via `psql` and show the join.
2. Rename both; inspect the updated rows.
3. Delete SQL trip; inspect `activities` to show cascade deletion.
4. Switch to MongoDB; create and update a trip/activity; show `db.trips.find().pretty()` in `mongosh`.
5. Test blank inputs and long text, resize browser to mobile viewport.
6. In DevTools, verify the Network tab shows 200/201/400/404 and console has no errors.
7. Fill in actual results in [`docs/ai-audit.md`](docs/ai-audit.md). **Do not mark unexecuted tests as passed.**

## 5. AI tools & audit

- AI tool used: ChatGPT (GPT-6), to prepare the starter architecture and code.
- Initial prompt, audit checklist, example modeling omission, and actual-results worksheet: [`docs/ai-audit.md`](docs/ai-audit.md).
- Student should append subsequent prompts verbatim, record decisions and changes actually made, and take screenshots of the database viewers.
- Avoid claiming an AI-generated error was discovered unless you preserved an actual earlier erroneous draft. Current starter includes foreign keys, cascade rules, secondary index, parameterized queries, safe ID parsing, and embedded Mongo arrays.

## 6. SQL vs NoSQL reflection

SQL is a good choice when relationships and enforced constraints matter. MongoDB is convenient when the main read request needs a bounded trip and its activities in a single document. This assignment demonstrates two **alternative** models of the same feature, rather than a production architecture requiring both databases. Neither engine is automatically faster in every workload; benchmarking and deployment details matter.

## 7. Video plan and submission

See [`docs/video-outline.md`](docs/video-outline.md). Record **5–7 minutes with webcam and screen simultaneously**, showing code and data **live**. Submit GitHub repository, video link, and `N/A - Local Polyglot Backend` for live URL if keeping this local.

## Responsive React UI (Figma-inspired)

The app includes a component-based React/Vite frontend in `client/`. The first supported flows are trips list, new trip, trip detail, and activities CRUD, based on the linked **TravelHub mobile flows** Figma file (node `79:199477`). The desktop sidebar and two-/three-column card layouts are a responsive adaptation; the user has not provided desktop Figma frames. Authentication/profile and voting are not part of this assignment's implemented scope.

### Running the frontend

```bash
npm install
npm --prefix client install
npm run client:build
npm start
```

Open http://localhost:3000. For frontend hot reload, keep the API server running and start `npm run client:dev`, then open http://localhost:5173. Vite proxies `/api` to port 3000. Start the two databases first with `docker compose up -d`.

### Component architecture

- `client/src/components`: reusable Button, Field, AppShell, engine selector
- `client/src/features/trips`: TripCard, TripForm, TripDetails
- `client/src/lib/api.js`: centralized fetch/error handling
- `client/src/App.jsx`: route-like view state, data loading, CRUD mutations
- `client/src/styles.css`: shared visual tokens, responsive layout and states

The SQL and MongoDB engine selectors use **separate datasets**, so switching the selector will not synchronize trips. All CRUD operations go through the existing shared API contract.

### Scope and honesty

This frontend is an initial coded interpretation of the mobile Figma flow rather than a pixel-accurate reproduction of every screen. The automated database QA tests must still be run locally against PostgreSQL and MongoDB; no passing database tests are claimed by the supplied code package.

## Figma-inspired responsive React frontend

The React/Vite UI lives in `client/`, with reusable `Button`, `Field`, `AppShell`, `TripCard`, `TripForm`, and `TripDetails` components. Its mobile inspiration is the user's TravelHub Figma flow (node `79:199477`); desktop sidebar/card layouts are a proposed responsive adaptation, not an existing desktop Figma design.

### Start

```bash
docker compose up -d
npm install
npm --prefix client install
npm run client:build
npm start
```

Open `http://localhost:3000`. For frontend hot reload keep `npm start` running in one terminal, then run `npm run client:dev` and open `http://localhost:5173`.

`npm run qa` runs existing backend CRUD/constraint tests. Verify results locally. The package has not been integration-tested in this environment. The SQL and MongoDB selectors show separate datasets; they do not sync.

### Code organization
- `client/src/components/` — reusable shell and controls
- `client/src/features/trips/` — trip UI components
- `client/src/lib/api.js` — HTTP client and errors
- `client/src/App.jsx` — view state and CRUD API operations
- `client/src/styles.css` — responsive styling

Scope: trip list, create, rename, delete, and activity create, read, update, delete. Onboarding, sign-up, and profile UI from Figma are not implemented yet because the course assignment focuses on two-entity CRUD.


## Figma design token alignment (updated)

The React frontend imports `client/src/tokens.css`, mapped from the existing `TravelHub · Semantic tokens` Figma collection. It uses Inter, the violet primary action `#4441E6`, canvas `#F5F6FA`, text `#20243A`, and control radius 12px. Shared component styles and responsive layouts now use these tokens. The mobile flow remains a focused classroom implementation of trip/activity CRUD, **not** a pixel-perfect recreation of all Figma screens.

Changes are visual only: the PostgreSQL and MongoDB server API remains unchanged. To verify, run `npm --prefix client install`, `npm run client:build`, and `npm start`; database tests still require Docker and `npm run qa`.
