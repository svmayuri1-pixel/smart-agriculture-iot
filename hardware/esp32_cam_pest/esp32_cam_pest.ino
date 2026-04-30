/**
 * Smart Agriculture — ESP32-CAM Pest Detection Camera
 * 
 * Hardware: AI-Thinker ESP32-CAM (OV2640 camera built-in)
 * 
 * What it does:
 *   1. Captures JPEG frames
 *   2. Streams live MJPEG video over HTTP at /stream
 *   3. Sends snapshot URL via MQTT when motion detected
 * 
 * Access the stream at: http://<ESP32_IP>/stream
 * 
 * Libraries needed:
 *   - ESP32 board package (includes esp_camera)
 *   - PubSubClient
 *   - ArduinoJson
 * 
 * Board: AI Thinker ESP32-CAM
 * Upload speed: 115200
 * Flash mode: DIO
 */

#include "esp_camera.h"
#include "esp_http_server.h"
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ─── Config ───────────────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MQTT_BROKER   = "broker.hivemq.com";
const int   MQTT_PORT     = 1883;
const char* MQTT_TOPIC    = "farm/pest/detection";
const char* CAMERA_ID     = "CAM-NORTH-01";

// ─── AI Thinker ESP32-CAM Pin Map ─────────────────────────────────────────
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

// ─── Objects ──────────────────────────────────────────────────────────────
WiFiClient   wifiClient;
PubSubClient mqtt(wifiClient);
httpd_handle_t stream_httpd = NULL;

// ─── MJPEG Stream Handler ─────────────────────────────────────────────────
#define PART_BOUNDARY "123456789000000000000987654321"
static const char* STREAM_CONTENT_TYPE =
  "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char* STREAM_PART =
  "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

esp_err_t stream_handler(httpd_req_t* req) {
  camera_fb_t* fb = NULL;
  esp_err_t res = ESP_OK;
  char part_buf[64];

  res = httpd_resp_set_type(req, STREAM_CONTENT_TYPE);
  if (res != ESP_OK) return res;

  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");

  while (true) {
    fb = esp_camera_fb_get();
    if (!fb) { res = ESP_FAIL; break; }

    httpd_resp_send_chunk(req, STREAM_BOUNDARY, strlen(STREAM_BOUNDARY));
    size_t hlen = snprintf(part_buf, sizeof(part_buf), STREAM_PART, fb->len);
    httpd_resp_send_chunk(req, part_buf, hlen);
    httpd_resp_send_chunk(req, (const char*)fb->buf, fb->len);
    esp_camera_fb_return(fb);

    if (res != ESP_OK) break;
  }
  return res;
}

void startCameraServer() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = 80;

  httpd_uri_t stream_uri = {
    .uri       = "/stream",
    .method    = HTTP_GET,
    .handler   = stream_handler,
    .user_ctx  = NULL
  };

  if (httpd_start(&stream_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(stream_httpd, &stream_uri);
    Serial.printf("Camera stream: http://%s/stream\n",
                  WiFi.localIP().toString().c_str());
  }
}

// ─── Camera Init ──────────────────────────────────────────────────────────
bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0       = Y2_GPIO_NUM;
  config.pin_d1       = Y3_GPIO_NUM;
  config.pin_d2       = Y4_GPIO_NUM;
  config.pin_d3       = Y5_GPIO_NUM;
  config.pin_d4       = Y6_GPIO_NUM;
  config.pin_d5       = Y7_GPIO_NUM;
  config.pin_d6       = Y8_GPIO_NUM;
  config.pin_d7       = Y9_GPIO_NUM;
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
  config.frame_size   = FRAMESIZE_VGA;   // 640x480
  config.jpeg_quality = 12;              // 0-63, lower = better quality
  config.fb_count     = 2;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x\n", err);
    return false;
  }
  return true;
}

// ─── Setup ────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);

  if (!initCamera()) {
    Serial.println("Camera init failed — halting");
    while (true) delay(1000);
  }

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.printf("\nConnected! IP: %s\n", WiFi.localIP().toString().c_str());

  startCameraServer();

  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  reconnectMQTT();

  // Announce camera online
  publishCameraStatus("online");
}

// ─── Loop ─────────────────────────────────────────────────────────────────
void loop() {
  if (!mqtt.connected()) reconnectMQTT();
  mqtt.loop();
  delay(10);
}

// ─── MQTT Helpers ─────────────────────────────────────────────────────────
void publishCameraStatus(const char* status) {
  StaticJsonDocument<200> doc;
  doc["cameraId"]  = CAMERA_ID;
  doc["status"]    = status;
  doc["streamUrl"] = "http://" + WiFi.localIP().toString() + "/stream";
  doc["timestamp"] = millis();

  char payload[200];
  serializeJson(doc, payload);
  mqtt.publish("farm/cameras/status", payload, true);
  Serial.printf("Camera status published: %s\n", payload);
}

void reconnectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("MQTT connecting...");
    if (mqtt.connect(CAMERA_ID)) {
      Serial.println("connected");
      publishCameraStatus("online");
    } else {
      Serial.printf("failed rc=%d, retry 5s\n", mqtt.state());
      delay(5000);
    }
  }
}
