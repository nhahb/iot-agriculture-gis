const deviceModel = require('../model/device.model');
const fieldModel = require('../model/field.model');
const deviceDataModel = require('../model/deviceData.model');

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const startOfHour = (date) => {
    const result = new Date(date);
    result.setMinutes(0, 0, 0);
    return result;
};

const startOfDay = (date) => {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
};

const getRangeConfig = (range) => {
  const now = new Date();

  switch (range) {
    case '24h': {
    const to = startOfHour(now);

    const from = new Date(
        to.getTime() - 24 * HOUR_MS
    );

    return {
        interval: 'hour',
        from,
        to
    };
}

    case '7d': {
      const from = startOfDay(now);

      /*
       * Hôm nay + 6 ngày trước
       * = 7 ngày trên biểu đồ.
       */
      from.setDate(from.getDate() - 6);

      return {
        interval: 'day',
        from,
        to: now
      };
    }

    case '30d': {
      const from = startOfDay(now);

      /*
       * Hôm nay + 29 ngày trước
       * = 30 ngày.
       */
      from.setDate(from.getDate() - 29);

      return {
        interval: 'day',
        from,
        to: now
      };
    }

    default:
      return null;
  }
};

const toNumberOrNull = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const formatHistoryRow = (row) => ({
  time: row.time,

  sampleCount:
    Number(row.sample_count ?? 0),

  temperature: {
    average:
      toNumberOrNull(
        row.avg_temperature
      ),

    minimum:
      toNumberOrNull(
        row.min_temperature
      ),

    maximum:
      toNumberOrNull(
        row.max_temperature
      )
  },

  humidity: {
    average:
      toNumberOrNull(
        row.avg_humidity
      ),

    minimum:
      toNumberOrNull(
        row.min_humidity
      ),

    maximum:
      toNumberOrNull(
        row.max_humidity
      )
  },

  soilAdc: {
    average:
      toNumberOrNull(
        row.avg_soil_adc
      ),

    minimum:
      toNumberOrNull(
        row.min_soil_adc
      ),

    maximum:
      toNumberOrNull(
        row.max_soil_adc
      )
  },

  heatIndex: {
    average:
      toNumberOrNull(
        row.avg_heat_index_c
      ),

    minimum:
      toNumberOrNull(
        row.min_heat_index_c
      ),

    maximum:
      toNumberOrNull(
        row.max_heat_index_c
      )
  }
});

const calculateSummary = (
  rows,
  averageKey,
  minimumKey,
  maximumKey
) => {
  let weightedTotal = 0;
  let totalSamples = 0;
  let minimum = null;
  let maximum = null;

  for (const row of rows) {
    const average =
      toNumberOrNull(row[averageKey]);

    const sampleCount =
      Number(row.sample_count ?? 0);

    const rowMinimum =
      toNumberOrNull(row[minimumKey]);

    const rowMaximum =
      toNumberOrNull(row[maximumKey]);

    if (
      average !== null &&
      sampleCount > 0
    ) {
      weightedTotal +=
        average * sampleCount;

      totalSamples += sampleCount;
    }

    if (
      rowMinimum !== null &&
      (
        minimum === null ||
        rowMinimum < minimum
      )
    ) {
      minimum = rowMinimum;
    }

    if (
      rowMaximum !== null &&
      (
        maximum === null ||
        rowMaximum > maximum
      )
    ) {
      maximum = rowMaximum;
    }
  }

  return {
    average:
      totalSamples > 0
        ? Number(
            (
              weightedTotal /
              totalSamples
            ).toFixed(2)
          )
        : null,

    minimum,
    maximum
  };
};

exports.getDeviceHistory = async (
  req,
  res
) => {
  const deviceId =
    Number(req.params.deviceId);

    const userId = req.id;

  const range =
    req.query.range ?? '24h';

  if (!Number.isInteger(deviceId)) {
    return res.status(400).json({
      message: 'Invalid device id'
    });
  }

  if (!userId) {
    return res.status(401).json({
      message: 'Unauthorized'
    });
  }

  const rangeConfig =
    getRangeConfig(range);

  if (!rangeConfig) {
    return res.status(400).json({
      message:
        'Range must be 24h, 7d or 30d'
    });
  }

  try {
    let rows;

    if (
      rangeConfig.interval === 'hour'
    ) {
      rows =
        await deviceDataModel
          .findHourlyHistory({
            deviceId,
            userId,
            from: rangeConfig.from,
            to: rangeConfig.to
          });
    } else {
      rows =
        await deviceDataModel
          .findDailyHistory({
            deviceId,
            userId,
            from: rangeConfig.from,
            to: rangeConfig.to
          });
    }

    const totalSamples = rows.reduce(
      (total, row) =>
        total +
        Number(row.sample_count ?? 0),
      0
    );

    return res.json({
      deviceId,
      range,
      interval:
        rangeConfig.interval,

      from: rangeConfig.from,
      to: rangeConfig.to,

      totalSamples,

      summary: {
        temperature:
          calculateSummary(
            rows,
            'avg_temperature',
            'min_temperature',
            'max_temperature'
          ),

        humidity:
          calculateSummary(
            rows,
            'avg_humidity',
            'min_humidity',
            'max_humidity'
          ),

        soilAdc:
          calculateSummary(
            rows,
            'avg_soil_adc',
            'min_soil_adc',
            'max_soil_adc'
          ),

        heatIndex:
          calculateSummary(
            rows,
            'avg_heat_index_c',
            'min_heat_index_c',
            'max_heat_index_c'
          )
      },

      data: rows.map(
        formatHistoryRow
      )
    });
  } catch (error) {
    console.error(
      'Get history error:',
      error
    );

    return res.status(500).json({
      message:
        'Failed to get device history'
    });
  }
};

exports.getDevice = async (req, res) => {
    try {
        const fieldId = Number(req.query.fieldId);

        // Sửa lại theo middleware JWT hiện tại của bạn
        const userId = req.id;

        if (!Number.isInteger(fieldId) || fieldId <= 0) {
            return res.status(400).json({
                message: "fieldId không hợp lệ"
            });
        }

        const rows =
            await deviceModel.findDevicesWithLatestData(
                fieldId,
                userId
            );

        const devices = rows.map((row) => ({
            id: row.id,
            deviceCode: row.device_code,
            fieldId: row.field_id,
            name: row.name,
            type: row.type,
            status: row.status,

            geometry: row.location
                ? typeof row.location === "string"
                    ? JSON.parse(row.location)
                    : row.location
                : null,

            latestData: row.data_id
                ? {
                    id: row.data_id,

                    temperature:
                        row.temperature !== null
                            ? Number(row.temperature)
                            : null,

                    humidity:
                        row.humidity !== null
                            ? Number(row.humidity)
                            : null,

                    heatIndexC:
                        row.heat_index_c !== null
                            ? Number(row.heat_index_c)
                            : null,

                    soilAdc:
                        row.soil_adc !== null
                            ? Number(row.soil_adc)
                            : null,

                    created_at: row.created_at
                }
                : null
        }));

        return res.status(200).json({
            fieldId,
            devices
        });
    } catch (error) {
        console.error(
            "Error fetching devices with latest data:",
            error
        );

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

exports.createDevice = async (req, res) => {
    const { fieldId, name, type, geometry } = req.body;
    const status = 'active'; // Mặc định trạng thái là active khi tạo mới
    try {
        const newDevice = await deviceModel.createDevice(fieldId, name, type, status, geometry);
        res.status(201).json({ device: newDevice });
    } catch (error) {
        console.error('Error creating device:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
