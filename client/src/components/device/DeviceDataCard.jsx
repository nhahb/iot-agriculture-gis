import {
  Thermometer,
  Droplets,
  Sprout,
  Gauge,
  Clock3,
  Cpu,
} from "lucide-react";

import SensorMetricCard from "./SensorMetricCard";

const SOIL_DRY_ADC = 3200;
const SOIL_WET_ADC = 1300;

const convertSoilAdcToPercent = (adc) => {
  if (adc === null || adc === undefined) {
    return null;
  }

  const adcValue = Number(adc);

  if (!Number.isFinite(adcValue)) {
    return null;
  }

  const percentage =
    ((SOIL_DRY_ADC - adcValue) /
      (SOIL_DRY_ADC - SOIL_WET_ADC)) *
    100;

  return Math.round(
    Math.min(100, Math.max(0, percentage))
  );
};

const statusStyles = {
  online: {
    dot: "bg-emerald-400",
    text: "Online",
    wrapper:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  },

  warning: {
    dot: "bg-amber-400",
    text: "Warning",
    wrapper:
      "border-amber-500/20 bg-amber-500/10 text-amber-400",
  },

  critical: {
    dot: "bg-red-400",
    text: "Critical",
    wrapper:
      "border-red-500/20 bg-red-500/10 text-red-400",
  },

  offline: {
    dot: "bg-zinc-500",
    text: "Offline",
    wrapper:
      "border-zinc-700 bg-zinc-800/60 text-zinc-400",
  },
};

const formatRecordedAt = (recordedAt) => {
  if (!recordedAt) {
    return "Chưa có dữ liệu";
  }

  const date = new Date(recordedAt);

  if (Number.isNaN(date.getTime())) {
    return "Không xác định";
  }

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getSoilProgressColor = (percentage) => {
  if (percentage === null) {
    return "bg-zinc-600";
  }

  if (percentage < 30) {
    return "bg-red-500";
  }

  if (percentage < 50) {
    return "bg-amber-400";
  }

  return "bg-emerald-500";
};

const DeviceDataCard = ({ device }) => {
  const latestData = device.latestData;

  const soilPercentage = convertSoilAdcToPercent(
    latestData?.soilAdc
  );

  const normalizedStatus =
    device.status?.toLowerCase() || "offline";

  const status =
    statusStyles[normalizedStatus] ||
    statusStyles.offline;

  const soilProgressColor =
    getSoilProgressColor(soilPercentage);

  return (
    <article
      className="
        overflow-hidden rounded-xl
        border border-zinc-800
        bg-zinc-900/70
        shadow-md shadow-black/20
        transition-colors
        hover:border-zinc-700
      "
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <Cpu className="size-4" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-xs font-semibold text-zinc-100">
              {device.name || "Thiết bị chưa đặt tên"}
            </h3>

            <p className="mt-0.5 truncate text-[10px] text-zinc-500">
              {device.deviceCode ||
                `Device #${device.id}`}
            </p>
          </div>
        </div>

        <div
          className={`
            flex shrink-0 items-center gap-1
            rounded-full border px-2 py-0.5
            ${status.wrapper}
          `}
        >
          <span className="relative flex size-1.5">
            {normalizedStatus === "online" && (
              <span
                className={`
                  absolute inline-flex size-full
                  animate-ping rounded-full
                  opacity-50
                  ${status.dot}
                `}
              />
            )}

            <span
              className={`
                relative inline-flex size-1.5
                rounded-full
                ${status.dot}
              `}
            />
          </span>

          <span className="text-[9px] font-medium">
            {status.text}
          </span>
        </div>
      </div>

      {/* SENSOR DATA */}
      <div className="p-3">
        <div className="grid auto-rows-fr grid-cols-2 gap-2">
          <SensorMetricCard
            icon={Thermometer}
            label="Nhiệt độ"
            value={latestData?.temperature}
            unit="°C"
          />

          <SensorMetricCard
            icon={Droplets}
            label="Độ ẩm không khí"
            value={latestData?.humidity}
            unit="%"
          />

          <SensorMetricCard
            icon={Gauge}
            label="Cảm nhận"
            value={latestData?.heatIndexC}
            unit="°C"
          />

          <SensorMetricCard
            icon={Sprout}
            label="Độ ẩm đất"
            value={soilPercentage}
            unit="%"
            description={
              latestData?.soilAdc !== null &&
              latestData?.soilAdc !== undefined
                ? `ADC: ${latestData.soilAdc}`
                : null
            }
          />
        </div>

        {/* SOIL MOISTURE */}
        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/50 px-2.5 py-2">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Sprout className="size-3 text-zinc-500" />

              <span className="text-[10px] text-zinc-400">
                Độ ẩm đất
              </span>
            </div>

            <span className="text-[10px] font-semibold text-zinc-200">
              {soilPercentage !== null
                ? `${soilPercentage}%`
                : "--"}
            </span>
          </div>

          <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`
                h-full rounded-full
                transition-[width] duration-500
                ${soilProgressColor}
              `}
              style={{
                width:
                  soilPercentage !== null
                    ? `${soilPercentage}%`
                    : "0%",
              }}
            />
          </div>
        </div>

        {/* LAST UPDATE */}
        <div className="mt-2 flex items-center gap-1.5 text-[9px] text-zinc-500">
          <Clock3 className="size-3 shrink-0" />

          <span className="truncate">
            {formatRecordedAt(
              latestData?.created_at ||
                latestData?.recordedAt
            )}
          </span>
        </div>
      </div>
    </article>
  );
};

export default DeviceDataCard;