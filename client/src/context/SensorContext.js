import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SensorContext = createContext(null);

// Empty initial state — no fake data, wait for real sensors
function emptyData() {
  return {
    timestamp: null,
    field:     { soilMoisture: null, temperature: null, humidity: null, ph: null, nitrogen: null, phosphorus: null, potassium: null, lightIntensity: null, isReal: false },
    weather:   { temperature: null, humidity: null, windSpeed: null, rainfall: null, uvIndex: null, condition: null },
    irrigation: { zone1: false, zone2: false, zone3: false, waterFlow: null, tankLevel: null },
    pest:      { detected: false, confidence: null, type: 'None', sprayActive: false },
    livestock: [],
    vehicles:  [],
    intrusion: { detected: false, zone: null, type: null, deterrentActive: false },
    inventory: { fertilizer: null, seeds: null, pesticide: null, water: null, fuel: null }
  };
}

export function SensorProvider({ children }) {
  const [sensorData, setSensorData] = useState(emptyData());
  const [connected, setConnected]   = useState(false);
  const [sensorOnline, setSensorOnline] = useState(false);
  const [history, setHistory]       = useState([]);
  const [relay, setRelay]           = useState({ irrigationRelay: false, mode: 'auto', lastUpdated: null });

  useEffect(() => {
    // Fetch initial relay state
    fetch('/api/sensors/relay')
      .then(r => r.json())
      .then(setRelay)
      .catch(() => {});

    const socket = io('/', { transports: ['websocket', 'polling'] });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Full sensor update from server (broadcasted every 3s)
    socket.on('sensor_update', (data) => {
      // Accept if field data has soilMoisture (real sensor connected)
      if (data.field && data.field.soilMoisture !== null && data.field.soilMoisture !== undefined) {
        setSensorOnline(true);
        setSensorData(prev => ({ ...prev, ...data, field: { ...data.field, isReal: true } }));
        setHistory(prev => [...prev.slice(-23), {
          time:         new Date(data.timestamp).toLocaleTimeString(),
          soilMoisture: data.field.soilMoisture,
          temperature:  data.field.temperature,
          humidity:     data.field.humidity
        }]);
      }
    });

    // Real-time field sensor update via MQTT
    socket.on('field_update', (data) => {
      setSensorOnline(true);
      setSensorData(prev => ({
        ...prev,
        timestamp: new Date().toISOString(),
        field: { ...data, isReal: true }
      }));
      setHistory(prev => [...prev.slice(-23), {
        time:         new Date().toLocaleTimeString(),
        soilMoisture: data.soilMoisture,
        temperature:  data.temperature,
        humidity:     data.humidity
      }]);
    });

    // Real-time livestock update
    socket.on('livestock_update', (animal) => {
      setSensorData(prev => {
        const existing = prev.livestock.filter(a => a.id !== animal.id);
        return { ...prev, livestock: [...existing, animal] };
      });
    });

    // Real-time vehicle update
    socket.on('vehicle_update', (vehicle) => {
      setSensorData(prev => {
        const existing = prev.vehicles.filter(v => v.id !== vehicle.id);
        return { ...prev, vehicles: [...existing, vehicle] };
      });
    });

    // Pest detection
    socket.on('pest_update', (data) => {
      setSensorData(prev => ({ ...prev, pest: data }));
    });

    // Intrusion alert
    socket.on('intrusion_update', (data) => {
      setSensorData(prev => ({ ...prev, intrusion: data }));
    });

    // Relay update
    socket.on('relay_update', (data) => {
      setRelay(data);
    });

    return () => { socket.disconnect(); };
  }, []);

  // Toggle relay manually from UI
  async function toggleRelay(on) {
    try {
      const res = await fetch('/api/sensors/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on })
      });
      const data = await res.json();
      setRelay(data);
    } catch (e) {
      console.error('Relay toggle failed', e);
    }
  }

  // Switch auto/manual mode
  async function setRelayMode(mode) {
    try {
      const res = await fetch('/api/sensors/relay/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await res.json();
      setRelay(data);
    } catch (e) {
      console.error('Relay mode change failed', e);
    }
  }

  return (
    <SensorContext.Provider value={{ sensorData, connected, sensorOnline, history, relay, toggleRelay, setRelayMode }}>
      {children}
    </SensorContext.Provider>
  );
}

export const useSensor = () => useContext(SensorContext);
