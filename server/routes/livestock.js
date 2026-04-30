const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json([
    { id: 'COW-001', name: 'Bessie', type: 'Cow', heartRate: 72, temp: 38.2, status: 'Healthy', lat: 24.851, lng: 67.011 },
    { id: 'COW-002', name: 'Daisy',  type: 'Cow', heartRate: 85, temp: 39.1, status: 'Alert',   lat: 24.853, lng: 67.013 },
    { id: 'COW-003', name: 'Molly',  type: 'Cow', heartRate: 68, temp: 38.0, status: 'Healthy', lat: 24.855, lng: 67.015 },
    { id: 'GOAT-001', name: 'Billy', type: 'Goat', heartRate: 95, temp: 39.0, status: 'Healthy', lat: 24.857, lng: 67.017 }
  ]);
});

module.exports = router;
