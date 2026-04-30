const express = require('express');
const router = express.Router();

const alerts = [
  { id: 1, type: 'warning',  category: 'Pest',      message: 'Aphids detected in North Field Zone 3', time: '10 min ago', read: false },
  { id: 2, type: 'critical', category: 'Livestock', message: 'COW-002 (Daisy) temperature elevated: 39.1°C', time: '25 min ago', read: false },
  { id: 3, type: 'info',     category: 'Irrigation',message: 'Zone 1 irrigation completed. 450L used.', time: '1 hr ago', read: true },
  { id: 4, type: 'warning',  category: 'Inventory', message: 'Fertilizer stock below 50% — reorder soon', time: '2 hr ago', read: true },
  { id: 5, type: 'critical', category: 'Intrusion', message: 'Bird intrusion detected in South Field', time: '3 hr ago', read: true },
  { id: 6, type: 'info',     category: 'Weather',   message: 'Rain expected tomorrow — irrigation paused', time: '5 hr ago', read: true }
];

router.get('/', (req, res) => res.json(alerts));

router.patch('/:id/read', (req, res) => {
  const alert = alerts.find(a => a.id === parseInt(req.params.id));
  if (alert) alert.read = true;
  res.json({ success: true });
});

module.exports = router;
