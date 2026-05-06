/**
 * ═══════════════════════════════════════════════════
 *   Smart Agriculture — ESP32 #2 GPS Tracker
 * ═══════════════════════════════════════════════════
 * 
 * SENSOR CONNECTED:
 *   NEO-6M GPS Module
 *   GPS VCC  → ESP32 5V (Vin)
 *   GPS GND  → ESP32 GND
 *   GPS TX   → ESP32 GPIO 16
 *   GPS RX   → ESP32 GPIO 17
 * 
 * LIBRARIES NEEDED:
 *   ✅ PubSubClient  by Nick O'Leary
 *   ✅ ArduinoJson   by Benoit Blanchon
 *   ✅ TinyGPS++     by Mikal Hart
 * 
 * BOARD SETTINGS:
 *   Board: ESP32 Dev Module
 *   Upload Speed: 115200
 * 
 * ⚠️ GPS FIX: Outdoor-ல வையுங்க — 2-5 mins ஆகும்
 * ═══════════════════════════════════════════════════
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>

// ╔══════════════════════════════════════╗
// ║   ⚙️  இங்க மட்டும் மாத்துங்க        ║
// ╚══════════════════════════════════════╝
const char* WIFI_SSID     = "உங்க_WiFi_பேர்";
const char* WIFI_PASSWORD = "உங்க_WiFi_Password";
const char* MQTT_BROKER   = "broker.hivemq.com";
const int   MQTT_PORT     = 1883;

// Vehicle or Livestock — உங்களுக்கு எது வேணும்னு set பண்ணுங்க
const char* DEVICE_ID     = "TRACTOR-01";   // Vehicle ID
const char* DEVICE_NAME   = "John Deere";   // Vehicle Name
const char* MQTT_TOPIC    = "farm/vehicles/TRACTOR-01"; // Topic

// ╔══════════════════════════════════════╗
// ║   📍 GPS PINS                        ║
// ╚══════════════════════════════════════╝
#define GPS_RX_PIN  16
#define GPS_TX_PIN  17
#define GPS_BAUD    9600

// ╔══════════════════════════════════════╗
// ║   🕐 TIMING                          ║
// ╚══════════════════════════════════════╝
const unsigned long PUBLISH_INTERVAL = 15000; // 15 seconds

// ╔══════════════════════════════════════╗
// ║   OBJECTS                            ║
// ╚══════════════════════════════════════╝
WiFiClient    wifiClient;
PubSubClient  mqtt(wifiClient);
TinyGPSPlus   gps;
HardwareSerial gpsSerial(2); // UART2

unsigned long lastPublish = 0;
double lastLat = 0, lastLng = 0;

// ════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  Serial.println("\n📍 ESP32 GPS Tracker Starting...");

  // GPS Serial
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println("✅ GPS Serial Ready");
  Serial.println("⏳ Waiting for GPS fix (go outdoor)...");

  // WiFi
  connectWiFi();

  // MQTT
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setBufferSize(512);
  connectMQTT();

  Serial.println("✅ GPS Tracker Ready!\n");
}

// ════════════════════════════════════════
void loop() {
  // Feed GPS data continuously — very important!
  while (gpsSerial.available()) {
    char c = gpsSerial.read();
    gps.encode(c);
  }

  // MQTT keep alive
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();

  unsigned long now = millis();

  // Publish every 15 seconds
  if (now - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = now;
    publishGPS();
  }
}

// ════════════════════════════════════════
//  📍 GPS DATA
//  Topic: farm/vehicles/TRACTOR-01
// ════════════════════════════════════════
void publishGPS() {
  StaticJsonDocument<256> doc;
  doc["id"]   = DEVICE_ID;
  doc["name"] = DEVICE_NAME;

  if (gps.location.isValid() && gps.location.age() < 5000) {
    // ✅ Real GPS data
    double lat   = gps.location.lat();
    double lng   = gps.location.lng();
    float  speed = gps.speed.kmph();

    doc["lat"]      = lat;
    doc["lng"]      = lng;
    doc["speed"]    = round(speed * 10) / 10.0;
    doc["gpsValid"] = true;
    doc["status"]   = speed > 1.0 ? "Active" : "Parked";
    doc["fuel"]     = 85; // Replace with fuel sensor if available

    lastLat = lat;
    lastLng = lng;

    Serial.println("─────────────────────────────");
    Serial.printf("📍 LAT  : %.6f\n", lat);
    Serial.printf("📍 LNG  : %.6f\n", lng);
    Serial.printf("⚡ Speed: %.1f km/h\n", speed);
    Serial.printf("🛰️ Sats : %d\n", gps.satellites.value());

  } else {
    // ⏳ No GPS fix yet — send last known position
    doc["lat"]      = lastLat;
    doc["lng"]      = lastLng;
    doc["speed"]    = 0;
    doc["gpsValid"] = false;
    doc["status"]   = "Parked";
    doc["fuel"]     = 85;

    Serial.printf("⏳ GPS fix pending... Chars: %d Failed: %d\n",
                  gps.charsProcessed(), gps.failedChecksum());
  }

  doc["timestamp"] = millis();

  char payload[256];
  serializeJson(doc, payload);

  if (mqtt.publish(MQTT_TOPIC, payload, true)) {
    Serial.println("✅ GPS Published to MQTT");
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
    Serial.printf("\n✅ WiFi Connected! IP: %s\n",
                  WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n❌ WiFi Failed!");
  }
}

void connectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("📡 MQTT Connecting...");
    String id = String(DEVICE_ID) + "-" + String(random(0xffff), HEX);
    if (mqtt.connect(id.c_str())) {
      Serial.println("✅ Connected!");
    } else {
      Serial.printf("❌ Failed rc=%d, retry 5s\n", mqtt.state());
      delay(5000);
    }
  }
}
