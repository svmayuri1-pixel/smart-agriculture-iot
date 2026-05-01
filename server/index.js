const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sensors', require('./routes/sensors'));
app.use('/api/livestock', require('./routes/livestock'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/cameras', require('./routes/cameras'));

// Serve static frontend — only if build exists
const buildPath = path.join(__dirname, '../client/build');
const fs = require('fs');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
  console.log('✅ Serving React frontend from build folder');
} else {
  app.get('*', (req, res) => {
    res.json({ 
      status: 'API Running', 
      message: 'Frontend build not found. Run: npm run build --prefix client',
      api: '/api/auth, /api/sensors, /api/livestock'
    });
  });
  console.log('⚠️ No client/build folder found — API only mode');
}

// Socket.IO for real-time data
require('./mqtt/mqttClient')(io);

// Simulate real-time sensor data every 5 seconds
const { simulateSensorData } = require('./utils/simulator');
setInterval(() => {
  const data = simulateSensorData();
  io.emit('sensor_update', data);
}, 5000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌱 Smart Agriculture Server running on port ${PORT}`);
});
