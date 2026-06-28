const pool = require("./db");

const findActiveIrrigationNotification = async (
  deviceId,
) => {
  const [rows] = await pool.execute(
    `
      SELECT *
      FROM notifications
      WHERE device_id = ?
        AND type = 'irrigation_required'
        AND status = 'active'
      LIMIT 1
    `,
    [deviceId],
  );

  return rows[0] || null;
};

const createIrrigationNotification = async ({
  userId,
  fieldId,
  deviceId,
  deviceName,
  soilMoisture,
  threshold,
}) => {
  const title = "Thiết bị cần tưới nước";

  const message =
    `Độ ẩm đất tại ${deviceName} là ` +
    `${soilMoisture}%, thấp hơn ngưỡng ${threshold}%.`;

  const [result] = await pool.execute(
    `
      INSERT INTO notifications (
        user_id,
        field_id,
        device_id,
        type,
        severity,
        title,
        message,
        value,
        threshold_value,
        status,
        is_read
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', false)
    `,
    [
      userId,
      fieldId,
      deviceId,
      "irrigation_required",
      "warning",
      title,
      message,
      soilMoisture,
      threshold,
    ],
  );

  return {
    id: result.insertId,
    user_id: userId,
    field_id: fieldId,
    device_id: deviceId,
    type: "irrigation_required",
    severity: "warning",
    title,
    message,
    value: soilMoisture,
    threshold_value: threshold,
    status: "active",
    is_read: false,
    created_at: new Date().toISOString(),
  };
};

const resolveIrrigationNotification = async (
  notificationId,
) => {
  await pool.execute(
    `
      UPDATE notifications
      SET
        status = 'resolved',
        resolved_at = NOW()
      WHERE id = ?
    `,
    [notificationId],
  );
};

module.exports = {
  findActiveIrrigationNotification,
  createIrrigationNotification,
  resolveIrrigationNotification,
};