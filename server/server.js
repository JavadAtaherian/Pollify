// server/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000'
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Trust proxy for IP addresses
app.set('trust proxy', true);

// API Routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use('/{*any}', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`Survey Platform Server running on port ${PORT}`);
  console.log(`API available at: http://localhost:${PORT}/api`);
});




// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(cors({
//   origin: process.env.CLIENT_URL
// }));
// app.use(express.json());

// // Test route
// app.get('/api/test', (req, res) => {
//   res.json({ message: 'Backend connected!' });
// });

// // Database test route
// app.get('/api/db-test', async (req, res) => {
//   try {
//     const pool = require('./src/database');
//     const result = await pool.query('SELECT NOW()');
//     res.json({ 
//       message: 'Database connected!', 
//       time: result.rows[0].now 
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });