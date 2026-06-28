// src/components/device/SensorMetricCard.jsx

const SensorMetricCard = ({
  icon: Icon,
  label,
  value,
  unit,
  description,
}) => {
  const hasValue =
    value !== null &&
    value !== undefined &&
    value !== "";

  return (
    <div
      className="
        flex h-full min-h-[68px] min-w-0
        flex-col justify-between
        rounded-lg border border-zinc-800
        bg-zinc-950/50 p-2.5
        transition-colors
        hover:border-zinc-700 hover:bg-zinc-900/80
      "
    >
      {/* Label */}
      <div className="flex min-w-0 items-center gap-1.5">
        {Icon && (
          <Icon className="size-3.5 shrink-0 text-emerald-400" />
        )}

        <span
          className="truncate text-[10px] leading-none text-zinc-500"
          title={label}
        >
          {label}
        </span>
      </div>

      {/* Value */}
      <div className="mt-2 min-w-0">
        <div className="flex items-baseline gap-1">
          <span className="truncate text-base font-semibold leading-none text-zinc-100">
            {hasValue ? value : "--"}
          </span>

          {hasValue && unit && (
            <span className="shrink-0 text-[9px] text-zinc-500">
              {unit}
            </span>
          )}
        </div>

        {description && (
          <p
            className="mt-1 truncate text-[9px] leading-none text-zinc-600"
            title={description}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default SensorMetricCard;