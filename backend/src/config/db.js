import mongoose from 'mongoose';

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured. Copy backend/.env.example to backend/.env and add your Atlas connection string.');
  }
  // false: a role filter on a field the model lacks (e.g. technicianId on Bill) must match nothing,
  // not be silently dropped (which returned every record to that role).
  mongoose.set('strictQuery', false);
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'safehome_rag' });
  return mongoose.connection;
}

export function databaseStatus() {
  const labels = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return { state: labels[mongoose.connection.readyState] || 'unknown', database: mongoose.connection.name || 'safehome_rag' };
}
