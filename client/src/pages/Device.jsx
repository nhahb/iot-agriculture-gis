
import {
  useEffect,
  useState,
} from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Thermometer,
  Droplets,
  MapPin,
  Sprout,
  Power,
  Cpu,
  Clock3,
  LoaderCircle,
} from "lucide-react";

import { toast } from "sonner";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";

const SOIL_DRY_ADC = 3200;
const SOIL_WET_ADC = 1300;

const convertSoilAdcToPercent = (adc) => {
  if (
    adc === null ||
    adc === undefined
  ) {
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
    Math.min(
      100,
      Math.max(0, percentage)
    )
  );
};

const formatValue = (
  value,
  unit = ""
) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "--";
  }

  return `${numericValue.toFixed(1)}${unit}`;
};

const formatDate = (value) => {
  if (!value) {
    return "Chưa có dữ liệu";
  }

  const date = new Date(value);

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

const statusStyles = {
  online:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",

  warning:
    "border-amber-500/20 bg-amber-500/10 text-amber-400",

  critical:
    "border-red-500/20 bg-red-500/10 text-red-400",

  offline:
    "border-zinc-700 bg-zinc-800 text-zinc-400",
};

const statusLabels = {
  online: "Online",
  warning: "Cảnh báo",
  critical: "Nghiêm trọng",
  offline: "Offline",
};

const Device = () => {
  const axiosPrivate =
    useAxiosPrivate();

  const [devices, setDevices] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchDevices = async () => {
      try {
        setIsLoading(true);

        const response =
          await axiosPrivate.get(
            "/device/all"
          );

        const receivedDevices =
          response.data.devices ??
          response.data ??
          [];

        if (
          isMounted &&
          Array.isArray(receivedDevices)
        ) {
          setDevices(receivedDevices);
        }
      } catch (error) {
        console.error(
          "Fetch devices error:",
          error
        );

        if (isMounted) {
          toast.error(
            error.response?.data?.message ||
              "Không thể tải danh sách thiết bị"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDevices();

    return () => {
      isMounted = false;
    };
  }, [axiosPrivate]);

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}
        <header>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Cpu className="size-5" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
                Danh sách thiết bị
              </h1>

              <p className="mt-1 text-sm text-zinc-500">
                Theo dõi trạng thái và dữ liệu
                cảm biến trong hệ thống
              </p>
            </div>
          </div>
        </header>

        {/* LOADING */}
        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <LoaderCircle className="size-4 animate-spin" />
              Đang tải thiết bị...
            </div>
          </div>
        ) : devices.length === 0 ? (
          /* EMPTY */
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
            <Cpu className="mb-3 size-9 text-zinc-600" />

            <p className="font-medium text-zinc-300">
              Chưa có thiết bị
            </p>

            <p className="mt-1 text-sm text-zinc-600">
              Các thiết bị được thêm vào hệ
              thống sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          /* DEVICE CARDS */
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {devices.map((device) => {
              const latestData =
                device.latestData ??
                device.latest_data ??
                {};

              const normalizedStatus =
                String(
                  device.status || "offline"
                ).toLowerCase();

              const statusClass =
                statusStyles[
                  normalizedStatus
                ] || statusStyles.offline;

              const statusLabel =
                statusLabels[
                  normalizedStatus
                ] || "Offline";

              const soilPercentage =
                Number.isFinite(
                  Number(
                    latestData.soilMoisture ??
                      latestData.soil_moisture
                  )
                )
                  ? Math.round(
                      Number(
                        latestData.soilMoisture ??
                          latestData.soil_moisture
                      )
                    )
                  : convertSoilAdcToPercent(
                      latestData.soilAdc ??
                        latestData.soil_adc
                    );

              const rawPumpStatus =
                latestData.pumpStatus ??
                latestData.pump_status ??
                device.pumpStatus ??
                device.pump_status ??
                "off";

              const isPumpOn =
                rawPumpStatus === true ||
                rawPumpStatus === 1 ||
                rawPumpStatus === "1" ||
                String(
                  rawPumpStatus
                ).toLowerCase() === "on";

              const updatedAt =
                latestData.created_at ??
                latestData.recordedAt ??
                latestData.updated_at ??
                device.updated_at;

              const fieldName =
                device.fieldName ??
                device.field_name ??
                "Chưa xác định khu vực";

              const deviceCode =
                device.deviceCode ??
                device.device_code ??
                `Device #${device.id}`;

              return (
                <Card
                  key={device.id}
                  className="
                    overflow-hidden rounded-2xl
                    border-zinc-800
                    bg-zinc-900/60
                    text-white
                    shadow-lg shadow-black/10
                    transition-colors
                    hover:border-zinc-700
                  "
                >
                  <CardHeader className="border-b border-zinc-800/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                          <Cpu className="size-5" />
                        </div>

                        <div className="min-w-0">
                          <CardTitle className="truncate text-base text-zinc-100">
                            {device.name ||
                              "Thiết bị chưa đặt tên"}
                          </CardTitle>

                          <p className="mt-1 truncate text-xs text-zinc-500">
                            {deviceCode}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={statusClass}
                      >
                        {statusLabel}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                      <MapPin className="size-3.5 shrink-0" />

                      <span className="truncate">
                        {fieldName}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 p-4">
                    {/* TEMPERATURE */}
                    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Thermometer className="size-4 text-red-400" />
                        Nhiệt độ
                      </div>

                      <span className="font-semibold text-zinc-100">
                        {formatValue(
                          latestData.temperature,
                          "°C"
                        )}
                      </span>
                    </div>

                    {/* HUMIDITY */}
                    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Droplets className="size-4 text-sky-400" />
                        Độ ẩm không khí
                      </div>

                      <span className="font-semibold text-zinc-100">
                        {formatValue(
                          latestData.humidity,
                          "%"
                        )}
                      </span>
                    </div>

                    {/* SOIL MOISTURE */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <Sprout className="size-4 text-emerald-400" />
                          Độ ẩm đất
                        </div>

                        <span className="font-semibold text-zinc-100">
                          {soilPercentage !== null
                            ? `${soilPercentage}%`
                            : "--"}
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className={`
                            h-full rounded-full
                            transition-[width]
                            ${
                              soilPercentage ===
                              null
                                ? "bg-zinc-600"
                                : soilPercentage <
                                    30
                                  ? "bg-red-500"
                                  : soilPercentage <
                                      50
                                    ? "bg-amber-400"
                                    : "bg-emerald-500"
                            }
                          `}
                          style={{
                            width:
                              soilPercentage !==
                              null
                                ? `${soilPercentage}%`
                                : "0%",
                          }}
                        />
                      </div>
                    </div>

                    {/* PUMP */}
                    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Power
                          className={`size-4 ${
                            isPumpOn
                              ? "text-emerald-400"
                              : "text-zinc-500"
                          }`}
                        />

                        Máy bơm
                      </div>

                      <Badge
                        variant="outline"
                        className={
                          isPumpOn
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : "border-zinc-700 bg-zinc-800 text-zinc-400"
                        }
                      >
                        {isPumpOn
                          ? "Đang bật"
                          : "Đang tắt"}
                      </Badge>
                    </div>

                    {/* LAST UPDATE */}
                    <div className="flex items-start gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
                      <Clock3 className="mt-0.5 size-3.5 shrink-0" />

                      <div>
                        <p>Cập nhật gần nhất</p>

                        <p className="mt-0.5 text-zinc-400">
                          {formatDate(updatedAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default Device;
