/**
 * ═══════════════════════════════════════════════════
 *   Smart Agriculture — ESP32 #1 Field Sensors
 * ═══════════════════════════════════════════════════
 * 
 * SENSORS CONNECTED:
 *   1. Soil Moisture  → GPIO 34
 *   2. DHT22 (Temp+Humidity) → GPIO 4
 *   3. PIR Motion     → GPIO 14
 *   4. HX711 Weight   → GPIO 21 (DOUT), 22 (SCK)
 * 
 * LIBRARIES NEEDED (Tools → Manage Libraries):
 *   ✅ PubSubClient       by Nick O'Leary
 *   ✅ ArduinoJson        by Benoit Blanchon
 *   ✅ DHT sensor library by Adafruit
 *   ✅ HX711              by bogde
 * 
 * BOARD SETTINGS:
 *   Board: ESP32 Dev Module
 *   Upload Speed: 115200
 * ═══════════════════════════════════════════════════
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <HX711.h>

// ╔══════════════════════════════════════╗
// ║   ⚙️  இங்க மட்டும் மாத்துங்க        ║
// ╚══════════════════════════════════════╝
const char* WIFI_SSID     = "உங்க_WiFi_பேர்";
const char* WIFI_PASSWORD = "உங்க_WiFi_Password";
const char* MQTT_BROKER   = "broker.hivemq.com";
const int   MQTT_PORT     = 1883;
const char* DEVICE_ID     = "esp32-field-01";

// ╔══════════════════════════════════════╗
// ║   📍 PIN NUMBERS                     ║
// ╚══════════════════════════════════════╝
#define SOIL_PIN      34    // Soil Moisture Analog
#define DHT_PIN        4    // DHT22 Data
#define PIR_PIN       14    // PIR Motion
#define HX711_DOUT    21    // Load Cell Data
#define HX711_SCK     22    // Load Cell Clock
#define DHT_TYPE      DHT22

// ╔══════════════════════════════════════╗
// ║   📊 CALIBRATION                     ║
// ╚══════════════════════════════════════╝
// Soil: Dry air-ல ADC value பாருங்க → SOIL_DRY
//       Water-ல ADC value பாருங்க  → SOIL_WET
const int   SOIL_DRY             = 3200;
const int   SOIL_WET             = 1200;
const float LOAD_CELL_CALIBRATION = 420.0;

// ╔══════════════════════════════════════╗
// ║   🕐 TIMING                          ║
// ╚══════════════════════════════════════╝
const unsigned long PUBLISH_INTERVAL = 10000; // 10 seconds

// ╔══════════════════════════════════════╗
// ║   OBJECTS                            ║
// ╚══════════════════════════════════════╝
WiFiClient   wifiClient;
PubSubClient mqtt(wifiClient);
DHT          dht(DHT_PIN, DHT_TYPE);
HX711        scale;

unsigned long lastPublish  = 0;
bool          lastMotion   = false;

// ════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  Serial.println("\n🌱 ESP32 Field Sensor Starting...");

  pinMode(PIR_PIN, INPUT);

  // DHT22
  dht.begin();
  Serial.println("✅ DHT22 Ready");

  // HX711 Load Cell
  scale.begin(HX711_DOUT, HX711_SCK);
  if (scale.is_ready()) {
    scale.set_scale(LOAD_CELL_CALIBRATION);
    scale.tare();
    Serial.println("✅ Load Cell Ready");
  } else {
    Serial.println("⚠️ Load Cell not found — check wiring");
  }

  // WiFi
  connectWiFi();

  // MQTT
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setBufferSize(512);
  connectMQTT();

  Serial.println("✅ All Ready! Publishing every 10 seconds\n");
}

// ════════════════════════════════════════
void loop() {
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();

  unsigned long now = millis();

  // Publish every 10 seconds
  if (now - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = now;
    publishFieldSensors();
    publishStorageWeight();
  }

  // Check motion continuously
  checkMotion();

  delay(100);
}

// ════════════════════════════════════════
//  🌱 FIELD SENSORS
//  Topic: farm/sensors/field
// ════════════════════════════════════════
void publishFieldSensors() {
  // ── Soil Moisture ──
  int   rawSoil      = analogRead(SOIL_PIN);
  float soilMoisture = map(rawSoil, SOIL_DRY, SOIL_WET, 0, 100);
  soilMoisture       = constrain(soilMoisture, 0, 100);

  // ── DHT22 ──
  float humidity    = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("⚠️ DHT22 read failed!");
    return;
  }

  // ── JSON ──
  StaticJsonDocument<256> doc;
  doc["nodeId"]       = DEVICE_ID;
  doc["soilMoisture"] = round(soilMoisture * 10) / 10.0;
  doc["humidity"]     = round(humidity * 10) / 10.0;
  doc["temperature"]  = round(temperature * 10) / 10.0;
  doc["timestamp"]    = millis();

  char payload[256];
  serializeJson(doc, payload);

  if (mqtt.publish("farm/sensors/field", payload, true)) {
    Serial.println("─────────────────────────────");
    Serial.printf("🌱 Soil    : %.1f%%\n", soilMoisture);
    Serial.printf("💧 Humidity: %.1f%%\n", humidity);
    Serial.printf("🌡️ Temp    : %.1f°C\n", temperature);
  }
}

// ════════════════════════════════════════
//  📦 STORAGE WEIGHT
//  Topic: farm/inventory/storage
// ════════════════════════════════════════
void publishStorageWeight() {
  if (!scale.is_ready()) return;

  float weight = scale.get_units(5);
  if (weight < 0) weight = 0;

  StaticJsonDocument<128> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["weightKg"] = round(weight * 100) / 100.0;
  doc["timestamp"] = millis();

  char payload[128];
  serializeJson(doc, payload);

  mqtt.publish("farm/inventory/storage", payload, true);
  Serial.printf("📦 Weight  : %.2f kg\n", weight);
}

// ════════════════════════════════════════
//  🚨 MOTION DETECTION
//  Topic: farm/intrusion/alert
// ════════════════════════════════════════
void checkMotion() {
  bool motion = digitalRead(PIR_PIN);

  if (motion != lastMotion) {
    lastMotion = motion;

    StaticJsonDocument<200> doc;
    doc["detected"]        = motion;
    doc["zone"]            = "Farm Perimeter";
    doc["type"]            = motion ? "Motion Detected" : "Clear";
    doc["deterrentActive"] = false;
    doc["deviceId"]        = DEVICE_ID;

    char payload[200];
    serializeJson(doc, payload);

    mqtt.publish("farm/intrusion/alert", payload, true);

    if (motion) {
      Serial.println("🚨 MOTION DETECTED!");
    } else {
      Serial.println("✅ Motion Cleared");
    }
  }
}

// ════════════════════════════════════════
//  WiFi & MQTT
// ════════════════════════════════════════
void connectWiFi() {
  Serial.printf("📶 Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 20) {
    delay(500); Serial.print("."); tries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✅ WiFi Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n❌ WiFi Failed! Check SSID/Password");
  }
}

void connectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("📡 MQTT Connecting...");
    String id = String(DEVICE_ID) + "-" + String(random(0xffff), HEX);
    if (mqtt.connect(id.c_str())) {
      Serial.println("✅ Connected!");
      mqtt.publish("farm/devices/status",
        ("{\"id\":\"" + String(DEVICE_ID) + "\",\"status\":\"online\",\"type\":\"field-sensors\"}").c_str(), true);
    } else {
      Serial.printf("❌ Failed rc=%d, retry 5s\n", mqtt.state());
      delay(5000);
    }
  }
}
