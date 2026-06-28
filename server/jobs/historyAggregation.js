const cron = require('node-cron');

const deviceDataHistoryModel =
    require('../model/deviceData.model');

const padNumber = (value) => {
    return String(value).padStart(2, '0');
};

/**
 * Chuyển Date thành định dạng DATETIME của MySQL:
 * YYYY-MM-DD HH:mm:ss
 */
const formatMysqlDateTime = (date) => {
    const year = date.getFullYear();

    const month = padNumber(
        date.getMonth() + 1
    );

    const day = padNumber(
        date.getDate()
    );

    const hour = padNumber(
        date.getHours()
    );

    const minute = padNumber(
        date.getMinutes()
    );

    const second = padNumber(
        date.getSeconds()
    );

    return (
        `${year}-${month}-${day} ` +
        `${hour}:${minute}:${second}`
    );
};

/**
 * Lấy khoảng thời gian của giờ hoàn chỉnh gần nhất.
 *
 * Nếu hiện tại là 10:27:
 * start = 09:00:00
 * end   = 10:00:00
 */
const getPreviousHourRange = (
    currentTime = new Date()
) => {
    const hourEnd = new Date(currentTime);

    hourEnd.setMinutes(0, 0, 0);

    const hourStart = new Date(
        hourEnd.getTime() - 60 * 60 * 1000
    );

    return {
        hourStart: formatMysqlDateTime(hourStart),
        hourEnd: formatMysqlDateTime(hourEnd)
    };
};

const aggregatePreviousHour = async () => {
    const {
        hourStart,
        hourEnd
    } = getPreviousHourRange();

    const result =
        await deviceDataHistoryModel
            .aggregateHourlyData(
                hourStart,
                hourEnd
            );

    return {
        hourStart,
        hourEnd,
        affectedRows: result.affectedRows
    };
};

/**
 * Khởi động các công việc tổng hợp lịch sử dữ liệu.
 */
const startHistoryAggregationJob = () => {
    /*
     * Chạy vào phút thứ 5 của mỗi giờ.
     *
     * Ví dụ:
     * 10:05 -> tổng hợp dữ liệu từ 09:00 đến trước 10:00
     * 11:05 -> tổng hợp dữ liệu từ 10:00 đến trước 11:00
     */
    cron.schedule(
        '5 * * * *',

        async () => {
            console.log(
                '[Hourly aggregation] Job started:',
                new Date().toISOString()
            );

            try {
                const result =
                    await aggregatePreviousHour();

                console.log(
                    '[Hourly aggregation] Completed:',
                    {
                        hourStart: result.hourStart,
                        hourEnd: result.hourEnd,
                        affectedRows:
                            result.affectedRows
                    }
                );
            } catch (error) {
                console.error(
                    '[Hourly aggregation] Failed:',
                    error
                );
            }
        },

        {
            name: 'hourly-device-data-aggregation',
            timezone: 'Asia/Ho_Chi_Minh',
            noOverlap: true
        }
    );

    console.log(
        'History aggregation job initialized'
    );
};

module.exports = startHistoryAggregationJob;