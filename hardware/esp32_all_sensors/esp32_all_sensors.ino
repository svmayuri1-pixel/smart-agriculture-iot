/**
 * Smart Agriculture — ESP32 All-in-One Sensor Node
 * 
 * Sensors:
 *   1. Capacitive Soil Moisture → GPIO 34
 *   2. DHT22 Temperature + Humidity → GPIO 4
 *   3. PIR Motion Sensor → GPIO 14
 *   4. HX711 Load Cell (Storage Weight) → GPIO 21, 22
 *   5. NEO-6M GPS → GPIO 16 (RX2), 17 (TX2)
 * 
 * Libraries (Install via Arduino Library Manager):
 *   - PubSubClient    → MQTT
 *   - ArduinoJson     → JSON
 *   - DHT sensor library (Adafruit)
 *   - HX711 (bogde)
 *   - TinyGPS++
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <HX711.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>

// ════════════════════════════════════════
//   ⚙️  CONFIG — இங்க மட்டும் மாத்துங்க
// ════════════════════════════════════════
const char* WIFI_SSID     = "உங்க_WiFi_பேர்";      // உங்க WiFi name
const char* WIFI_PASSWORD = "உங்க_WiFi_Password";   // உங்க WiFi password
const char* MQTT_BROKER   = "broker.hivemq.com";
const int   MQTT_PORT     = 1883;
const char* DEVICE_ID     = "esp32-farm-01";         // Unique ID for this device

// ════════════════════════════════════════
//   📍 PIN DEFINITIONS
// ════════════════════════════════════════
#define SOIL_PIN        34    // Soil moisture analog pin
#define DHT_PIN          4    // DHT22 data pin
#define PIR_PIN         14    // PIR motion sensor
#define HX711_DOUT      21    // Load cell data
#define HX711_SCK       22    // Load cell clock
#define GPS_RX          16    // GPS RX2
#define GPS_TX          17    // GPS TX2
#define DHT_TYPE        DHT22

// ════════════════════════════════════════
//   📊 CALIBRATION VALUES
// ════════════════════════════════════════
// Soil Moisture: measure in dry air and in water
const int SOIL_DRY = 3200;   // ADC value in dry air (adjust after testing)
const int SOIL_WET = 1200;   // ADC value in water   (adjust after testing)

// Load Cell: calibration factor (adjust after testing with known weight)
const float LOAD_CELL_CALIBRATION = 420.0;

// ════════════════════════════════════════
//   🕐 TIMING
// ════════════════════════════════════════
const unsigned long SENSOR_INTERVAL = 10000;  // 10 seconds
const unsigned long GPS_INTERVAL    = 15000;  // 15 seconds

// ════════════════════════════════════════
//   OBJECTS
// ════════════════════════════════════════
WiFiClient    wifiClient;
PubSubClient  mqtt(wifiClient);
DHT           dht(DHT_PIN, DHT_TYPE);
HX711         scale;
TinyGPSPlus   gps;
HardwareSerial gpsSerial(2);

unsigned long lastSensorPublish = 0;
unsigned long lastGPSPublish    = 0;
bool motionDetected = false;

// ════════════════════════════════════════
//   SETUP
// ════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  Serial.println("\n🌱 Smart Agriculture Sensor Node Starting...");

  // Pin modes
  pinMode(PIR_PIN, INPUT);

  // DHT22 init
  dht.begin();
  Serial.println("✅ DHT22 initialized");

  // HX711 Load Cell init
  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(LOAD_CELL_CALIBRATION);
  scale.tare();  // Reset to zero
  Serial.println("✅ Load Cell initialized");

  // GPS init
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
  Serial.println("✅ GPS initialized");

  // WiFi connect
  connectWiFi();

  // MQTT setup
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setBufferSize(512);
  connectMQTT();

  Serial.println("✅ All systems ready!\n");
}

// ════════════════════════════════════════
//   MAIN LOOP
// ════════════════════════════════════════
void loop() {
  // Feed GPS data continuously
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }

  // MQTT keep alive
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();

  unsigned long now = millis();

  // Publish sensor data every 10 seconds
  if (now - lastSensorPublish >= SENSOR_INTERVAL) {
    lastSensorPublish = now;
    publishFieldData();
    checkMotion();
    publishStorageData();
  }

  // Publish GPS every 15 seconds
  if (now - lastGPSPublish >= GPS_INTERVAL) {
    lastGPSPublish = now;
    publishGPSData();
  }
}

// ════════════════════════════════════════
//   📊 PUBLISH FIELD SENSOR DATA
//   Topic: farm/sensors/field
// ════════════════════════════════════════
void publishFieldData() {
  // Read Soil Moisture
  int rawSoil = analogRead(SOIL_PIN);
  float soilMoisture = map(rawSoil, SOIL_DRY, SOIL_WET, 0, 100);
  soilMoisture = constrain(soilMoisture, 0, 100);

  // Read DHT22
  float humidity    = dht.readHumidity();
  float temperature = dht.readTemperature();

  // Validate DHT22
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("⚠️ DHT22 read failed!");
    humidity    = 0;
    temperature = 0;
  }

  // Build JSON
  StaticJsonDocument<256> doc;
  doc["nodeId"]       = DEVICE_ID;
  doc["soilMoisture"] = round(soilMoisture * 10) / 10.0;
  doc["humidity"]     = round(humidity * 10) / 10.0;
  doc["temperature"]  = round(temperature * 10) / 10.0;
  doc["rawSoil"]      = rawSoil;
  doc["timestamp"]    = millis();

  char payload[256];
  serializeJson(doc, payload);

  if (mqtt.publish("farm/sensors/field", payload, true)) {
    Serial.printf("🌱 Field: Soil=%.1f%% Humidity=%.1f%% Temp=%.1f°C\n",
                  soilMoisture, humidity, temperature);
  }
}

// ════════════════════════════════════════
//   🚨 CHECK MOTION (PIR Sensor)
//   Topic: farm/intrusion/alert
// ════════════════════════════════════════
void checkMotion() {
  bool currentMotion = digitalRead(PIR_PIN);

  // Only publish when state changes
  if (currentMotion != motionDetected) {
    motionDetected = currentMotion;

    StaticJsonDocument<200> doc;
    doc["detected"]        = motionDetected;
    doc["zone"]            = "Farm Perimeter";
    doc["type"]            = motionDetected ? "Motion Detected" : "Clear";
    doc["deterrentActive"] = false;
    doc["deviceId"]        = DEVICE_ID;
    doc["timestamp"]       = millis();

    char payload[200];
    serializeJson(doc, payload);

    mqtt.publish("farm/intrusion/alert", payload, true);

    if (motionDetected) {
      Serial.println("🚨 MOTION DETECTED!");
    } else {
      Serial.println("✅ Motion cleared");
    }
  }
}

// ════════════════════════════════════════
//   📦 PUBLISH STORAGE WEIGHT DATA
//   Topic: farm/inventory/storage
// ════════════════════════════════════════
void publishStorageData() {
  float weight = 0;

  if (scale.is_ready()) {
    weight = scale.get_units(5);  // Average of 5 readings
    if (weight < 0) weight = 0;   // Ignore negative values
  }

  StaticJsonDocument<200> doc;
  doc["deviceId"]  = DEVICE_ID;
  doc["weightKg"]  = round(weight * 100) / 100.0;
  doc["timestamp"] = millis();

  char payload[200];
  serializeJson(doc, payload);

  mqtt.publish("farm/inventory/storage", payload, true);
  Serial.printf("📦 Storage Weight: %.2f kg\n", weight);
}

// ════════════════════════════════════════
//   📍 PUBLISH GPS DATA
//   Topic: farm/vehicles/DEVICE_ID
// ════════════════════════════════════════
void publishGPSData() {
  StaticJsonDocument<256> doc;
  doc["id"]   = DEVICE_ID;
  doc["name"] = "Farm Vehicle";

  if (gps.location.isValid() && gps.location.age() < 5000) {
    doc["lat"]      = gps.location.lat();
    doc["lng"]      = gps.location.lng();
    doc["speed"]    = gps.speed.kmph();
    doc["gpsValid"] = true;
    Serial.printf("📍 GPS: %.6f, %.6f Speed: %.1f km/h\n",
                  gps.location.lat(), gps.location.lng(), gps.speed.kmph());
  } else {
    doc["gpsValid"] = false;
    doc["speed"]    = 0;
    Serial.println("📍 GPS: Waiting for fix...");
  }

  doc["fuel"]      = 85;   // Replace with actual fuel sensor if available
  doc["status"]    = gps.speed.kmph() > 1 ? "Active" : "Parked";
  doc["timestamp"] = millis();

  char payload[256];
  serializeJson(doc, payload);

  char topic[64];
  snprintf(topic, sizeof(topic), "farm/vehicles/%s", DEVICE_ID);
  mqtt.publish(topic, payload, true);
}

// ════════════════════════════════════════
//   WiFi & MQTT HELPERS
// ════════════════════════════════════════
void connectWiFi() {
  Serial.printf("📶 Connecting to WiFi: %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✅ WiFi Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n❌ WiFi Failed! Check credentials.");
  }
}

void connectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("📡 Connecting to MQTT...");
    String clientId = String(DEVICE_ID) + "-" + String(random(0xffff), HEX);
    if (mqtt.connect(clientId.c_str())) {
      Serial.println("✅ MQTT Connected!");
      // Announce device online
      mqtt.publish("farm/devices/status",
        ("{\"deviceId\":\"" + String(DEVICE_ID) + "\",\"status\":\"online\"}").c_str(),
        true);
    } else {
      Serial.printf("❌ Failed (rc=%d), retry in 5s\n", mqtt.state());
      delay(5000);
    }
  }
}
