const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json([
    { id: 'TRACTOR-01', name: 'John Deere 5075E',     lat: 24.860, lng: 67.020, speed: 12, fuel: 75, status: 'Active',  lastSeen: new Date() },
    { id: 'TRACTOR-02', name: 'Massey Ferguson 375',  lat: 24.845, lng: 67.005, speed: 0,  fuel: 45, status: 'Parked',  lastSeen: new Date() },
    { id: 'SPRAYER-01', name: 'Crop Sprayer Unit',    lat: 24.850, lng: 67.010, speed: 5,  fuel: 90, status: 'Active',  lastSeen: new Date() }
  ]);
});

module.exports = router;
