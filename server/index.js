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

// Make io accessible in routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sensors', require('./routes/sensors'));
app.use('/api/livestock', require('./routes/livestock'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/cameras', require('./routes/cameras'));
app.use('/api/pest', require('./routes/pestAnalysis'));

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

// Handle phone GPS data from /track page
io.on('connection', (socket) => {
  socket.on('phone_gps', (data) => {
    const { updateRealVehicle } = require('./utils/simulator');

    // Store as real vehicle data
    updateRealVehicle(data.id, {
      id:       data.id,
      name:     data.name || 'Phone GPS',
      lat:      data.lat,
      lng:      data.lng,
      speed:    data.speed || 0,
      fuel:     data.fuel  || 100,
      status:   data.status || 'Active',
      gpsValid: data.gpsValid !== false,
      isReal:   true,
      lastUpdated: new Date().toISOString()
    });

    // Broadcast to all dashboard clients
    io.emit('vehicle_update', {
      id:       data.id,
      name:     data.name || 'Phone GPS',
      lat:      data.lat,
      lng:      data.lng,
      speed:    data.speed || 0,
      fuel:     data.fuel  || 100,
      status:   data.status || 'Active',
      gpsValid: data.gpsValid !== false,
      isReal:   true,
      lastUpdated: new Date().toISOString()
    });

    console.log(`📱 Phone GPS: ${data.name} → ${data.lat}, ${data.lng} (±${data.accuracy}m)`);
  });
});

// Simulate real-time sensor data every 5 seconds
const { simulateSensorData, getRelayState, autoUpdateRelay } = require('./utils/simulator');
setInterval(() => {
  const data = simulateSensorData();
  // Auto-update relay based on real soil moisture
  if (data.field && data.field.soilMoisture !== null) {
    autoUpdateRelay(data.field.soilMoisture);
  }
  io.emit('sensor_update', { ...data, relay: getRelayState() });
  io.emit('relay_update', getRelayState());
}, 5000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌱 Smart Agriculture Server running on port ${PORT}`);
});
