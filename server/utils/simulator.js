/**
 * Smart Agriculture — Data Manager
 *
 * Real sensor data வந்தா → real data மட்டும் use பண்ணும்
 * Real sensor இல்லன்னா → null values return பண்ணும் (no fake data)
 */

// Store for real sensor data from ESP32
const realData = {
  field:     null,
  intrusion: null,
  vehicles:  {},
  livestock: {},
  inventory: {},
  cameras:   {}
};

// Update real data when MQTT message arrives
function updateRealData(type, data) {
  realData[type] = { ...data, isReal: true, lastUpdated: new Date().toISOString() };
}

function updateRealVehicle(id, data) {
  realData.vehicles[id] = { ...data, isReal: true };
}

function updateRealLivestock(id, data) {
  realData.livestock[id] = { ...data, isReal: true };
}

function updateRealCamera(id, data) {
  realData.cameras[id] = { ...data, isReal: true };
}

// ─── Real data only — no simulation fallback ──────────────────────────────
function simulateSensorData() {
  // Field: real data only
  const field = realData.field ? {
    soilMoisture:   realData.field.soilMoisture   ?? null,
    humidity:       realData.field.humidity        ?? null,
    temperature:    realData.field.temperature     ?? null,
    lightIntensity: realData.field.lightIntensity  ?? null,
    ph:             realData.field.ph              ?? null,
    nitrogen:       realData.field.nitrogen        ?? null,
    phosphorus:     realData.field.phosphorus      ?? null,
    potassium:      realData.field.potassium       ?? null,
    isReal:         true
  } : {
    soilMoisture: null, temperature: null, humidity: null,
    lightIntensity: null, ph: null, nitrogen: null,
    phosphorus: null, potassium: null, isReal: false
  };

  // Intrusion: real data only
  const intrusion = realData.intrusion ? {
    detected:        realData.intrusion.detected        ?? false,
    zone:            realData.intrusion.zone            ?? null,
    type:            realData.intrusion.type            ?? null,
    deterrentActive: realData.intrusion.deterrentActive ?? false,
    isReal:          true
  } : {
    detected: false, zone: null, type: null, deterrentActive: false, isReal: false
  };

  // Vehicles: real only
  const vehicles = Object.values(realData.vehicles);

  // Livestock: real only
  const livestock = Object.values(realData.livestock);

  return {
    timestamp: new Date().toISOString(),
    field,
    weather: {
      temperature: null, humidity: null, windSpeed: null,
      rainfall: null, uvIndex: null, condition: null
    },
    irrigation: {
      zone1: false, zone2: false, zone3: false,
      waterFlow: null, tankLevel: null
    },
    pest: {
      detected: false, confidence: null, type: 'None', sprayActive: false
    },
    livestock,
    vehicles,
    intrusion,
    inventory: {
      fertilizer: null, seeds: null, pesticide: null, water: null, fuel: null
    }
  };
}

module.exports = {
  simulateSensorData,
  updateRealData,
  updateRealVehicle,
  updateRealLivestock,
  updateRealCamera,
  realData
};
