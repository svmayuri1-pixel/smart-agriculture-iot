/**
 * Weather Route — Real data from OpenWeatherMap API
 * Free API: https://openweathermap.org/api
 * 
 * Set in Render Environment Variables:
 *   OPENWEATHER_API_KEY = your_api_key
 *   WEATHER_CITY        = Chennai  (or your city)
 *   WEATHER_LAT         = 13.0827  (optional, for precise location)
 *   WEATHER_LON         = 80.2707  (optional)
 */

const express = require('express');
const router  = express.Router();
const https   = require('https');

// Cache weather data (refresh every 10 minutes)
let weatherCache = null;
let lastFetch    = 0;
const CACHE_TTL  = 10 * 60 * 1000; // 10 minutes

// Fetch weather from OpenWeatherMap
async function fetchRealWeather() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const city   = process.env.WEATHER_CITY || 'Chennai';
  const lat    = process.env.WEATHER_LAT;
  const lon    = process.env.WEATHER_LON;

  if (!apiKey) return null;

  // Build URL — use lat/lon if available, else city name
  let url;
  if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  } else {
    url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
  }

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.cod !== '200') {
            console.error('OpenWeather error:', json.message);
            resolve(null);
            return;
          }
          resolve(json);
        } catch (e) { resolve(null); }
      });
    }).on('error', (e) => { console.error('Weather fetch error:', e); resolve(null); });
  });
}

// Map OpenWeatherMap icon to emoji
function getWeatherEmoji(iconCode, description) {
  const desc = description.toLowerCase();
  if (desc.includes('thunder')) return '⛈️';
  if (desc.includes('drizzle')) return '🌦️';
  if (desc.includes('rain'))    return '🌧️';
  if (desc.includes('snow'))    return '❄️';
  if (desc.includes('mist') || desc.includes('fog')) return '🌫️';
  if (desc.includes('clear'))   return '☀️';
  if (desc.includes('few clouds')) return '🌤️';
  if (desc.includes('scattered')) return '⛅';
  if (desc.includes('cloud'))   return '☁️';
  return '🌤️';
}

// Parse OpenWeatherMap forecast into 5-day forecast
function parseForecast(data) {
  const days = {};
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  data.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toDateString();
    if (!days[dayKey]) {
      days[dayKey] = {
        day: dayNames[date.getDay()],
        temps: [],
        conditions: [],
        icons: [],
        rain: 0
      };
    }
    days[dayKey].temps.push(item.main.temp);
    days[dayKey].conditions.push(item.weather[0].description);
    days[dayKey].icons.push(item.weather[0].icon);
    days[dayKey].rain = Math.max(days[dayKey].rain,
      (item.pop || 0) * 100);
  });

  const forecastArr = Object.values(days).slice(0, 5);
  return forecastArr.map((d, i) => ({
    day:       i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.day,
    high:      Math.round(Math.max(...d.temps)),
    low:       Math.round(Math.min(...d.temps)),
    condition: d.conditions[Math.floor(d.conditions.length / 2)],
    icon:      getWeatherEmoji('', d.conditions[Math.floor(d.conditions.length / 2)]),
    rain:      Math.round(d.rain)
  }));
}

// GET /api/weather/current
router.get('/current', async (req, res) => {
  const now = Date.now();

  // Return cached data if fresh
  if (weatherCache && (now - lastFetch) < CACHE_TTL) {
    return res.json(weatherCache);
  }

  // Try to fetch real weather
  const rawData = await fetchRealWeather();

  if (rawData) {
    // Parse real data
    const current   = rawData.list[0];
    const cityName  = rawData.city.name;
    const condition = current.weather[0].description;
    const emoji     = getWeatherEmoji(current.weather[0].icon, condition);
    const forecast  = parseForecast(rawData);

    weatherCache = {
      location:    cityName,
      temperature: Math.round(current.main.temp),
      feelsLike:   Math.round(current.main.feels_like),
      humidity:    current.main.humidity,
      windSpeed:   Math.round(current.wind.speed * 3.6), // m/s to km/h
      windDirection: getWindDirection(current.wind.deg),
      rainfall:    current.rain ? Math.round((current.rain['3h'] || 0) * 10) / 10 : 0,
      uvIndex:     0, // Not in free tier
      visibility:  Math.round((current.visibility || 10000) / 1000),
      condition:   capitalizeFirst(condition),
      icon:        emoji,
      isReal:      true,
      forecast
    };
    lastFetch = now;
    console.log(`🌤️ Real weather: ${cityName} ${Math.round(current.main.temp)}°C ${condition}`);
  } else {
    // Fallback demo data
    weatherCache = {
      location:    process.env.WEATHER_CITY || 'Farm Location',
      temperature: 28,
      feelsLike:   31,
      humidity:    65,
      windSpeed:   12,
      windDirection: 'NE',
      rainfall:    0,
      uvIndex:     6,
      visibility:  10,
      condition:   'Partly Cloudy',
      icon:        '⛅',
      isReal:      false,
      forecast: [
        { day: 'Today',    high: 30, low: 22, condition: 'Partly Cloudy', icon: '⛅', rain: 10 },
        { day: 'Tomorrow', high: 25, low: 19, condition: 'Rainy',         icon: '🌧️', rain: 80 },
        { day: 'Wed',      high: 27, low: 20, condition: 'Cloudy',        icon: '☁️', rain: 30 },
        { day: 'Thu',      high: 32, low: 23, condition: 'Sunny',         icon: '☀️', rain: 5  },
        { day: 'Fri',      high: 29, low: 21, condition: 'Sunny',         icon: '☀️', rain: 5  }
      ]
    };
    lastFetch = now;
  }

  res.json(weatherCache);
});

function getWindDirection(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = router;
