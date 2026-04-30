const express = require('express');
const router = express.Router();
const { simulateSensorData } = require('../utils/simulator');

router.get('/live', (req, res) => {
  res.json(simulateSensorData());
});

router.get('/history', (req, res) => {
  const history = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    soilMoisture: parseFloat((Math.random() * 60 + 20).toFixed(1)),
    temperature: parseFloat((Math.random() * 20 + 18).toFixed(1)),
    humidity: parseFloat((Math.random() * 50 + 40).toFixed(1))
  }));
  res.json(history);
});

module.exports = router;
