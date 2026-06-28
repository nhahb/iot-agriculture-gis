import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { toast } from 'sonner';

import useDeviceHistory
  from '@/hooks/useDeviceHistory';

const RANGE_OPTIONS = [
  {
    key: '24h',
    label: '24 giờ',
  },
  {
    key: '7d',
    label: '7 ngày',
  },
  {
    key: '30d',
    label: '30 ngày',
  }
];

const METRICS = {
  temperature: {
    label: 'Nhiệt độ',
    unit: '°C',
    summaryKey: 'temperature'
  },

  humidity: {
    label: 'Độ ẩm không khí',
    unit: '%',
    summaryKey: 'humidity'
  },

  soilAdc: {
    label: 'Độ ẩm đất',
    unit: ' ADC',
    summaryKey: 'soilAdc'
  },

  heatIndex: {
    label: 'Chỉ số nhiệt',
    unit: '°C',
    summaryKey: 'heatIndex'
  }
};

const formatDateTime = (value) => {
  const date = new Date(value);

  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatXAxis = (value, range) => {
  const date = new Date(value);

  if (range === '24h') {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit'
  });
};

const SummaryCard = ({
  title,
  value,
  unit
}) => {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">
        {title}
      </p>

      <p className="mt-1 text-2xl font-semibold">
        {value !== null &&
        value !== undefined
          ? `${value}${unit}`
          : '--'}
      </p>
    </div>
  );
};

const DeviceHistory = ({
  deviceId,
  deviceName
}) => {
  const [selectedRange, setSelectedRange] =
    useState('7d');

  const [selectedMetric, setSelectedMetric] =
    useState('temperature');

  const {
    historyData,
    historySummary,
    totalSamples,
    loading,
    fetchDeviceHistory
  } = useDeviceHistory();

  useEffect(() => {
  if (!deviceId) return;

  const controller =
    new AbortController();

  const loadHistory = async () => {
    try {
      await fetchDeviceHistory({
        deviceId,
        range: selectedRange,
        signal: controller.signal
      });
    } catch (error) {
      if (
        error.name === 'CanceledError' ||
        error.code === 'ERR_CANCELED'
      ) {
        return;
      }

      console.error(error);

      toast.error(
        'Không thể tải lịch sử thiết bị'
      );
    }
  };

  loadHistory();

  return () => {
    controller.abort();
  };
}, [
  deviceId,
  selectedRange
]);

  const metric =
    METRICS[selectedMetric];

  const summary =
    historySummary?.[
      metric.summaryKey
    ];

  const chartData = useMemo(() => {
    return historyData.map((item) => ({
      time: item.time,

      average:
        item[selectedMetric]?.average,

      minimum:
        item[selectedMetric]?.minimum,

      maximum:
        item[selectedMetric]?.maximum
    }));
  }, [
    historyData,
    selectedMetric
  ]);

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>
            Lịch sử dữ liệu
          </CardTitle>

          <p className="mt-1 text-sm text-muted-foreground">
            {deviceName ??
              'Thiết bị được chọn'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((range) => (
            <Button
              key={range.key}
              size="sm"
              variant={
                selectedRange === range.key
                  ? 'default'
                  : 'outline'
              }
              onClick={() =>
                setSelectedRange(range.key)
              }
            >
              {range.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(METRICS).map(
            ([key, item]) => (
              <Button
                key={key}
                size="sm"
                variant={
                  selectedMetric === key
                    ? 'secondary'
                    : 'ghost'
                }
                onClick={() =>
                  setSelectedMetric(key)
                }
              >
                {item.label}
              </Button>
            )
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {loading ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>

            <Skeleton className="h-[360px] w-full" />
          </>
        ) : historyData.length === 0 ? (
          <div className="flex h-72 items-center justify-center rounded-xl border border-dashed">
            <p className="text-sm text-muted-foreground">
              Chưa có dữ liệu lịch sử trong
              khoảng thời gian này.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryCard
                title="Trung bình"
                value={summary?.average}
                unit={metric.unit}
              />

              <SummaryCard
                title="Thấp nhất"
                value={summary?.minimum}
                unit={metric.unit}
              />

              <SummaryCard
                title="Cao nhất"
                value={summary?.maximum}
                unit={metric.unit}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">
                  {metric.label}
                </h3>

                <p className="text-sm text-muted-foreground">
                {selectedRange === '24h'
                    ? 'Trung bình theo từng giờ'
                    : 'Trung bình theo từng ngày'}
                </p>

                <p className="text-sm text-muted-foreground">
                  Tổng số mẫu: {totalSamples}
                </p>
              </div>
            </div>

            <div className="h-[360px] w-full">
  <ResponsiveContainer
    width="100%"
    height="100%"
  >
    <LineChart
      data={chartData}
      margin={{
        top: 10,
        right: 20,
        left: 0,
        bottom: 10
      }}
    >
      <CartesianGrid
        strokeDasharray="3 3"
        vertical={false}
      />

      <XAxis
        dataKey="time"
        tickFormatter={(value) =>
          formatXAxis(value, selectedRange)
        }
        minTickGap={28}
        fontSize={12}
      />

      <YAxis
        fontSize={12}
        width={50}
        tickFormatter={(value) =>
          `${value}${metric.unit}`
        }
      />

      <Tooltip
        labelFormatter={(value) =>
          formatDateTime(value)
        }
        formatter={(value) => [
          value !== null
            ? `${value}${metric.unit}`
            : '--',
          'Trung bình'
        ]}
      />

      <Legend />

      <Line
        type="linear"
        dataKey="average"
        name="Trung bình"
        stroke="#2563eb"
        strokeWidth={3}
        dot={{
          r: 3,
          fill: '#2563eb',
          strokeWidth: 0
        }}
        activeDot={{
          r: 5
        }}
        connectNulls
        isAnimationActive={false}
      />
        <Line
        type="linear"
        dataKey="minimum"
        name="Thấp nhất"
        stroke="#16a34a"
        strokeWidth={2}
        dot={false}
        />

        <Line
        type="linear"
        dataKey="maximum"
        name="Cao nhất"
        stroke="#dc2626"
        strokeWidth={2}
        dot={false}
        />
    </LineChart>
  </ResponsiveContainer>
</div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DeviceHistory;