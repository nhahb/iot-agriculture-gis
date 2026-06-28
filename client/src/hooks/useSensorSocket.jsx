
import { useEffect } from "react";
import { toast } from "sonner";

import socket from "@/api/socket";

const useSensorSocket = ({
  fieldId,
  setDevices,
  setNotifications,
}) => {
  useEffect(() => {
    if (!fieldId) return;

    const roomFieldId = Number(fieldId);

    if (
      !Number.isInteger(roomFieldId) ||
      roomFieldId <= 0
    ) {
      return;
    }

    const joinFieldRoom = () => {
      console.log(
        `Joining Socket.IO room field:${roomFieldId}`
      );

      socket.emit(
        "field:join",
        roomFieldId
      );
    };

    const handleSensorUpdate = (
      sensorData
    ) => {
      console.log(
        "Received sensor:update:",
        sensorData
      );

      if (
        Number(sensorData.fieldId) !==
        roomFieldId
      ) {
        return;
      }

      setDevices((currentDevices) =>
        currentDevices.map((device) => {
          if (
            Number(device.id) !==
            Number(sensorData.deviceId)
          ) {
            return device;
          }

          return {
            ...device,

            status: "online",

            latestData: {
              ...device.latestData,

              temperature:
                sensorData.temperature,

              humidity:
                sensorData.humidity,

              heatIndexC:
                sensorData.heatIndexC,

              soilAdc:
                sensorData.soilAdc,

              created_at:
                sensorData.created_at,
            },
          };
        })
      );
    };

    const handleDeviceStatus = (statusData) => {
  console.log(
    "Received device:status:",
    statusData
  );

  if (
    Number(statusData.fieldId) !==
    roomFieldId
  ) {
    return;
  }

  setDevices((currentDevices) =>
    currentDevices.map((device) => {
      if (
        Number(device.id) !==
        Number(statusData.deviceId)
      ) {
        return device;
      }

      return {
        ...device,

        status:
          statusData.deviceStatus ||
          device.status,

        pumpStatus:
          statusData.pumpStatus,

        latestData: {
          ...device.latestData,

          pumpStatus:
            statusData.pumpStatus,

          threshold:
            statusData.threshold,

          offThreshold:
            statusData.offThreshold,
        },
      };
    })
  );
};

    const handleNotification = (
      notification
    ) => {
      console.log(
        "Received notification:new:",
        notification
      );

      /*
       * Hỗ trợ cả fieldId và field_id
       * tùy dữ liệu server trả về.
       */
      const notificationFieldId = Number(
        notification.fieldId ??
          notification.field_id
      );

      if (
        notificationFieldId !==
        roomFieldId
      ) {
        return;
      }

      /*
       * Cập nhật danh sách thông báo
       * nếu component cha truyền setNotifications.
       */
      if (
        typeof setNotifications ===
        "function"
      ) {
        setNotifications(
          (currentNotifications) => [
            notification,
            ...currentNotifications,
          ]
        );
      }

      const message =
        notification.message ||
        notification.title ||
        "Có thông báo mới";

      switch (notification.severity) {
        case "critical":
          toast.error(message);
          break;

        case "warning":
          toast.warning(message);
          break;

        default:
          toast.info(message);
          break;
      }
    };

    const handleConnect = () => {
      console.log(
        "Socket connected:",
        socket.id
      );

      joinFieldRoom();
    };

    const handleDisconnect = (
      reason
    ) => {
      console.log(
        "Socket disconnected:",
        reason
      );
    };

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "sensor:update",
      handleSensorUpdate
    );

      socket.on(
      "device:status",
      handleDeviceStatus
    );

    socket.on(
      "notification:new",
      handleNotification
    );

    if (!socket.connected) {
      socket.connect();
    } else {
      joinFieldRoom();
    }

    return () => {
      socket.emit(
        "field:leave",
        roomFieldId
      );

      socket.off(
        "sensor:update",
        handleSensorUpdate
      );

      socket.off(
  "device:status",
  handleDeviceStatus
);

      socket.off(
        "notification:new",
        handleNotification
      );

      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );
    };
  }, [
    fieldId,
    setDevices,
    setNotifications,
  ]);
};

export default useSensorSocket;
