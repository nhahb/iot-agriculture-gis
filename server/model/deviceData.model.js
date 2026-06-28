const pool = require("./db");

const createRealtimeData = async ({
  deviceId,
  temperature,
  humidity,
  heatIndexC,
  soilAdc
}) => {
  const [result] = await pool.execute(
    `
    INSERT INTO device_data_realtime (
      device_id,
      temperature,
      humidity,
      heat_index_c,
      soil_adc
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      deviceId,
      temperature,
      humidity,
      heatIndexC,
      soilAdc
    ]
  );

  return result;
};

const aggregateHourlyData = async (
    hourStart,
    hourEnd
) => {
    if (!hourStart || !hourEnd) {
        throw new Error(
            'hourStart and hourEnd are required'
        );
    }

    const [result] = await pool.execute(
        `
        INSERT INTO device_data_hourly (
            device_id,
            hour_start,
            sample_count,

            avg_temperature,
            min_temperature,
            max_temperature,

            avg_humidity,
            min_humidity,
            max_humidity,

            avg_soil_adc,
            min_soil_adc,
            max_soil_adc,

            avg_heat_index_c,
            min_heat_index_c,
            max_heat_index_c
        )

        SELECT
            aggregated.device_id,
            aggregated.hour_start,
            aggregated.new_sample_count,

            aggregated.new_avg_temperature,
            aggregated.new_min_temperature,
            aggregated.new_max_temperature,

            aggregated.new_avg_humidity,
            aggregated.new_min_humidity,
            aggregated.new_max_humidity,

            aggregated.new_avg_soil_adc,
            aggregated.new_min_soil_adc,
            aggregated.new_max_soil_adc,

            aggregated.new_avg_heat_index_c,
            aggregated.new_min_heat_index_c,
            aggregated.new_max_heat_index_c

        FROM (
            SELECT
                device_id,

                ? AS hour_start,

                COUNT(*) AS new_sample_count,

                ROUND(
                    AVG(temperature),
                    2
                ) AS new_avg_temperature,

                MIN(
                    temperature
                ) AS new_min_temperature,

                MAX(
                    temperature
                ) AS new_max_temperature,

                ROUND(
                    AVG(humidity),
                    2
                ) AS new_avg_humidity,

                MIN(
                    humidity
                ) AS new_min_humidity,

                MAX(
                    humidity
                ) AS new_max_humidity,

                ROUND(
                    AVG(soil_adc),
                    2
                ) AS new_avg_soil_adc,

                MIN(
                    soil_adc
                ) AS new_min_soil_adc,

                MAX(
                    soil_adc
                ) AS new_max_soil_adc,

                ROUND(
                    AVG(heat_index_c),
                    2
                ) AS new_avg_heat_index_c,

                MIN(
                    heat_index_c
                ) AS new_min_heat_index_c,

                MAX(
                    heat_index_c
                ) AS new_max_heat_index_c

            FROM device_data_realtime

            WHERE created_at >= ?
              AND created_at < ?

            GROUP BY device_id
        ) AS aggregated

        ON DUPLICATE KEY UPDATE
            sample_count =
                aggregated.new_sample_count,

            avg_temperature =
                aggregated.new_avg_temperature,

            min_temperature =
                aggregated.new_min_temperature,

            max_temperature =
                aggregated.new_max_temperature,

            avg_humidity =
                aggregated.new_avg_humidity,

            min_humidity =
                aggregated.new_min_humidity,

            max_humidity =
                aggregated.new_max_humidity,

            avg_soil_adc =
                aggregated.new_avg_soil_adc,

            min_soil_adc =
                aggregated.new_min_soil_adc,

            max_soil_adc =
                aggregated.new_max_soil_adc,

            avg_heat_index_c =
                aggregated.new_avg_heat_index_c,

            min_heat_index_c =
                aggregated.new_min_heat_index_c,

            max_heat_index_c =
                aggregated.new_max_heat_index_c
        `,
        [
            hourStart,
            hourStart,
            hourEnd
        ]
    );

    return result;
};

const findHourlyHistory = async ({
    deviceId,
    userId,
    from,
    to
}) => {
    const [rows] = await pool.execute(
        `
        SELECT
            h.hour_start AS time,
            h.sample_count,

            h.avg_temperature,
            h.min_temperature,
            h.max_temperature,

            h.avg_humidity,
            h.min_humidity,
            h.max_humidity,

            h.avg_soil_adc,
            h.min_soil_adc,
            h.max_soil_adc,

            h.avg_heat_index_c,
            h.min_heat_index_c,
            h.max_heat_index_c

        FROM device_data_hourly h

        INNER JOIN devices d
            ON d.id = h.device_id

        INNER JOIN fields f
            ON f.id = d.field_id

        WHERE h.device_id = ?
          AND f.user_id = ?
          AND h.hour_start >= ?
          AND h.hour_start < ?

        ORDER BY h.hour_start ASC
        `,
        [
            deviceId,
            userId,
            from,
            to
        ]
    );

    return rows;
};

const findDailyHistory = async ({
  deviceId,
  userId,
  from,
  to
}) => {
  const params = [
    deviceId,
    userId,
    from,
    to
  ];

  console.log('Daily history params:', params);

  const [rows] = await pool.execute(
    `
    SELECT
      DATE(h.hour_start) AS time,

      SUM(h.sample_count) AS sample_count,

      ROUND(
        SUM(h.avg_temperature * h.sample_count)
        / NULLIF(SUM(h.sample_count), 0),
        2
      ) AS avg_temperature,

      MIN(h.min_temperature) AS min_temperature,
      MAX(h.max_temperature) AS max_temperature,

      ROUND(
        SUM(h.avg_humidity * h.sample_count)
        / NULLIF(SUM(h.sample_count), 0),
        2
      ) AS avg_humidity,

      MIN(h.min_humidity) AS min_humidity,
      MAX(h.max_humidity) AS max_humidity,

      ROUND(
        SUM(h.avg_soil_adc * h.sample_count)
        / NULLIF(SUM(h.sample_count), 0),
        2
      ) AS avg_soil_adc,

      MIN(h.min_soil_adc) AS min_soil_adc,
      MAX(h.max_soil_adc) AS max_soil_adc,

      ROUND(
        SUM(h.avg_heat_index_c * h.sample_count)
        / NULLIF(SUM(h.sample_count), 0),
        2
      ) AS avg_heat_index_c,

      MIN(h.min_heat_index_c) AS min_heat_index_c,
      MAX(h.max_heat_index_c) AS max_heat_index_c

    FROM device_data_hourly h

    INNER JOIN devices d
      ON d.id = h.device_id

    INNER JOIN fields f
      ON f.id = d.field_id

    WHERE h.device_id = ?
      AND f.user_id = ?
      AND h.hour_start >= ?
      AND h.hour_start < ?

    GROUP BY DATE(h.hour_start)

    ORDER BY DATE(h.hour_start) ASC
    `,
    params
  );

  return rows;
};

module.exports = {
  createRealtimeData,
  aggregateHourlyData,
  findHourlyHistory,
  findDailyHistory
};