/**
 * ═══════════════════════════════════════════════════
 *   Smart Agriculture — ESP32-CAM Live Stream
 * ═══════════════════════════════════════════════════
 * 
 * BOARD: AI Thinker ESP32-CAM
 * 
 * UPLOAD WIRING (FTDI or ESP32 DevKit):
 *   ESP32-CAM GND  → FTDI GND
 *   ESP32-CAM 5V   → FTDI VCC (5V)
 *   ESP32-CAM U0R  → FTDI TX
 *   ESP32-CAM U0T  → FTDI RX
 *   ESP32-CAM IO0  → GND  ← Upload mode (remove after upload!)
 * 
 * ARDUINO IDE SETTINGS:
 *   Board: AI Thinker ESP32-CAM
 *   Upload Speed: 115200
 *   Flash Mode: DIO
 *   Partition Scheme: Huge APP (3MB No OTA)
 * 
 * UPLOAD STEPS:
 *   1. IO0 → GND connect பண்ணுங்க
 *   2. Upload click பண்ணுங்க
 *   3. "Connecting..._____" வந்தா RESET button press
 *   4. Upload success ஆனதுக்கு அப்புறம் IO0 disconnect
 *   5. RESET button press
 *   6. Serial Monitor-ல IP address வரும்
 *   7. Browser-ல http://IP/stream → Live video!
 * 
 * LIBRARIES NEEDED:
 *   ✅ PubSubClient  by Nick O'Leary
 *   ✅ ArduinoJson   by Benoit Blanchon
 * ═══════════════════════════════════════════════════
 */

#include "esp_camera.h"
#include "esp_http_server.h"
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ╔══════════════════════════════════════╗
// ║   ⚙️  இங்க மட்டும் மாத்துங்க        ║
// ╚══════════════════════════════════════╝
const char* WIFI_SSID     = "உங்க_WiFi_பேர்";
const char* WIFI_PASSWORD = "உங்க_WiFi_Password";
const char* MQTT_BROKER   = "broker.hivemq.com";
const char* CAMERA_ID     = "CAM-FIELD-01";
const char* CAMERA_LABEL  = "Field Camera";

// ╔══════════════════════════════════════╗
// ║   AI Thinker ESP32-CAM Pin Map       ║
// ╚══════════════════════════════════════╝
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ╔══════════════════════════════════════╗
// ║   OBJECTS                            ║
// ╚══════════════════════════════════════╝
WiFiClient      wifiClient;
PubSubClient    mqtt(wifiClient);
httpd_handle_t  stream_httpd = NULL;

// ════════════════════════════════════════
//  MJPEG STREAM HANDLER
// ════════════════════════════════════════
#define BOUNDARY "smartfarm"
static const char* STREAM_TYPE =
  "multipart/x-mixed-replace;boundary=" BOUNDARY;
static const char* STREAM_BOUNDARY = "\r\n--" BOUNDARY "\r\n";
static const char* STREAM_PART =
  "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

esp_err_t stream_handler(httpd_req_t* req) {
  camera_fb_t* fb = NULL;
  char part_buf[64];

  httpd_resp_set_type(req, STREAM_TYPE);
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_set_hdr(req, "Cache-Control", "no-cache");

  Serial.println("📹 Client connected to stream");

  while (true) {
    fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("⚠️ Camera capture failed");
      break;
    }
    httpd_resp_send_chunk(req, STREAM_BOUNDARY, strlen(STREAM_BOUNDARY));
    size_t hlen = snprintf(part_buf, sizeof(part_buf), STREAM_PART, fb->len);
    httpd_resp_send_chunk(req, part_buf, hlen);
    httpd_resp_send_chunk(req, (const char*)fb->buf, fb->len);
    esp_camera_fb_return(fb);
  }
  return ESP_OK;
}

// Snapshot handler
esp_err_t snapshot_handler(httpd_req_t* req) {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) { httpd_resp_send_500(req); return ESP_FAIL; }
  httpd_resp_set_type(req, "image/jpeg");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_send(req, (const char*)fb->buf, fb->len);
  esp_camera_fb_return(fb);
  return ESP_OK;
}

// ════════════════════════════════════════
//  START HTTP SERVER
// ════════════════════════════════════════
void startCameraServer() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = 80;

  httpd_uri_t stream_uri   = { "/stream",   HTTP_GET, stream_handler,   NULL };
  httpd_uri_t snapshot_uri = { "/snapshot", HTTP_GET, snapshot_handler, NULL };

  if (httpd_start(&stream_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(stream_httpd, &stream_uri);
    httpd_register_uri_handler(stream_httpd, &snapshot_uri);
  }
}

// ════════════════════════════════════════
//  CAMERA INIT
// ════════════════════════════════════════
bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM; config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM; config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM; config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM; config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size   = FRAMESIZE_VGA;  // 640x480
  config.jpeg_quality = 12;
  config.fb_count     = 2;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("❌ Camera init failed: 0x%x\n", err);
    return false;
  }

  // Image quality settings
  sensor_t* s = esp_camera_sensor_get();
  s->set_brightness(s, 0);
  s->set_contrast(s, 0);
  s->set_saturation(s, 0);
  s->set_whitebal(s, 1);
  s->set_awb_gain(s, 1);
  s->set_exposure_ctrl(s, 1);

  return true;
}

// ════════════════════════════════════════
//  SETUP
// ════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  Serial.println("\n📷 ESP32-CAM Starting...");

  // Init camera
  if (!initCamera()) {
    Serial.println("❌ Camera failed! Check connections & board settings");
    while (true) delay(1000);
  }
  Serial.println("✅ Camera Ready!");

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("📶 Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.printf("\n✅ WiFi Connected! IP: %s\n",
                WiFi.localIP().toString().c_str());

  // Start stream server
  startCameraServer();

  Serial.println("═══════════════════════════════");
  Serial.printf("📹 Stream  : http://%s/stream\n",
                WiFi.localIP().toString().c_str());
  Serial.printf("📸 Snapshot: http://%s/snapshot\n",
                WiFi.localIP().toString().c_str());
  Serial.println("═══════════════════════════════");

  // MQTT
  mqtt.setServer(MQTT_BROKER, 1883);
  connectMQTT();
}

// ════════════════════════════════════════
//  LOOP
// ════════════════════════════════════════
void loop() {
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();
  delay(10);
}

// ════════════════════════════════════════
//  MQTT — Announce camera to dashboard
// ════════════════════════════════════════
void connectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("📡 MQTT Connecting...");
    if (mqtt.connect(CAMERA_ID)) {
      Serial.println("✅ Connected!");

      // Tell dashboard: camera is online + stream URL
      StaticJsonDocument<256> doc;
      doc["cameraId"]    = CAMERA_ID;
      doc["label"]       = CAMERA_LABEL;
      doc["status"]      = "online";
      doc["streamUrl"]   = "http://" + WiFi.localIP().toString() + "/stream";
      doc["snapshotUrl"] = "http://" + WiFi.localIP().toString() + "/snapshot";

      char payload[256];
      serializeJson(doc, payload);
      mqtt.publish("farm/cameras/status", payload, true);

      Serial.println("📢 Camera announced to dashboard!");
      Serial.printf("🌐 Stream URL: http://%s/stream\n",
                    WiFi.localIP().toString().c_str());
    } else {
      Serial.printf("❌ Failed rc=%d, retry 5s\n", mqtt.state());
      delay(5000);
    }
  }
}
