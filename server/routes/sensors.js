const express = require('express');
const router = express.Router();
const { simulateSensorData, getRelayState, setRelayState } = require('../utils/simulator');

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

// GET current relay state
router.get('/relay', (req, res) => {
  res.json(getRelayState());
});

// POST toggle relay manually — body: { on: true/false }
router.post('/relay', (req, res) => {
  const { on } = req.body;
  if (typeof on !== 'boolean') {
    return res.status(400).json({ error: 'Body must have { on: true } or { on: false }' });
  }
  setRelayState(on, 'manual');
  // Broadcast relay update via socket (io attached to app)
  const io = req.app.get('io');
  if (io) io.emit('relay_update', getRelayState());
  res.json(getRelayState());
});

// POST switch mode between auto / manual
router.post('/relay/mode', (req, res) => {
  const { mode } = req.body;
  if (!['auto', 'manual'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be "auto" or "manual"' });
  }
  const current = getRelayState();
  setRelayState(current.irrigationRelay, mode);
  const io = req.app.get('io');
  if (io) io.emit('relay_update', getRelayState());
  res.json(getRelayState());
});

module.exports = router;
