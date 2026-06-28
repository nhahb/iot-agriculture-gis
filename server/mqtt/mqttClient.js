const mqtt = require("mqtt");
const { findDeviceByDeviceCode } = require("../model/device.model");
const { createRealtimeData } = require("../model/deviceData.model");
const {
  findLatestNotification,
  createNotification,
} = require("../model/notification.model");

let mqttClient = null;

const EVENT_TYPES = [
  "soil_moisture_low",
  "soil_moisture_recovered",
  "pump_started",
  "pump_stopped",
  "sensor_error",
  "sensor_recovered",
];

const getEventNotificationContent = ({
  type,
  device,
  payload,
}) => {
  const deviceName =
    device.name || device.device_code;

  const configs = {
    pump_started: {
      title: "Máy bơm đã bật",
      message:
        `${deviceName} đã bật máy bơm ` +
        `(${payload.source === "manual"
          ? "thủ công"
          : "tự động"})`,
      status: "active",
      resolvedAt: null,
    },

    pump_stopped: {
      title: "Máy bơm đã tắt",
      message:
        `${deviceName} đã tắt máy bơm ` +
        `(${payload.source === "manual"
          ? "thủ công"
          : "tự động"})`,
      status: "resolved",
      resolvedAt: new Date(),
    },

    soil_moisture_low: {
      title: "Độ ẩm đất thấp",
      message:
        `Độ ẩm đất tại ${deviceName} còn ` +
        `${payload.value}%, thấp hơn ngưỡng ` +
        `${payload.threshold}%`,
      status: "active",
      resolvedAt: null,
    },

    soil_moisture_recovered: {
      title: "Độ ẩm đất đã phục hồi",
      message:
        `Độ ẩm đất tại ${deviceName} đã tăng lên ` +
        `${payload.value}%`,
      status: "resolved",
      resolvedAt: new Date(),
    },

    sensor_error: {
      title: "Lỗi cảm biến",
      message:
        `Cảm biến ${payload.value} tại ` +
        `${deviceName} đang gặp lỗi`,
      status: "active",
      resolvedAt: null,
    },

    sensor_recovered: {
      title: "Cảm biến đã phục hồi",
      message:
        `Cảm biến ${payload.value} tại ` +
        `${deviceName} đã hoạt động trở lại`,
      status: "resolved",
      resolvedAt: new Date(),
    },
  };

  return configs[type] || null;
};

const EVENT_SEVERITIES = [
  "info",
  "warning",
  "critical",
];

const EVENT_SOURCES = [
  "manual",
  "automatic",
];

const parseEventTopic = (topic) => {
  const parts = topic.split("/");

  if (
    parts.length !== 3 ||
    parts[0] !== "esp32" ||
    parts[2] !== "event"
  ) {
    return null;
  }

  const deviceCode = parts[1];

  if (!/^[a-zA-Z0-9_-]+$/.test(deviceCode)) {
    return null;
  }

  return {
    deviceCode,
  };
};

const validateEventPayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const type = String(
    payload.type || ""
  ).toLowerCase();

  const severity = String(
    payload.severity || ""
  ).toLowerCase();

  const source = String(
    payload.source || ""
  ).toLowerCase();

  if (!EVENT_TYPES.includes(type)) {
    return false;
  }

  if (!EVENT_SEVERITIES.includes(severity)) {
    return false;
  }

  if (
    source &&
    !EVENT_SOURCES.includes(source)
  ) {
    return false;
  }

  return true;
};


const parseTelemetryTopic = (topic) => {
  const parts = topic.split("/");

  if (
    parts.length !== 3 ||
    parts[0] !== "esp32" ||
    parts[2] !== "data"
  ) {
    return null;
  }

  const deviceCode = parts[1];

  if (!/^[a-zA-Z0-9_-]+$/.test(deviceCode)) {
    return null;
  }

  return {
    deviceCode,
  };
};

const parseStatusTopic = (topic) => {
  const parts = topic.split("/");

  if (
    parts.length !== 3 ||
    parts[0] !== "esp32" ||
    parts[2] !== "status"
  ) {
    return null;
  }

  const deviceCode = parts[1];

  if (!/^[a-zA-Z0-9_-]+$/.test(deviceCode)) {
    return null;
  }

  return {
    deviceCode,
  };
};

const validatePayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  if (
    typeof payload.device !== "string" ||
    payload.device.trim() === ""
  ) {
    return false;
  }

  return true;
};

const saveNotificationIfChanged = async ({
  io,
  device,
  type,
  severity,
  title,
  message,
  value,
  thresholdValue = null,
  status = "active",
  resolvedAt = null,
}) => {
  const latestNotification =
    await findLatestNotification(
      device.id,
      type
    );

  const previousValue =
    latestNotification?.value !== null &&
    latestNotification?.value !== undefined
      ? String(latestNotification.value)
      : null;

  const currentValue = String(value);

  // Không tạo thông báo trùng trạng thái
  if (previousValue === currentValue) {
    return null;
  }

  const notification = await createNotification({
    userId: device.user_id,
    fieldId: device.field_id,
    deviceId: device.id,
    type,
    severity,
    title,
    message,
    value: currentValue,
    thresholdValue,
    status,
    isRead: 0,
    resolvedAt,
  });

  io.to(`user:${device.user_id}`)
    .to(`field:${device.field_id}`)
    .emit(
      "notification:new",
      notification
    );

  console.log("Đã lưu và emit thông báo:", {
    notificationId: notification.id,
    type,
    value: currentValue,
    deviceCode: device.device_code,
  });

  return notification;
};

const handleStatusMessage = async ({
  io,
  topic,
  messageBuffer,
}) => {
  const topicInfo = parseStatusTopic(topic);

  if (!topicInfo) {
    console.warn(
      "Status topic không hợp lệ:",
      topic
    );
    return;
  }

  const rawPayload =
    messageBuffer.toString("utf8");

  const payload = JSON.parse(rawPayload);

  const deviceStatus = String(
    payload.device || ""
  ).toLowerCase();

  const pumpStatus = String(
    payload.pump || "unknown"
  ).toLowerCase();

  const threshold = Number(
    payload.threshold
  );

  const offThreshold = Number(
    payload.off_threshold
  );

  if (
    !["online", "offline"].includes(
      deviceStatus
    )
  ) {
    throw new Error(
      `Trạng thái device không hợp lệ: ${deviceStatus}`
    );
  }

  if (
    !["on", "off", "unknown"].includes(
      pumpStatus
    )
  ) {
    throw new Error(
      `Trạng thái pump không hợp lệ: ${pumpStatus}`
    );
  }

  // unit01 được lấy từ topic esp32/unit01/status
  // const device =
  //   await findDeviceByDeviceCode(
  //     topicInfo.deviceCode
  //   );

  if (!device) {
    console.warn(
      "Không tìm thấy device với device_code:",
      topicInfo.deviceCode
    );
    return;
  }

  /*
   * Lưu thông báo online/offline
   */
  // await saveNotificationIfChanged({
  //   io,
  //   device,
  //   type: "device_status",

  //   severity:
  //     deviceStatus === "offline"
  //       ? "critical"
  //       : "info",

  //   title:
  //     deviceStatus === "online"
  //       ? "Thiết bị đã kết nối"
  //       : "Thiết bị mất kết nối",

  //   message:
  //     deviceStatus === "online"
  //       ? `${device.name} đang trực tuyến`
  //       : `${device.name} đã mất kết nối`,

  //   value: deviceStatus,

  //   status:
  //     deviceStatus === "offline"
  //       ? "active"
  //       : "resolved",

  //   resolvedAt:
  //     deviceStatus === "online"
  //       ? new Date()
  //       : null,
  // });

  /*
   * Chỉ lưu thông báo bơm khi trạng thái
   * được xác định là on hoặc off.
   *
   * Khi pump = unknown thì không tạo
   * thông báo bơm sai.
   */
  if (["on", "off"].includes(pumpStatus)) {
    await saveNotificationIfChanged({
      io,
      device,
      type: "pump_status",

      severity:
        pumpStatus === "on"
          ? "warning"
          : "info",

      title:
        pumpStatus === "on"
          ? "Máy bơm đã bật"
          : "Máy bơm đã tắt",

      message:
        pumpStatus === "on"
          ? `${device.name} đã bật máy bơm`
          : `${device.name} đã tắt máy bơm`,

      value: pumpStatus,

      thresholdValue:
        Number.isFinite(threshold)
          ? threshold
          : null,

      status:
        pumpStatus === "on"
          ? "active"
          : "resolved",

      resolvedAt:
        pumpStatus === "off"
          ? new Date()
          : null,
    });
  } else {
    console.log(
      "Bỏ qua thông báo máy bơm vì trạng thái chưa xác định"
    );
  }

  const realtimeStatus = {
    deviceId: device.id,
    deviceCode: device.device_code,
    deviceName: device.name,
    fieldId: device.field_id,

    deviceStatus,
    pumpStatus,

    threshold:
      Number.isFinite(threshold)
        ? threshold
        : null,

    offThreshold:
      Number.isFinite(offThreshold)
        ? offThreshold
        : null,

    created_at: new Date().toISOString(),
  };

  io.to(`field:${device.field_id}`).emit(
    "device:status",
    realtimeStatus
  );

  console.log(
    "Đã xử lý MQTT status:",
    realtimeStatus
  );
};

const normalizeTelemetry = ({
  payload,
  unitCode,
  topic,
}) => {
  const toNumberOrNull = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  const light = toNumberOrNull(payload.light);

  return {
    // Mã sẽ liên kết với devices.device_code
    deviceCode: payload.device,

    // Lấy từ topic: unit01
    unitCode,

    temperature: toNumberOrNull(payload.temp),
    humidity: toNumberOrNull(payload.humidity),
    heatIndexC: toNumberOrNull(payload.heat_index),

    // BH1750 trả -2 thường là dữ liệu không hợp lệ
    light: light !== null && light >= 0 ? light : null,

    soilAdc: toNumberOrNull(payload.adc),
    uptimeSeconds: toNumberOrNull(payload.uptime),

    topic,
    receivedAt: new Date().toISOString(),
  };
};

const connectMqtt = (io) => {
  if (mqttClient) {
    return mqttClient;
  }

  const mqttUrl = process.env.MQTT_URL;

  if (!mqttUrl) {
    throw new Error("MQTT_URL chưa được cấu hình");
  }

  const options = {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,

    // Phải khác clientId của ESP32
    clientId: `node_server_${Math.random()
      .toString(16)
      .slice(2, 10)}`,

    clean: true,
    keepalive: 60,
    connectTimeout: 10_000,
    reconnectPeriod: 5_000,

    // HiveMQ Cloud sử dụng chứng chỉ TLS hợp lệ
    rejectUnauthorized: true,
  };

  mqttClient = mqtt.connect(mqttUrl, options);

  mqttClient.on("connect", () => {
  console.log(
    "MQTT server connected to HiveMQ Cloud"
  );

  const telemetryTopic =
    process.env.MQTT_TELEMETRY_TOPIC ||
    "esp32/+/data";

  const statusTopic =
    process.env.MQTT_STATUS_TOPIC ||
    "esp32/+/status";
    
  const eventTopic = process.env.MQTT_EVENT_TOPIC || "esp32/+/event";

  const topics = [
    telemetryTopic,
    statusTopic,
    eventTopic
  ];

  mqttClient.subscribe(
    topics,
    {
      qos: 1,
    },
    (error, granted) => {
      if (error) {
        console.error(
          "MQTT subscribe error:",
          error.message
        );
        return;
      }

      console.log(
        "MQTT subscribed topics:",
        topics
      );

      console.log(
        "Granted topics:",
        granted
      );
    }
  );
});

  mqttClient.on("message", async (topic, messageBuffer) => {
    try {

    if (topic.endsWith("/event")) {
      const topicInfo =
        parseEventTopic(topic);

      if (!topicInfo) {
        console.warn(
          "Event topic không hợp lệ:",
          topic
        );

        return;
      }

      const rawPayload =
        messageBuffer.toString("utf8");

      const payload =
        JSON.parse(rawPayload);

      if (!validateEventPayload(payload)) {
        console.warn(
          "Event payload không hợp lệ:",
          payload
        );

        return;
      }

      console.log(
        "MQTT event hợp lệ:",
        {
          deviceCode:
            topicInfo.deviceCode,

          type: payload.type,
          severity: payload.severity,
          value: payload.value ?? null,
          threshold:
            payload.threshold ?? null,
          source:
            payload.source ?? null,
        }
      );

      const device =
  await findDeviceByDeviceCode(
    topicInfo.deviceCode
  );

if (!device) {
  console.warn(
    "Không tìm thấy thiết bị:",
    topicInfo.deviceCode
  );

  return;
}

const content =
  getEventNotificationContent({
    type: payload.type,
    device,
    payload,
  });

if (!content) {
  console.warn(
    "Không có cấu hình notification:",
    payload.type
  );

  return;
}

const thresholdNumber =
  Number(payload.threshold);

const notification =
  await createNotification({
    userId: device.user_id,
    fieldId: device.field_id,
    deviceId: device.id,

    type: payload.type,
    severity: payload.severity,

    title: content.title,
    message: content.message,

    value:
      payload.value !== undefined
        ? String(payload.value)
        : null,

    thresholdValue:
      Number.isFinite(thresholdNumber)
        ? thresholdNumber
        : null,

    status: content.status,
    resolvedAt: content.resolvedAt,
  });

  io.to(`field:${device.field_id}`).emit(
  "notification:new",
  notification
);

console.log(
  "Đã lưu và emit notification:",
  {
    notificationId: notification.id,
    fieldId: device.field_id,
    event: notification.type,
  }
);

console.log(
  "Đã lưu notification:",
  notification
);

return;

      return;
    }


      if (topic.endsWith("/status")) {
  const topicInfo = parseStatusTopic(topic);

  if (!topicInfo) {
    console.warn("Status topic không hợp lệ:", topic);
    return;
  }

  const payload = JSON.parse(
    messageBuffer.toString("utf8")
  );

  const device =
    await findDeviceByDeviceCode(
      topicInfo.deviceCode
    );

  if (!device) {
    console.warn(
      "Không tìm thấy device:",
      topicInfo.deviceCode
    );
    return;
  }

  const statusData = {
    deviceId: device.id,
    deviceCode: device.device_code,
    fieldId: device.field_id,

    deviceStatus:
      payload.device || "offline",

    pumpStatus:
      payload.pump || "unknown",

    threshold:
      payload.threshold ?? null,

    offThreshold:
      payload.off_threshold ?? null,

    created_at:
      new Date().toISOString(),
  };

  io.to(`field:${device.field_id}`).emit(
    "device:status",
    statusData
  );

  console.log(
    "Đã emit device:status:",
    statusData
  );

  return;
}

      if (!topic.endsWith("/data")) {
        console.warn(
          "Topic chưa được hỗ trợ:",
          topic
        );

        return;
      }

      const topicInfo = parseTelemetryTopic(topic);

      if (!topicInfo) {
        console.warn("Topic không hợp lệ:", topic);
        return;
      }

      const { deviceCode } = topicInfo;

      const message = messageBuffer.toString("utf8");
      const payload = JSON.parse(message);

      const device = await findDeviceByDeviceCode(deviceCode);

      if (!device) {
        console.warn(
          "Không tìm thấy device với device_code:",
          deviceCode
        );
        return;
      }

      if (!validatePayload(payload)) {
        console.warn(
          "Payload không có device hợp lệ:",
          payload
        );
        return;
      }

      const telemetry = {
        deviceId: device.id,
        deviceCode: device.device_code,

        fieldId: device.field_id,
        userId: device.user_id,

        deviceName: device.name,
        location: device.location,

        temperature: Number(payload.temp),
        humidity: Number(payload.humidity),
        heatIndexC: Number(payload.heat_index),
        soilAdc: Number(payload.adc),

        created_at: new Date().toISOString(),
      };

      // Gửi dữ liệu telemetry đến cơ sở dữ liệu
      const result = await createRealtimeData(telemetry);

      const realtimeData = {
        id: result.insertId,
        deviceId: telemetry.deviceId,
        deviceCode: telemetry.deviceCode,
        deviceName: telemetry.deviceName,
        fieldId: telemetry.fieldId,
        location: telemetry.location,
        temperature: telemetry.temperature,
        humidity: telemetry.humidity,
        heatIndexC: telemetry.heatIndexC,
        soilAdc: telemetry.soilAdc,
        created_at: telemetry.receivedAt,
      };
      io.to(`field:${telemetry.fieldId}`).emit(
        "sensor:update",
        realtimeData
      );
      console.log(
        "Đã lưu và emit dữ liệu",
        {
            recordId: result.insertId,
            deviceCode: telemetry.deviceCode,
            room: `field:${telemetry.fieldId}`,
        }
      );

    } catch (error) {
      console.error(
        "Không xử lý được MQTT message:",
        error.message
      );

      console.error(
        "Payload gốc:",
        messageBuffer.toString("utf8")
      );
    }
  });

  mqttClient.on("reconnect", () => {
    console.log("MQTT đang kết nối lại...");
  });

  mqttClient.on("offline", () => {
    console.log("MQTT client đang offline");
  });

  mqttClient.on("close", () => {
    console.log("Kết nối MQTT đã đóng");
  });

  mqttClient.on("error", (error) => {
    console.error(
      "MQTT connection error:",
      error.message
    );
  });

  return mqttClient;
};

const getMqttClient = () => mqttClient;

const publishPumpCommand = (pump) => {
  return new Promise((resolve, reject) => {
    const topic = "esp32/unit01/cmd";

    if (!["on", "off"].includes(pump)) {
      reject(
        new Error(
          'Lệnh máy bơm phải là "on" hoặc "off"'
        )
      );
      return;
    }

    if (!mqttClient) {
      reject(
        new Error(
          "MQTT client chưa được khởi tạo"
        )
      );
      return;
    }

    if (!mqttClient.connected) {
      reject(
        new Error(
          "MQTT client chưa kết nối broker"
        )
      );
      return;
    }

    const payload = JSON.stringify({
      pump,
    });

    console.log("MQTT publish requested:", {
      connected: mqttClient.connected,
      topic,
      payload,
    });

    mqttClient.publish(
      topic,
      payload,
      {
        qos: 1,
        retain: false,
      },
      (error) => {
        if (error) {
          console.error(
            "MQTT publish error:",
            error.message
          );

          reject(error);
          return;
        }

        console.log(
          `MQTT published: ${topic} ${payload}`
        );

        resolve({
          topic,
          payload,
        });
      }
    );
  });
};


module.exports = {
  connectMqtt,
  getMqttClient,
  publishPumpCommand
};