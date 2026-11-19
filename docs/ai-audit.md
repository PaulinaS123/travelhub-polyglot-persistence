# AI schema audit (student review worksheet)

## Initial prompt used for this starter
Act as a senior database architect. Build a small TravelHub trip planner with Trips and Activities. Model the same domain in PostgreSQL (normalized tables) and MongoDB (one trip document embedding activities). Provide Node/Express CRUD for both, safe parameterized SQL, indexes, cascading deletion, API validation, and a test for a foreign key violation. Include a simple frontend to choose the engine. Explain the tradeoffs and limitations.

## Inspect and explain the draft before recording
- **SQL integrity:** `activities.trip_id` explicitly references `trips(id)` and uses `ON DELETE CASCADE`.
- **SQL index:** `idx_activities_trip_id` supports activity lookup by trip (PostgreSQL does not automatically add this index).
- **SQL injection:** all user values use `$1`, `$2`, `$3` placeholders, not string interpolation.
- **NoSQL read model:** one MongoDB `trips` document embeds the activities array; a single `findOne` loads a trip.
- **SQL 3NF:** Trip-specific fields belong to `trips`, activity-specific fields to `activities`.
- **ID generation:** application generates UUIDs for SQL tables and embedded activities; MongoDB uses ObjectId for trip documents.

## An intentional first-draft flaw to discuss (illustrative, NOT observed in this generated code)
A first draft might omit the `REFERENCES trips(id) ON DELETE CASCADE` constraint or omit `idx_activities_trip_id`. That would allow orphaned activities or cause slower lookups as the table grows. The supplied code already includes both corrections. **Do not claim you discovered this flaw in an earlier AI output unless you actually run a separate first-draft prompt and preserve that output.**

## Model and deployment limitations
- Demo uses separate SQL/Mongo datasets, not synchronous copies or replication between engines.
- Demo uses a single MongoDB instance, not a replica set; it does not validate CAP failover behavior.
- This is a local assignment demo without authentication/authorization; do not deploy as a public multi-user production service.
- One SQL trip read uses two indexed SQL queries; MongoDB trip read uses one document query.
- MongoDB embeds activities because the demo expects a manageable number per trip. Very large unbounded arrays would require a different model.

## QA testing results — November 18, 2026

Manual database testing and automated API testing were completed using PostgreSQL 16 and MongoDB 7.

The automated QA suite was executed using `npm run qa` and reported **PASS: 20 automated assertions**.

| Check | Result / evidence |
|---|---|
| SQL create/read/update/delete | PASS — Created a test trip and activity, retrieved related records using JOIN, updated the activity, and deleted the trip. |
| SQL cascade deletion | PASS — After deleting the parent trip, queries confirmed zero matching rows in both `trips` and `activities`. |
| SQL orphan rejection | PASS — PostgreSQL rejected an activity referencing a nonexistent trip. Automated API test returned HTTP 409 with PostgreSQL error 23503. |
| MongoDB create/read/update/delete | PASS — Inserted a trip with embedded activities, retrieved it using `findOne`, updated an activity, and deleted the document. |
| MongoDB atomic embedded updates | PASS — Used `$set` to modify an embedded activity and `$push` to append another activity. |
| React UI CRUD — PostgreSQL | PASS — Created, retrieved, renamed, and deleted a trip through the interface. Verified database persistence using SQL queries. |
| React UI CRUD — MongoDB | PASS — Created, retrieved, renamed, and deleted a trip through the interface. Verified persistence using `mongosh`. |
| HTTP 200/201/400/404 | PASS — Confirmed successful GET and POST requests, invalid-input rejection, and resource-not-found handling. |
| Backend health | PASS — Automated QA reported HTTP 200. |
| Browser console errors | Not yet verified |
| Responsive desktop/mobile layout | PASS — Manually tested the React UI using Chrome DevTools with iPhone 16 device emulation. Navigation, forms, buttons, and scrolling were functional. |
| Responsive design | PASS — Tested using Chrome DevTools iPhone 16 emulation. |
| Browser form validation warnings | PASS — Fixed missing form attributes and duplicate IDs. |

### Automated QA evidence

Command executed:

`npm run qa`

Results:

- PostgreSQL: CRUD, invalid input, post-delete lookup, and foreign-key rejection passed.
- MongoDB: CRUD, invalid input, and post-delete lookup passed.
- Health endpoint: HTTP 200.
- Final result: **20 automated assertions passed.**

### Observations and limitations

- The React interface supports renaming trips and editing activities, but destination editing is not currently available.
- The PostgreSQL and MongoDB databases contain separate datasets and do not synchronize automatically.
- Browser required-field validation prevents empty-name submissions. Backend validation was independently verified using `curl`.
- A `PUT` request returned an Express route-not-found response because the application uses `PATCH` for updates. The correct `PATCH` endpoint returned HTTP 404 with `{"error":"Trip not found"}` for a nonexistent resource.
- Automated and manual tests verify functional behavior, but do not establish production readiness, performance, or scalability.