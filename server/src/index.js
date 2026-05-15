require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const manholesRouter = require('./routes/manholes');
const realtimeRouter = require('./routes/realtime');
const alarmsRouter = require('./routes/alarms');
const maintenanceRouter = require('./routes/maintenance');
const statsRouter = require('./routes/stats');
const usersRouter = require('./routes/users');
const { setupMqttClient } = require('./mqtt/client');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api/manholes', manholesRouter);
app.use('/api/realtime', realtimeRouter);
app.use('/api/alarms', alarmsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/stats', statsRouter);
app.use('/api/users', usersRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, _req, res, _next) => {
  console.error('[server] unhandled error:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

setupMqttClient(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[server] running on http://localhost:${PORT}`);
  console.log(`[server] WebSocket ready`);
});

function shutdown() {
  console.log('[server] shutting down...');
  server.close(() => {
    console.log('[server] closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
