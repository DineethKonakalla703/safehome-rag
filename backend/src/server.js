import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { connectDatabase, databaseStatus } from './config/db.js';
import billRoutes from './routes/billRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import referenceRoutes from './routes/referenceRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();
const app = express();
const port = Number(process.env.PORT || 5000);

app.disable('x-powered-by');
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok', service: 'SafeHome-RAG API', mongodb: databaseStatus(), timestamp: new Date().toISOString() } }));
app.use('/api/users', userRoutes);
app.use('/api/reference', referenceRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await connectDatabase();
    app.listen(port, () => console.log(`SafeHome-RAG API listening on http://localhost:${port}`));
  } catch (error) {
    console.error(`Backend startup failed: ${error.message}`);
    process.exit(1);
  }
}

start();

