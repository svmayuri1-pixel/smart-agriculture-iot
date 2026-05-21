import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function WeatherStat({ icon, label, value, unit }) {
  return (
    <div style={{ padding: '16px', background: '#0f172a', borderRadius: '10px', textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{icon}</div>
      <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 700 }}>
        {value}<span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '2px' }}>{unit}</span>
      </div>
    </div>
  );
}

export default function WeatherPage() {
  const [weather, setWeather]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchWeather = () => {
    setLoading(true);
    axios.get('/api/weather/current')
      .then(res => {
        setWeather(res.data);
        setLastUpdate(new Date().toLocaleTimeString());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWeather();
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !weather) {
    return (
      <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🌤️</div>
          <div style={{ color: '#64748b' }}>Loading weather data...</div>
        </div>
      </div>
    );
  }

  const forecast = weather.forecast || [];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>🌤️ Weather Station</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
            Real-time weather for smart farming decisions
            {lastUpdate && <span> · Updated {lastUpdate}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {weather.isReal ? (
            <span style={{
              padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
              background: 'rgba(22,163,74,0.15)', color: '#4ade80'
            }}>🌐 Live Weather</span>
          ) : (
            <span style={{
              padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
              background: 'rgba(245,158,11,0.15)', color: '#fbbf24'
            }}>⚠️ Demo Data</span>
          )}
          <button onClick={fetchWeather} style={{
            padding: '6px 12px', background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px',
            color: '#60a5fa', fontSize: '0.78rem', cursor: 'pointer'
          }}>🔄 Refresh</button>
        </div>
      </div>

      {/* API Key notice */}
      {!weather.isReal && (
        <div style={{
          padding: '12px 16px', background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', marginBottom: '20px'
        }}>
          <p style={{ color: '#fbbf24', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
            🌐 Connect Real Weather Data
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
            1. Get free API key: <strong style={{ color: '#60a5fa' }}>openweathermap.org/api</strong><br/>
            2. Add to Render Environment: <code style={{ color: '#60a5fa' }}>OPENWEATHER_API_KEY</code> + <code style={{ color: '#60a5fa' }}>WEATHER_CITY=Chennai</code>
          </p>
        </div>
      )}

      {/* Current weather hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f2d1a 100%)',
        border: '1px solid #334155', borderRadius: '16px', padding: '28px', marginBottom: '20px',
        display: 'flex', alignItems: 'center', gap: '24px'
      }}>
        <div style={{ fontSize: '5rem' }}>{weather.icon}</div>
        <div>
          <div style={{ color: '#f1f5f9', fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>
            {weather.temperature}°C
          </div>
          <div style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '4px' }}>{weather.condition}</div>
          <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
            📍 {weather.location} · Feels like {weather.feelsLike}°C
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          {weather.rainfall > 5 && (
            <div style={{
              padding: '8px 14px', background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: '8px', color: '#60a5fa', fontSize: '0.85rem', fontWeight: 600
            }}>
              🌧️ Rain detected — consider pausing irrigation
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <WeatherStat icon="💦" label="Humidity"    value={weather.humidity}    unit="%" />
        <WeatherStat icon="💨" label="Wind Speed"  value={weather.windSpeed}   unit="km/h" />
        <WeatherStat icon="🧭" label="Wind Dir"    value={weather.windDirection} unit="" />
        <WeatherStat icon="🌧️" label="Rainfall"    value={weather.rainfall}    unit="mm" />
        <WeatherStat icon="👁️" label="Visibility"  value={weather.visibility}  unit="km" />
      </div>

      {/* 5-day forecast */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px' }}>📅 5-Day Forecast</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {forecast.map((day, i) => (
            <div key={i} style={{
              padding: '14px', background: '#0f172a', borderRadius: '10px', textAlign: 'center',
              border: i === 0 ? '1px solid #16a34a44' : '1px solid #1e293b'
            }}>
              <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px' }}>{day.day}</div>
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{day.icon}</div>
              <div style={{ color: '#f1f5f9', fontSize: '0.85rem', fontWeight: 700 }}>{day.high}°</div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{day.low}°</div>
              <div style={{
                marginTop: '6px', fontSize: '0.7rem', fontWeight: 600,
                color: day.rain > 50 ? '#60a5fa' : day.rain > 20 ? '#94a3b8' : '#64748b'
              }}>💧 {day.rain}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rainfall chart */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px' }}>🌧️ Rain Probability Forecast</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={forecast}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
            <Bar dataKey="rain" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Rain %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Farming recommendations */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px' }}>🌱 Weather-Based Farming Advice</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            {
              icon: '💧',
              text: forecast[1]?.rain > 50
                ? `Rain expected tomorrow (${forecast[1].rain}%) — skip irrigation today to save water`
                : 'No significant rain expected — maintain irrigation schedule',
              type: forecast[1]?.rain > 50 ? 'info' : 'success'
            },
            {
              icon: '🌡️',
              text: weather.temperature > 35
                ? `High temperature (${weather.temperature}°C) — increase irrigation frequency`
                : `Temperature ${weather.temperature}°C is optimal for crop growth`,
              type: weather.temperature > 35 ? 'warning' : 'success'
            },
            {
              icon: '💨',
              text: weather.windSpeed > 20
                ? `High winds (${weather.windSpeed} km/h) — avoid pesticide spraying today`
                : `Wind ${weather.windSpeed} km/h — suitable for spraying`,
              type: weather.windSpeed > 20 ? 'warning' : 'success'
            },
            {
              icon: '💦',
              text: weather.humidity > 80
                ? `High humidity (${weather.humidity}%) — watch for fungal diseases`
                : `Humidity ${weather.humidity}% is normal`,
              type: weather.humidity > 80 ? 'warning' : 'success'
            }
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px',
              background: '#0f172a', borderRadius: '8px',
              border: `1px solid ${item.type === 'warning' ? '#f59e0b22' : item.type === 'success' ? '#16a34a22' : '#3b82f622'}`
            }}>
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
