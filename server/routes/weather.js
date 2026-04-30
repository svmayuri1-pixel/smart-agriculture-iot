const express = require('express');
const router = express.Router();

router.get('/current', (req, res) => {
  res.json({
    location: 'Farm Location',
    temperature: 28,
    feelsLike: 31,
    humidity: 65,
    windSpeed: 12,
    windDirection: 'NE',
    rainfall: 0,
    uvIndex: 6,
    visibility: 10,
    condition: 'Partly Cloudy',
    icon: '⛅',
    forecast: [
      { day: 'Today',    high: 30, low: 22, condition: 'Partly Cloudy', icon: '⛅', rain: 10 },
      { day: 'Tomorrow', high: 25, low: 19, condition: 'Rainy',         icon: '🌧️', rain: 80 },
      { day: 'Wed',      high: 27, low: 20, condition: 'Cloudy',        icon: '☁️', rain: 30 },
      { day: 'Thu',      high: 32, low: 23, condition: 'Sunny',         icon: '☀️', rain: 5  },
      { day: 'Fri',      high: 29, low: 21, condition: 'Sunny',         icon: '☀️', rain: 5  }
    ]
  });
});

module.exports = router;
