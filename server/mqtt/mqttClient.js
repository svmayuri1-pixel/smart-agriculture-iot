/**
 * MQTT Client — bridges real IoT sensor data to the dashboard via Socket.IO
 *
 * Topics subscribed:
 *   farm/sensors/field        ← ESP32 field sensor (soil, humidity, pH)
 *   farm/livestock/#          ← ESP32 GPS collars (one per animal)
 *   farm/vehicles/#           ← GPS vehicle trackers
 *   farm/pest/detection       ← Pest detection events
 *   farm/intrusion/alert      ← Motion/intrusion alerts
 *   farm/cameras/status       ← Camera online/offline + stream URLs
 */

// In-memory store of latest real sensor readings
const liveData = {
  field:     null,
  livestock: {},   // keyed by animal ID
  vehicles:  {},   // keyed by vehicle ID
  pest:      null,
  intrusion: null,
  cameras:   {},   // keyed by camera ID
};

module.exports = function (io) {
  try {
    const mqtt = require('mqtt');
    const client = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com', {
      clientId: `smartfarm-server-${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000,
    });

    client.on('connect', () => {
      console.log('📡 MQTT connected to broker');
      client.subscribe([
        'farm/sensors/field',
        'farm/livestock/#',
        'farm/vehicles/#',
        'farm/pest/detection',
        'farm/intrusion/alert',
        'farm/cameras/status',
      ], (err) => {
        if (err) console.error('MQTT subscribe error:', err);
        else console.log('📡 Subscribed to all farm topics');
      });
    });

    client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());

        // ── Field sensors ──────────────────────────────────────────────
        if (topic === 'farm/sensors/field') {
          liveData.field = {
            soilMoisture:  data.soilMoisture,
            humidity:      data.humidity,
            ph:            data.ph,
            nitrogen:      data.nitrogen   || null,
            phosphorus:    data.phosphorus || null,
            potassium:     data.potassium  || null,
            lightIntensity: data.lightIntensity || null,
            lastUpdated:   new Date().toISOString(),
          };
          io.emit('field_update', liveData.field);
          console.log(`🌱 Field update: moisture=${data.soilMoisture}% humidity=${data.humidity}%`);
        }

        // ── Livestock GPS collars ──────────────────────────────────────
        else if (topic.startsWith('farm/livestock/')) {
          const animalId = topic.split('/')[2];
          liveData.livestock[animalId] = {
            id:          data.id   || animalId,
            name:        data.name || animalId,
            type:        data.type || 'Unknown',
            heartRate:   data.heartRate,
            lat:         data.lat,
            lng:         data.lng,
            gpsValid:    data.gpsValid !== false,
            status:      data.heartRate > 100 ? 'Alert' : 'Healthy',
            lastUpdated: new Date().toISOString(),
          };
          io.emit('livestock_update', { id: animalId, ...liveData.livestock[animalId] });
          console.log(`🐄 Livestock update: ${data.name || animalId} HR=${data.heartRate}`);
        }

        // ── Vehicle GPS trackers ───────────────────────────────────────
        else if (topic.startsWith('farm/vehicles/')) {
          const vehicleId = topic.split('/')[2];
          liveData.vehicles[vehicleId] = {
            id:          data.id   || vehicleId,
            name:        data.name || vehicleId,
            lat:         data.lat,
            lng:         data.lng,
            speed:       data.speed || 0,
            fuel:        data.fuel  || 0,
            status:      data.speed > 0 ? 'Active' : 'Parked',
            lastUpdated: new Date().toISOString(),
          };
          io.emit('vehicle_update', { id: vehicleId, ...liveData.vehicles[vehicleId] });
        }

        // ── Pest detection ────────────────────────────────────────────
        else if (topic === 'farm/pest/detection') {
          liveData.pest = {
            detected:    data.detected || false,
            type:        data.pestType || 'Unknown',
            confidence:  data.confidence || 0,
            cameraId:    data.cameraId,
            imageUrl:    data.imageUrl || null,
            lastUpdated: new Date().toISOString(),
          };
          io.emit('pest_update', liveData.pest);
          if (data.detected) {
            io.emit('alert', {
              type: 'critical', category: 'Pest',
              message: `${data.pestType} detected (${data.confidence}% confidence) — ${data.cameraId}`,
              time: 'Just now'
            });
          }
        }

        // ── Intrusion alerts ──────────────────────────────────────────
        else if (topic === 'farm/intrusion/alert') {
          liveData.intrusion = {
            detected:         data.detected || false,
            zone:             data.zone || 'Unknown',
            type:             data.type || 'Unknown',
            deterrentActive:  data.deterrentActive || false,
            lastUpdated:      new Date().toISOString(),
          };
          io.emit('intrusion_update', liveData.intrusion);
          if (data.detected) {
            io.emit('alert', {
              type: 'warning', category: 'Intrusion',
              message: `${data.type} intrusion in ${data.zone}`,
              time: 'Just now'
            });
          }
        }

        // ── Camera status ─────────────────────────────────────────────
        else if (topic === 'farm/cameras/status') {
          const camId = data.cameraId;
          liveData.cameras[camId] = {
            id:          camId,
            status:      data.status,
            streamUrl:   data.streamUrl,
            lastUpdated: new Date().toISOString(),
          };
          io.emit('camera_update', liveData.cameras[camId]);
          console.log(`📷 Camera ${camId}: ${data.status} — ${data.streamUrl}`);
        }

        // Forward raw message to all clients
        io.emit('mqtt_message', { topic, data });

      } catch (e) {
        // Non-JSON message, ignore
      }
    });

    client.on('error', (err) => {
      console.log('MQTT error (using simulator fallback):', err.message);
    });

    client.on('reconnect', () => console.log('📡 MQTT reconnecting...'));
    client.on('offline',   () => console.log('📡 MQTT offline'));

    // Expose live data so routes can serve it
    module.exports.liveData = liveData;

  } catch (e) {
    console.log('MQTT module unavailable, using simulator only');
  }
};

module.exports.liveData = liveData;
