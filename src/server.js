import 'dotenv/config';
import express from 'express';
import { Pool } from 'pg';
import { MongoClient, ObjectId } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const app = express();
app.use(express.json({ limit: '20kb' }));
const frontendDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
app.use(express.static(frontendDir));
const pool = new Pool({ connectionString: process.env.PG_URL ?? 'postgres://travelhub:travelhub_local_only@localhost:5432/travelhub' });
const mongoClient = new MongoClient(process.env.MONGO_URL ?? 'mongodb://localhost:27017', { serverSelectionTimeoutMS: 3000 });
await mongoClient.connect();
const trips = mongoClient.db(process.env.MONGO_DB ?? 'travelhub_polyglot').collection('trips');
await trips.createIndex({ createdAt: -1 });
await trips.createIndex({ 'activities.id': 1 });
const clean = x => typeof x === 'string' ? x.trim() : '';
const valid = x => x.length > 0 && x.length <= 120;
const uuidRE = /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const objectID = id => ObjectId.isValid(id) && String(new ObjectId(id)) === id ? new ObjectId(id) : null;
const asyncRoute = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
const isSQL = req => req.params.engine === 'sql';
const serialize = d => ({ id: d._id.toHexString(), name:d.name, destination:d.destination, activities:d.activities, created_at:d.createdAt });
const sqlOne = async id => {
  const r = await pool.query('SELECT id,name,destination,created_at FROM trips WHERE id=$1',[id]);
  if (!r.rowCount) return null;
  const a = await pool.query('SELECT id,title,created_at FROM activities WHERE trip_id=$1 ORDER BY created_at,id',[id]);
  return {...r.rows[0],activities:a.rows};
};
app.param('engine',(req,res,next,engine)=>['sql','mongo'].includes(engine)?next():res.status(400).json({error:'Engine must be sql or mongo'}));
app.get('/api/health',asyncRoute(async (_req,res)=>{
  const [pg,mongo] = await Promise.allSettled([pool.query('SELECT 1'),mongoClient.db().admin().ping()]);
  res.status(pg.status==='fulfilled'&&mongo.status==='fulfilled'?200:503).json({postgres:pg.status,mongodb:mongo.status});
}));
app.get('/api/:engine/trips',asyncRoute(async(req,res)=>{
  if(isSQL(req)) {
    const rows=(await pool.query('SELECT id,name,destination,created_at FROM trips ORDER BY created_at DESC')).rows;
    return res.json(await Promise.all(rows.map(r=>sqlOne(r.id))));
  }
  res.json((await trips.find({}).sort({createdAt:-1}).toArray()).map(serialize));
}));
app.get('/api/:engine/trips/:id',asyncRoute(async(req,res)=>{
  const d=isSQL(req)?(uuidRE.test(req.params.id)?await sqlOne(req.params.id):null):
    (objectID(req.params.id)?await trips.findOne({_id:objectID(req.params.id)}):null);
  if(!d) return res.status(404).json({error:'Trip not found'});
  res.json(isSQL(req)?d:serialize(d));
}));
app.post('/api/:engine/trips',asyncRoute(async(req,res)=>{
  const name=clean(req.body?.name),destination=clean(req.body?.destination);
  if(!valid(name)||!valid(destination)) return res.status(400).json({error:'Name and destination required (1–120 characters)'});
  if(isSQL(req)) {
    const id=randomUUID();
    await pool.query('INSERT INTO trips(id,name,destination) VALUES($1,$2,$3)',[id,name,destination]);
    return res.status(201).json(await sqlOne(id));
  }
  const d={name,destination,activities:[],createdAt:new Date()};
  const result=await trips.insertOne(d);
  res.status(201).json(serialize({...d,_id:result.insertedId}));
}));
app.patch('/api/:engine/trips/:id',asyncRoute(async(req,res)=>{
  const name=clean(req.body?.name);
  if(!valid(name)) return res.status(400).json({error:'Valid name required (1–120 characters)'});
  if(isSQL(req)){
    if(!uuidRE.test(req.params.id)) return res.status(404).json({error:'Trip not found'});
    const result=await pool.query('UPDATE trips SET name=$1 WHERE id=$2 RETURNING id',[name,req.params.id]);
    return result.rowCount?res.json(await sqlOne(req.params.id)):res.status(404).json({error:'Trip not found'});
  }
  const id=objectID(req.params.id);if(!id)return res.status(404).json({error:'Trip not found'});
  const result=await trips.findOneAndUpdate({_id:id},{$set:{name}},{returnDocument:'after'});
  return result?res.json(serialize(result)):res.status(404).json({error:'Trip not found'});
}));
app.delete('/api/:engine/trips/:id',asyncRoute(async(req,res)=>{
  if(isSQL(req)){
    if(!uuidRE.test(req.params.id))return res.status(404).json({error:'Trip not found'});
    const r=await pool.query('DELETE FROM trips WHERE id=$1',[req.params.id]);
    return r.rowCount?res.status(200).json({deleted:true}):res.status(404).json({error:'Trip not found'});
  }
  const id=objectID(req.params.id);if(!id)return res.status(404).json({error:'Trip not found'});
  const r=await trips.deleteOne({_id:id});
  return r.deletedCount?res.json({deleted:true}):res.status(404).json({error:'Trip not found'});
}));
app.post('/api/:engine/trips/:id/activities',asyncRoute(async(req,res)=>{
  const title=clean(req.body?.title);
  if(!valid(title))return res.status(400).json({error:'Valid activity title required (1–120 characters)'});
  const id=randomUUID();
  if(isSQL(req)){
    if(!uuidRE.test(req.params.id))return res.status(404).json({error:'Trip not found'});
    // Database FK is the actual protection for the parent-child relationship.
    try {
      await pool.query('INSERT INTO activities(id,trip_id,title) VALUES($1,$2,$3)',[id,req.params.id,title]);
    } catch(e) {
      if(e.code==='23503')return res.status(409).json({error:'Foreign key constraint: trip does not exist',code:e.code});
      throw e;
    }
    return res.status(201).json({id,title});
  }
  const oid=objectID(req.params.id);if(!oid)return res.status(404).json({error:'Trip not found'});
  const r=await trips.updateOne({_id:oid},{$push:{activities:{id,title,createdAt:new Date()}}});
  return r.matchedCount?res.status(201).json({id,title}):res.status(404).json({error:'Trip not found'});
}));
app.patch('/api/:engine/trips/:id/activities/:activityId',asyncRoute(async(req,res)=>{
  const title=clean(req.body?.title);
  if(!valid(title))return res.status(400).json({error:'Valid activity title required'});
  if(isSQL(req)){
    if(!uuidRE.test(req.params.id)||!uuidRE.test(req.params.activityId))return res.status(404).json({error:'Activity not found'});
    const r=await pool.query('UPDATE activities SET title=$1 WHERE id=$2 AND trip_id=$3 RETURNING id,title',[title,req.params.activityId,req.params.id]);
    return r.rowCount?res.json(r.rows[0]):res.status(404).json({error:'Activity not found'});
  }
  const oid=objectID(req.params.id);if(!oid)return res.status(404).json({error:'Activity not found'});
  const r=await trips.updateOne({_id:oid,'activities.id':req.params.activityId},{$set:{'activities.$.title':title}});
  return r.matchedCount?res.json({id:req.params.activityId,title}):res.status(404).json({error:'Activity not found'});
}));
app.delete('/api/:engine/trips/:id/activities/:activityId',asyncRoute(async(req,res)=>{
  if(isSQL(req)){
    if(!uuidRE.test(req.params.id)||!uuidRE.test(req.params.activityId))return res.status(404).json({error:'Activity not found'});
    const r=await pool.query('DELETE FROM activities WHERE id=$1 AND trip_id=$2',[req.params.activityId,req.params.id]);
    return r.rowCount?res.json({deleted:true}):res.status(404).json({error:'Activity not found'});
  }
  const oid=objectID(req.params.id);if(!oid)return res.status(404).json({error:'Activity not found'});
  const r=await trips.updateOne({_id:oid,'activities.id':req.params.activityId},{$pull:{activities:{id:req.params.activityId}}});
  return r.matchedCount?res.json({deleted:true}):res.status(404).json({error:'Activity not found'});
}));
app.get(/^\/(?!api(?:\/|$)).*/, (req,res)=>res.sendFile(path.join(frontendDir,'index.html')));
app.use((err,req,res,next)=>{
  console.error('Request failed:',err.message);
  if(err.type==='entity.parse.failed')return res.status(400).json({error:'Invalid JSON'});
  res.status(500).json({error:'Internal server error'});
});
const server=app.listen(Number(process.env.PORT||3000),()=>console.log(`TravelHub Mini at http://localhost:${process.env.PORT||3000}`));
const close=async()=>{server.close();await Promise.all([pool.end(),mongoClient.close()]);};
process.once('SIGINT',close);process.once('SIGTERM',close);
