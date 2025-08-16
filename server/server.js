import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import pkg from 'pg';
import authRoute from './routes/auth.js';
import centreRoutes from './routes/centres.js';
import staffRoute from './routes/staff.js';
import walletRoute from './routes/wallet.js';
import serviceManagementRoutes from './routes/servicemanagement.js';
import serviceEntryRoute from './routes/serviceEntry.js';

dotenv.config();

const { Pool } = pkg;
const app = express();

// ===== Middleware =====
app.use(cors({ origin: 'https://akshaya-app.onrender.com' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== PostgreSQL Setup =====
const pool = new Pool({
  connectionString: process.env.PG_URI,
});

// Test database connection
pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch((err) => console.error('❌ PG Connect Error:', err));

// Attach db pool to all requests
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// ===== API Routes =====
app.use('/api/auth', authRoute);
app.use('/api/staff', staffRoute);
app.use('/api/wallet', walletRoute);
app.use('/api/servicemanagement', serviceManagementRoutes);
app.use('/api/service', serviceEntryRoute);
app.use('/api/centres', centreRoutes);

// ===== 404 Handler =====
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
