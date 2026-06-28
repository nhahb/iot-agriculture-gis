const pool = require('./db');

const findDeviceByFieldId = async (fieldId) =>{
    const [rows] = await pool.execute(
        `
        SELECT id, name, threshold, status, ST_AsGeoJSON(location) AS geometry
        FROM devices
        WHERE field_id = ?
        `,
        [fieldId]
    );
    return rows;
};

const createDevice = async (fieldId, name, threshold, status, geometry) => {
    const [result] = await pool.execute(
        `
        INSERT INTO devices(field_id, name, threshold, status, location)
        VALUES(?, ?, ?, ?, ST_GeomFromGeoJSON(?))
        `,
        [fieldId, name, threshold, status, JSON.stringify(geometry)]
    );
    return result;
};

const updateDevice = async (idDevice, Data) => {
    const [result] = await pool.execute(
        `
        UPDATE devices
        SET name = ?,
            threshold = ?, status = ?, location = ST_GeomFromGeoJSON(?)
        WHERE id = ?
        `,
        [Data.name, Data.threshold, Data.status, JSON.stringify(Data.geometry), idDevice]
    );
    return result;
};

const deleteDevice = async (idDevice) => {
    const [result] = await pool.execute(
        `
        DELETE FROM devices
        WHERE id = ?
        `,
        [idDevice]
    );
    return result;
};

const findDeviceByDeviceCode = async (deviceCode) => {
    const [rows] = await pool.execute(
        `
        SELECT d.id, d.name, d.field_id, d.threshold, d.status, ST_AsGeoJSON(d.location) AS location, d.device_code, f.user_id
        FROM devices d
        INNER JOIN fields f ON d.field_id = f.id
        WHERE d.device_code = ?
        LIMIT 1
        `,
        [deviceCode]
    );
    if (rows.length === 0) {
        return null;
    }
    const device = rows[0];

    return {
        ...device,
        location: 
            typeof device.location === 'string'
                ? JSON.parse(device.location)
                : device.location
    };
};

const findDevicesWithLatestData = async (fieldId, userId) => {
  const [rows] = await pool.execute(
    `
    SELECT
      d.id,
      d.device_code,
      d.field_id,
      d.name,
      d.threshold,
      d.status,
      ST_AsGeoJSON(d.location) AS location,

      r.id AS data_id,
      r.temperature,
      r.humidity,
      r.heat_index_c,
      r.soil_adc,
      r.created_at

    FROM devices AS d

    INNER JOIN fields AS f
      ON f.id = d.field_id

    LEFT JOIN device_data_realtime AS r
      ON r.id = (
        SELECT r2.id
        FROM device_data_realtime AS r2
        WHERE r2.device_id = d.id
        ORDER BY
          r2.created_at DESC,
          r2.id DESC
        LIMIT 1
      )

    WHERE d.field_id = ?
      AND f.user_id = ?

    ORDER BY d.created_at DESC
    `,
    [fieldId, userId]
  );

  return rows;
};

const findDeviceByIdAndUserId = async (
    deviceId,
    userId
) => {
    const [rows] = await pool.execute(
        `
        SELECT
            d.id,
            d.field_id,
            d.name,
            d.threshold,
            d.status,
            f.name AS field_name

        FROM devices d

        INNER JOIN fields f
            ON f.id = d.field_id

        WHERE d.id = ?
          AND f.user_id = ?

        LIMIT 1
        `,
        [deviceId, userId]
    );

    return rows[0] ?? null;
};

const findDeviceByMqttId = async (device_code) => {
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        user_id,
        field_id,
        name,
        device_code,
        status,
        threshold
      FROM devices
      WHERE device_code = ?
      LIMIT 1
    `,
    [device_code],
  );

  return rows[0] || null;
};

const findAllDevicesWithLatestData = async (
  userId
) => {
  const [rows] = await pool.execute(
    `
      SELECT
        d.id,
        d.device_code,
        d.field_id,
        d.name,
        d.threshold,
        d.status,
        ST_AsGeoJSON(d.location) AS location,

        f.name AS field_name,

        r.id AS data_id,
        r.temperature,
        r.humidity,
        r.heat_index_c,
        r.soil_adc,
        r.created_at

      FROM devices AS d

      INNER JOIN fields AS f
        ON f.id = d.field_id

      LEFT JOIN device_data_realtime AS r
        ON r.id = (
          SELECT r2.id
          FROM device_data_realtime AS r2
          WHERE r2.device_id = d.id
          ORDER BY
            r2.created_at DESC,
            r2.id DESC
          LIMIT 1
        )

      WHERE f.user_id = ?

      ORDER BY d.created_at DESC
    `,
    [userId]
  );

  return rows;
};

module.exports = {
    findDeviceByFieldId,
    createDevice,
    updateDevice,
    deleteDevice,
    findDeviceByDeviceCode,
    findDevicesWithLatestData,
    findDeviceByIdAndUserId,
    findAllDevicesWithLatestData
};
