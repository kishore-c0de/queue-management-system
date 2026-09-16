// src/server.js

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const prisma = require('./config/prisma');
const { initIO } = require('./sockets/io');

const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const summaryRoutes = require('./routes/summaryRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', message: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/summary', summaryRoutes);

// We wrap the Express app in a plain http server so Socket.io can
// attach to the same port -- Socket.io needs the raw server, not the
// Express app object, to do its WebSocket upgrade handshake.
const server = http.createServer(app);
initIO(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
