
#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>
#include "DHT.h"
#include "../secrets.h"

// ================== CONFIG ==================
const char* mqtt_server =
    "c696e02ee3fa4f93a1a9ff93f68656d6.s1.eu.hivemq.cloud";

const int mqtt_port = 8883;

const char* mqtt_user = "Hoangbanha";
const char* mqtt_pass = "Hoangbanha1";

const char* device_id = "ESP32_Pro_Unit_01";

const char* topic_telemetry = "esp32/unit01/data";
const char* topic_command = "esp32/unit01/cmd";
const char* topic_status = "esp32/unit01/status";

// ================== PIN ==================
#define DHTPIN 4
#define DHTTYPE DHT11
#define AOUT_PIN 36

// ================== OBJECT ==================
WiFiClientSecure espClient;
PubSubClient client(espClient);

DHT dht(DHTPIN, DHTTYPE);

// ================== STATE ==================
unsigned long lastSensorTime = 0;
unsigned long lastPublishTime = 0;
unsigned long lastReconnectAttempt = 0;

// Đọc cảm biến mỗi 10 giây
const unsigned long sensorInterval = 10000;

// Gửi dữ liệu MQTT mỗi 30 giây
const unsigned long publishInterval = 30000;

// Thử kết nối lại MQTT mỗi 5 giây nếu mất kết nối
const unsigned long reconnectInterval = 5000;

// Dữ liệu cảm biến gần nhất
float temp = NAN;
float humidity = NAN;
float heatIndex = NAN;

int adcValue = 0;

// ================== WIFI ==================
void handleWiFi() {
    if (WiFi.status() == WL_CONNECTED) {
        return;
    }

    static bool connecting = false;

    if (!connecting) {
        Serial.println("Connecting WiFi...");

        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        connecting = true;
    }

    if (
        WiFi.status() == WL_CONNECT_FAILED ||
        WiFi.status() == WL_NO_SSID_AVAIL
    ) {
        connecting = false;
    }
}

// ================== MQTT CALLBACK ==================
void callback(
    char* topic,
    byte* payload,
    unsigned int length
) {
    String message;

    for (unsigned int i = 0; i < length; i++) {
        message += static_cast<char>(payload[i]);
    }

    Serial.print("Topic: ");
    Serial.println(topic);

    Serial.print("CMD: ");
    Serial.println(message);

    // TODO: Phân tích JSON để điều khiển relay hoặc máy bơm
}

// ================== MQTT ==================
void handleMQTT() {
    if (WiFi.status() != WL_CONNECTED) {
        return;
    }

    if (!client.connected()) {
        unsigned long now = millis();

        if (
            now - lastReconnectAttempt <
            reconnectInterval
        ) {
            return;
        }

        lastReconnectAttempt = now;

        Serial.println("Connecting MQTT...");

        bool connected = client.connect(
            device_id,
            MQTT_USER,
            MQTT_PASS,
            topic_status,
            0,
            true,
            "Offline"
        );

        if (connected) {
            Serial.println("MQTT connected");

            client.publish(
                topic_status,
                "Online",
                true
            );

            client.subscribe(topic_command);
        } else {
            Serial.print(
                "MQTT connection failed, state: "
            );

            Serial.println(client.state());
        }

        return;
    }

    // Phải được gọi liên tục để duy trì MQTT
    // và nhận lệnh từ broker
    client.loop();
}

// ================== SENSOR ==================
void handleSensor() {
    unsigned long now = millis();

    // Chưa đủ 10 giây thì không đọc cảm biến
    if (now - lastSensorTime < sensorInterval) {
        return;
    }

    lastSensorTime = now;

    float newHumidity = dht.readHumidity();
    float newTemp = dht.readTemperature();

    if (isnan(newHumidity) || isnan(newTemp)) {
        Serial.println("DHT error");
        return;
    }

    humidity = newHumidity;
    temp = newTemp;

    heatIndex = dht.computeHeatIndex(
        temp,
        humidity,
        false
    );

    adcValue = analogRead(AOUT_PIN);

    Serial.println("========================");
    Serial.println("Sensor updated");

    Serial.print("Temperature: ");
    Serial.print(temp);
    Serial.println(" °C");

    Serial.print("Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");

    Serial.print("Heat index: ");
    Serial.print(heatIndex);
    Serial.println(" °C");

    Serial.print("Soil ADC: ");
    Serial.println(adcValue);
}

// ================== MQTT PUBLISH ==================
void handlePublish() {
    if (!client.connected()) {
        return;
    }

    // Không gửi nếu chưa đọc được dữ liệu hợp lệ
    if (isnan(temp) || isnan(humidity)) {
        return;
    }

    unsigned long now = millis();

    // Chưa đủ 30 giây thì chưa gửi
    if (now - lastPublishTime < publishInterval) {
        return;
    }

    lastPublishTime = now;

    JsonDocument doc;

    doc["device"] = device_id;
    doc["temp"] = temp;
    doc["humidity"] = humidity;
    doc["heat_index"] = heatIndex;
    doc["adc"] = adcValue;
    doc["uptime"] = millis() / 1000;

    char buffer[256];

    size_t jsonSize = serializeJson(
        doc,
        buffer,
        sizeof(buffer)
    );

    if (jsonSize == 0) {
        Serial.println("JSON serialization failed");
        return;
    }

    bool published = client.publish(
        topic_telemetry,
        buffer
    );

    if (published) {
        Serial.println("------------------------");
        Serial.println("Published MQTT:");
        Serial.println(buffer);
    } else {
        Serial.println("MQTT publish failed");
    }
}

// ================== SETUP ==================
void setup() {
    Serial.begin(9600);

    WiFi.mode(WIFI_STA);

    espClient.setInsecure();

    client.setServer(
        mqtt_server,
        mqtt_port
    );

    client.setCallback(callback);

    dht.begin();

    analogSetPinAttenuation(
        AOUT_PIN,
        ADC_11db
    );
}

// ================== LOOP ==================
void loop() {
    handleWiFi();
    handleMQTT();
    handleSensor();
    handlePublish();
}
