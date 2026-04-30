const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json([
    { id: 1, name: 'Fertilizer (NPK)',  unit: 'kg',  quantity: 450, capacity: 1000, level: 45, status: 'Low' },
    { id: 2, name: 'Seeds (Wheat)',     unit: 'kg',  quantity: 800, capacity: 1000, level: 80, status: 'Good' },
    { id: 3, name: 'Pesticide',         unit: 'L',   quantity: 120, capacity: 200,  level: 60, status: 'Good' },
    { id: 4, name: 'Water Tank',        unit: 'L',   quantity: 8000, capacity: 10000, level: 80, status: 'Good' },
    { id: 5, name: 'Diesel Fuel',       unit: 'L',   quantity: 200, capacity: 500,  level: 40, status: 'Low' },
    { id: 6, name: 'Herbicide',         unit: 'L',   quantity: 30,  capacity: 100,  level: 30, status: 'Critical' }
  ]);
});

module.exports = router;
