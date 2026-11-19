# 5–7 minute video outline (speaking notes, adapt after testing)

**0:00–1:30 | Architecture & AI audit**
"I built a mini trip planner using PostgreSQL and MongoDB. Both databases support trips and activities, but they model them differently. In PostgreSQL, trips and activities are separate related tables. The activities table has a foreign key and ON DELETE CASCADE, plus an index on trip_id. MongoDB stores activities inside each trip document, so a complete trip requires only one read. I used AI to draft the implementation and checked the generated output for foreign keys, safe query parameters, and appropriate MongoDB embedding." Show SQL file, Mongo document and your actual AI prompt log. Describe a genuine omission you observed and corrected, if you have one; if not, accurately show what you audited.

**1:30–3:30 | SQL operations**
Select PostgreSQL in UI. Create trip, add activity, read it, rename, delete. In terminal run the PostgreSQL join query from README; show resulting rows. Run `npm run qa` and point to the SQL negative FK test HTTP 409 / code 23503; show the actual FK in schema. Demonstrate cascade cleanup with SQL inspection.

**3:30–5:15 | NoSQL operations**
Select MongoDB. Create trip with activity; in terminal run `mongosh` inspection command. Show that activities are inside the trip document. Rename activity, then delete trip. Explain why this structure is good for loading a complete trip without manual joins. Show the Mongo QA result.

**5:15–6:30 | QA and takeaways**
Show actual checked QA worksheet, DevTools Network tab HTTP 200, 201, 400, 404, browser console, mobile viewport. "PostgreSQL is useful when strict relationships and foreign key rules matter. MongoDB can simplify reads when related data fits inside one document. The better option depends on how the app uses the data." Stop around 6:30.

**Recording:** Screen and webcam/face visible at once; use Loom, OBS, Zoom or Panopto; make sure terminal text is legible.
