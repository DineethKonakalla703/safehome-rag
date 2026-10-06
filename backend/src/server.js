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
import authRoutes from './routes/authRoutes.js';
import workOrderRoutes from './routes/workOrderRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import knowledgeRoutes from './routes/knowledgeRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import importRoutes from './routes/importRoutes.js';
import { amenityRoutes, apartmentRoutes, blockRoutes, bookingRoutes, communityRoutes, documentRoutes, inventoryRoutes, noticeRoutes, parkingRoutes, residentRoutes, vehicleRoutes, visitorRoutes } from './routes/coreRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();
const app = express();
const port = Number(process.env.PORT || 5000);

app.disable('x-powered-by');
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok', service: 'SafeHome-RAG API', mongodb: databaseStatus(), timestamp: new Date().toISOString() } }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reference', referenceRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/apartments', apartmentRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/parking-slots', parkingRoutes);
app.use('/api/amenities', amenityRoutes);
app.use('/api/amenity-bookings', bookingRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/import', importRoutes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'replace_with_a_long_random_secret') throw new Error('JWT_SECRET must be configured with a secure random value.');
    await connectDatabase();
    app.listen(port, () => console.log(`SafeHome-RAG API listening on http://localhost:${port}`));
  } catch (error) {
    console.error(`Backend startup failed: ${error.message}`);
    process.exit(1);
  }
}

start();
