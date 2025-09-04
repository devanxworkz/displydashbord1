function ThermometerCard({
  label,
  value = 0,
  max = 120,
  min = 0,
  gradient = ["#FF9913", "#FF7A00"], // example: orange gradient
  height = 160, // fixed height
  bgColor = "#0d0d0d", // background for empty portion
}) {
  const safeMax = Math.max(min + 1, max);
  const clamped = Math.min(safeMax, Math.max(min, Number(value) || 0));
  const percent = ((clamped - min) / (safeMax - min)) * 100;

  const ticks = Array.from({ length: 6 }, (_, i) => {
    const frac = i / 5;
    return Math.round(min + (safeMax - min) * (1 - frac));
  });

  return (
    <div className="flex flex-col items-center w-[100px]">
      {/* Label + Value */}
      <div className="mb-2 text-center">
        <p className="text-xs uppercase tracking-wide text-white/60 truncate">{label}</p>
        <p className="text-lg font-semibold text-white">{clamped}°C</p>
      </div>

      {/* Thermometer column */}
      <div className="flex items-end gap-3">
        <div
          className="relative w-8 overflow-hidden rounded-full border border-[#FF9913]/30 flex-shrink-0"
          style={{ height, backgroundColor: bgColor }} // empty background color
        >
          <div
            className="absolute bottom-0 left-0 w-full transition-all duration-700"
            style={{
              height: `${percent}%`,
              backgroundImage: `linear-gradient(to top, ${gradient[0]}, ${gradient[1]})`,
              boxShadow: "0 -6px 20px rgba(255,153,19,0.35) inset", // glow for filled part
            }}
          />
        </div>

        {/* Ticks */}
        <div
          className="flex flex-col justify-between text-[10px] text-white/60"
          style={{ height }}
        >
          {ticks.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-px w-3 bg-white/30" />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ThermometerCard;
