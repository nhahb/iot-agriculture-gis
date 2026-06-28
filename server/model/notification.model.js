const pool = require("./db");

const findLatestNotification = async (
  deviceId,
  type
) => {
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        device_id,
        type,
        value,
        status,
        created_at
      FROM notifications
      WHERE device_id = ?
        AND type = ?
      ORDER BY id DESC
      LIMIT 1
    `,
    [deviceId, type]
  );

  return rows[0] || null;
};

const createNotification = async ({
  userId,
  fieldId,
  deviceId,
  type,
  severity,
  title,
  message,
  value = null,
  thresholdValue = null,
  status = "active",
  resolvedAt = null,
}) => {
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
        is_read,
        created_at,
        resolved_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), ?)
    `,
    [
      userId,
      fieldId,
      deviceId,
      type,
      severity,
      title,
      message,
      value,
      thresholdValue,
      status,
      resolvedAt,
    ]
  );

  return {
    id: result.insertId,
    userId,
    fieldId,
    deviceId,
    type,
    severity,
    title,
    message,
    value,
    thresholdValue,
    status,
    isRead: 0,
    createdAt: new Date().toISOString(),
    resolvedAt,
  };
};


const findNotificationsByUserId = async (
  userId
) => {
  const [rows] = await pool.execute(
    `
      SELECT
        n.id,
        n.user_id,
        n.field_id,
        n.device_id,
        n.type,
        n.severity,
        n.title,
        n.message,
        n.value,
        n.threshold_value,
        n.status,
        n.is_read,
        n.created_at,
        n.resolved_at,
        d.name AS device_name,
        f.name AS field_name
      FROM notifications n
      LEFT JOIN devices d
        ON d.id = n.device_id
      LEFT JOIN fields f
        ON f.id = n.field_id
      WHERE n.user_id = ?
      ORDER BY
        n.is_read ASC,
        n.created_at DESC
      LIMIT 200
    `,
    [userId]
  );

  return rows;
};

const markNotificationAsRead = async ({
  notificationId,
  userId,
}) => {
  const [result] = await pool.execute(
    `
      UPDATE notifications
      SET is_read = 1
      WHERE id = ?
        AND user_id = ?
    `,
    [notificationId, userId]
  );

  return result.affectedRows > 0;
};

const markAllNotificationsAsRead = async (
  userId
) => {
  const [result] = await pool.execute(
    `
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ?
        AND is_read = 0
    `,
    [userId]
  );

  return result.affectedRows;
};

module.exports = {
  findLatestNotification,
  createNotification,
  findNotificationsByUserId,
  markAllNotificationsAsRead
};