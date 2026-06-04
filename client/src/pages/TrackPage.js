/**
 * TrackPage — Phone GPS → Dashboard Live Tracker
 * Open this on your phone: https://your-site.onrender.com/track
 * Press "Start Tracking" → phone GPS sends location to dashboard map
 */
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function TrackPage() {
  const [tracking, setTracking]     = useState(false);
  const [status, setStatus]         = useState('idle'); // idle | requesting | tracking | error
  const [message, setMessage]       = useState('');
  const [coords, setCoords]         = useState(null);
  const [accuracy, setAccuracy]     = useState(null);
  const [connected, setConnected]   = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const [deviceName, setDeviceName] = useState('Vehicle');
  const [deviceId, setDeviceId]     = useState('PHONE-GPS-01');

  const watchId  = useRef(null);
  const socket   = useRef(null);

  // Connect socket
  useEffect(() => {
    socket.current = io('/', { transports: ['websocket', 'polling'] });
    socket.current.on('connect',    () => setConnected(true));
    socket.current.on('disconnect', () => setConnected(false));
    return () => {
      socket.current.disconnect();
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setMessage('உங்க browser-ல GPS support இல்லை. Chrome use பண்ணுங்க.');
      return;
    }

    setStatus('requesting');
    setMessage('GPS permission கேக்குது... Allow பண்ணுங்க ✅');

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy: acc, speed } = position.coords;

        setCoords({ lat: latitude, lng: longitude });
        setAccuracy(Math.round(acc));
        setStatus('tracking');
        setTracking(true);
        setUpdateCount(c => c + 1);
        setMessage(`📍 Live tracking active!`);

        // Send to server via socket
        socket.current.emit('phone_gps', {
          id:        deviceId,
          name:      deviceName,
          lat:       latitude,
          lng:       longitude,
          speed:     speed ? Math.round(speed * 3.6 * 10) / 10 : 0, // m/s → km/h
          accuracy:  Math.round(acc),
          gpsValid:  true,
          status:    speed && speed > 0.5 ? 'Active' : 'Parked',
          fuel:      85,
          timestamp: Date.now()
        });
      },
      (err) => {
        setStatus('error');
        switch (err.code) {
          case 1: setMessage('❌ GPS Permission denied! Browser settings-la location allow பண்ணுங்க.'); break;
          case 2: setMessage('❌ GPS signal கிடைக்கல. Window கிட்ட போங்க.'); break;
          case 3: setMessage('❌ GPS timeout. Again try பண்ணுங்க.'); break;
          default: setMessage('❌ GPS error: ' + err.message);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge:         5000,
        timeout:            15000
      }
    );
  };

  const stopTracking = () => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setTracking(false);
    setStatus('idle');
    setMessage('');

    // Tell dashboard this device went offline
    socket.current.emit('phone_gps', {
      id:      deviceId,
      name:    deviceName,
      status:  'Offline',
      gpsValid: false,
      lat: coords?.lat || 0,
      lng: coords?.lng || 0,
    });
  };

  const accuracyColor = accuracy
    ? accuracy < 20 ? '#4ade80' : accuracy < 50 ? '#fbbf24' : '#f87171'
    : '#64748b';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #0a2010 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>📱</div>
        <h1 style={{ color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
          GPS Tracker
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '6px' }}>
          Smart Agriculture · Live Location
        </p>
        {/* Connection status */}
        <div style={{
          marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 12px', borderRadius: '20px',
          background: connected ? 'rgba(22,163,74,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${connected ? '#16a34a44' : '#ef444444'}`
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: connected ? '#4ade80' : '#f87171', display: 'inline-block' }} />
          <span style={{ color: connected ? '#4ade80' : '#f87171', fontSize: '0.75rem', fontWeight: 600 }}>
            {connected ? 'Server Connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: '#1e293b', borderRadius: '20px',
        border: '1px solid #334155', padding: '28px',
        width: '100%', maxWidth: '360px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>

        {/* Device Name Input */}
        {!tracking && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              DEVICE NAME (Dashboard-ல தெரியும்)
            </label>
            <input
              value={deviceName}
              onChange={e => setDeviceName(e.target.value)}
              placeholder="My Phone"
              style={{
                width: '100%', padding: '10px 14px', background: '#0f172a',
                border: '1px solid #334155', borderRadius: '10px',
                color: '#e2e8f0', fontSize: '0.9rem', outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        {/* Coordinates display */}
        {coords && (
          <div style={{
            marginBottom: '20px', padding: '14px',
            background: '#0f172a', borderRadius: '12px',
            border: '1px solid #334155'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 600, marginBottom: '2px' }}>LATITUDE</div>
                <div style={{ color: '#4ade80', fontSize: '1rem', fontWeight: 700 }}>{coords.lat.toFixed(6)}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 600, marginBottom: '2px' }}>LONGITUDE</div>
                <div style={{ color: '#4ade80', fontSize: '1rem', fontWeight: 700 }}>{coords.lng.toFixed(6)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: accuracyColor, display: 'inline-block' }} />
                <span style={{ color: accuracyColor, fontSize: '0.75rem' }}>Accuracy: ±{accuracy}m</span>
              </div>
              <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                {updateCount} updates
              </span>
            </div>
          </div>
        )}

        {/* Status message */}
        {message && (
          <div style={{
            marginBottom: '20px', padding: '10px 14px',
            background: status === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(22,163,74,0.1)',
            border: `1px solid ${status === 'error' ? '#ef444433' : '#16a34a33'}`,
            borderRadius: '10px'
          }}>
            <p style={{
              color: status === 'error' ? '#f87171' : '#4ade80',
              fontSize: '0.82rem', margin: 0, lineHeight: 1.5
            }}>{message}</p>
          </div>
        )}

        {/* Main Button */}
        {!tracking ? (
          <button onClick={startTracking} style={{
            width: '100%', padding: '16px',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            border: 'none', borderRadius: '14px',
            color: '#fff', fontSize: '1rem', fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.02em',
            boxShadow: '0 4px 20px rgba(22,163,74,0.4)'
          }}>
            {status === 'requesting' ? '⏳ GPS கேக்குது...' : '🚀 Start Tracking'}
          </button>
        ) : (
          <button onClick={stopTracking} style={{
            width: '100%', padding: '16px',
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            border: 'none', borderRadius: '14px',
            color: '#fff', fontSize: '1rem', fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(220,38,38,0.4)'
          }}>
            ⏹ Stop Tracking
          </button>
        )}

        {/* Pulsing indicator when tracking */}
        {tracking && (
          <div style={{ textAlign: 'center', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{
              width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80',
              display: 'inline-block', animation: 'pulse 1.5s infinite'
            }} />
            <span style={{ color: '#4ade80', fontSize: '0.82rem', fontWeight: 600 }}>
              Dashboard map-ல live update ஆகுது!
            </span>
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(1.4); }
          }
        `}</style>
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '24px', padding: '16px 20px',
        background: 'rgba(59,130,246,0.08)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: '14px', maxWidth: '360px', width: '100%'
      }}>
        <p style={{ color: '#60a5fa', fontSize: '0.75rem', fontWeight: 700, margin: '0 0 8px 0' }}>
          📋 HOW TO USE
        </p>
        <p style={{ color: '#475569', fontSize: '0.75rem', lineHeight: 1.8, margin: 0 }}>
          1. Phone-ல இந்த page open பண்ணுங்க<br/>
          2. Device name type பண்ணுங்க<br/>
          3. "Start Tracking" press பண்ணுங்க<br/>
          4. GPS permission Allow பண்ணுங்க<br/>
          5. Dashboard → Vehicles page-ல map-ல உங்க location தெரியும் ✅
        </p>
      </div>
    </div>
  );
}
