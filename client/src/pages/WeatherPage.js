import React from 'react';
import { useSensor } from '../context/SensorContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const forecast = [
  { day: 'Today',    high: 30, low: 22, condition: 'Partly Cloudy', icon: '⛅', rain: 10 },
  { day: 'Tomorrow', high: 25, low: 19, condition: 'Rainy',         icon: '🌧️', rain: 80 },
  { day: 'Wed',      high: 27, low: 20, condition: 'Cloudy',        icon: '☁️', rain: 30 },
  { day: 'Thu',      high: 32, low: 23, condition: 'Sunny',         icon: '☀️', rain: 5  },
  { day: 'Fri',      high: 29, low: 21, condition: 'Sunny',         icon: '☀️', rain: 5  }
];

function WeatherStat({ icon, label, value, unit }) {
  return (
    <div style={{ padding: '16px', background: '#0f172a', borderRadius: '10px', textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{icon}</div>
      <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 700 }}>{value}<span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '2px' }}>{unit}</span></div>
    </div>
  );
}

export default function WeatherPage() {
  const { sensorData } = useSensor();
  const w = sensorData.weather;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}>🌤️ Weather Station</h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Real-time weather monitoring for smart farming decisions</p>
      </div>

      {/* Current weather hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f2d1a 100%)',
        border: '1px solid #334155', borderRadius: '16px', padding: '28px', marginBottom: '20px',
        display: 'flex', alignItems: 'center', gap: '24px'
      }}>
        <div style={{ fontSize: '5rem' }}>⛅</div>
        <div>
          <div style={{ color: '#f1f5f9', fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>{w.temperature}°C</div>
          <div style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '4px' }}>{w.condition}</div>
          <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Farm Location · Updated just now</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          {w.rainfall > 5 && (
            <div style={{
              padding: '8px 14px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: '8px', color: '#60a5fa', fontSize: '0.85rem', fontWeight: 600
            }}>
              🌧️ Rain expected — irrigation paused
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <WeatherStat icon="💦" label="Humidity"   value={w.humidity}   unit="%" />
        <WeatherStat icon="💨" label="Wind Speed" value={w.windSpeed}  unit="km/h" />
        <WeatherStat icon="🌧️" label="Rainfall"   value={w.rainfall}   unit="mm" />
        <WeatherStat icon="☀️" label="UV Index"   value={w.uvIndex}    unit="" />
        <WeatherStat icon="🌡️" label="Feels Like" value={`${Math.round(w.temperature + 2)}°`} unit="" />
      </div>

      {/* 5-day forecast */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '16px' }}>📅 5-Day Forecast</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {forecast.map(day => (
            <div key={day.day} style={{
              padding: '14px', background: '#0f172a', borderRadius: '10px', textAlign: 'center',
              border: day.day === 'Today' ? '1px solid #16a34a44' : '1px solid #1e293b'
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
            { icon: '💧', text: forecast[1].rain > 50 ? 'Rain expected tomorrow — skip irrigation today to save water' : 'No rain expected — maintain irrigation schedule', type: 'info' },
            { icon: '🌡️', text: w.temperature > 35 ? 'High temperature alert — increase irrigation frequency' : 'Temperature is optimal for crop growth', type: w.temperature > 35 ? 'warning' : 'success' },
            { icon: '💨', text: w.windSpeed > 20 ? 'High winds — avoid pesticide spraying today' : 'Wind conditions suitable for spraying', type: w.windSpeed > 20 ? 'warning' : 'success' },
            { icon: '☀️', text: w.uvIndex > 8 ? 'High UV — protect workers and sensitive crops' : 'UV levels are normal', type: w.uvIndex > 8 ? 'warning' : 'success' }
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
