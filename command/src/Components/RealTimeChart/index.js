import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";

/*
  === Rivot Command Center — Pro (compact NASA style) ===

  What’s new vs your last version:
  • SOC & APUSOC: half-circle cyan→blue arc gauges (same arc math as SpeedGauge)
  • Current / Voltage / Tire: ¾-circle Grafana-style radial gauges with animated needle
  • Mini temperature charts: time axis at bottom, live in realtime
  • Smaller, denser cards

  Notes:
  • Keep Tailwind enabled. No external CSS required.
  • Endpoints unchanged (localhost/phpback/...).
*/

// ---------- Utilities ----------
const fmt = {
  num(x, d = 2) {
    if (x === undefined || x === null || isNaN(Number(x))) return "N/A";
    const n = Number(x);
    return Math.abs(n) >= 1000 ? n.toFixed(0) : n.toFixed(d);
  },
  parseDate(t) {
    if (!t) return null;
    try {
      const d = new Date(t);
      return isNaN(d) ? null : d;
    } catch {
      return null;
    }
  },
  when(t) {
    const d = fmt.parseDate(t);
    return d ? `${d.toLocaleDateString()} ${d.toLocaleTimeString()}` : "";
  },
};

// ---------- Tiny atoms ----------
const SectionTitle = ({ left, right }) => (
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-xs sm:text-sm tracking-widest uppercase text-cyan-300/80">{left}</h3>
    {right}
  </div>
);

const StatChip = ({ label, value }) => (
  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
    <p className="text-[10px] uppercase tracking-wide text-white/60">{label}</p>
    <p className="text-sm sm:text-base font-semibold text-white break-all">{value}</p>
  </div>
);

// ---------- Arc helpers (same math as your SpeedGauge) ----------
const polar = (cx, cy, r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const arcPath = (cx, cy, r, startDeg, endDeg) => {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const sweep = endDeg - startDeg;
  const largeArc = Math.abs(sweep) > 180 ? 1 : 0;
  const sweepFlag = sweep >= 0 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${e.x} ${e.y}`;
};

// ---------- Gauges ----------
const SpeedGauge = ({ value = 0, max = 200, width = 260 }) => {
  const cx = width / 2;
  const cy = width / 2;
  const outerR = 100;
  const trackR = 92;
  const progressR = 92;
  // same start/end math you already had
  const START = 220;
  const END = 503;
  const span = END - START;
  const pct = Math.max(0, Math.min(value / max, 1));
  const progEnd = START + pct * span;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-900/30 p-3 sm:p-4 shadow-[0_0_20px_rgba(56,189,248,0.12)] " style={{ width: "280px", height: "300px" }}>
      <svg width={width} height={width} viewBox={`0 0 ${width} ${width}`}>
        <defs>
          <linearGradient id="g-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="60%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
        <path d={arcPath(cx, cy, outerR, START, END)} stroke="rgba(34,211,238,0.9)" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d={arcPath(cx, cy, trackR, START, END)} stroke="#0f172a" strokeWidth="18" strokeLinecap="round" fill="none" />
        <path d={arcPath(cx, cy, progressR, START, progEnd)} stroke="url(#g-cyan)" strokeWidth="18" strokeLinecap="round" fill="none" />
        <circle cx={cx} cy={cy} r={60} fill="#0b1324" />
        <text x={cx} y={cy - 2} textAnchor="middle" className="fill-white" style={{ fontSize: 36, fontWeight: 700 }}>
          {Math.round(Number(value) || 0)}
        </text>
        <text x={cx} y={cy + 22} textAnchor="middle" className="fill-white/70" style={{ fontSize: 12 }}>
          km/h
        </text>
      </svg>
    </div>
  );
};

// Half-circle gauge for SOC/APUSOC (same arc math concept)
const HalfArcGauge = ({ label, value = 0, max = 200, width = 260  }) => {
  const cx = width / 2;
  const cy = width / 2;
  const outerR = 100;
  const trackR = 92;
  const progressR = 92;
  // same start/end math you already had
  const START = 220;
  const END = 503;
  const span = END - START;
  const pct = Math.max(0, Math.min(value / max, 1));
  const progEnd = START + pct * span;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-900/30 p-3 shadow-[0_0_16px_rgba(56,189,248,0.10)]" style={{ width: "280px", height: "300px" }}>
      <svg width={width} height={140} viewBox={`0 0 ${width} 140`}>
        <defs>
          <linearGradient id={`g-${label}-cyanblue`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
        {/* glow outer line */}
        <path d={arcPath(cx, cy, trackR + 8, START, END)} stroke="rgba(56,189,248,0.35)" strokeWidth="2" fill="none" />
        {/* track */}
        <path d={arcPath(cx, cy, trackR, START, END)} stroke="#0f172a" strokeWidth="14" strokeLinecap="round" fill="none" />
        {/* progress */}
        <path d={arcPath(cx, cy, progressR, START, progEnd)} stroke={`url(#g-${label}-cyanblue)`} strokeWidth="14" strokeLinecap="round" fill="none" />
        {/* value */}
        <text x={cx} y={cy - 8} textAnchor="middle" className="fill-white" style={{ fontSize: 28, fontWeight: 700 }}>
          {isNaN(Number(value)) ? "N/A" : Math.round(value)}%
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" className="fill-white/70" style={{ fontSize: 12 }}>
          {label}
        </text>
      </svg>
    </div>
  );
};

// ¾-circle Grafana-like gauge with needle
const ThreeQuarterGauge = ({
  label,
  value = 0,
  min = 0,
  max = 100,
  width = 240,
  unit = "",
}) => {
  const cx = width / 2;
  const cy = width / 2 + 10;
  const r = 88;

  // ¾ arc from 150° to 390° (240° span)
  const START = 150;
  const END = 390;
  const span = END - START;

  const clamp = (v) => Math.max(min, Math.min(max, Number(v) || 0));
  const norm = (clamp(value) - min) / (max - min);
  const needleDeg = START + norm * span;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-900/30 p-3 shadow-[0_0_16px_rgba(56,189,248,0.08)]">
      <svg width={width} height={170} viewBox={`0 0 ${width} 170`}>
        <defs>
          <linearGradient id={`g-${label}-track`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#111827" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id={`g-${label}-prog`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>

        {/* outer glow */}
        <path d={arcPath(cx, cy, r + 8, START, END)} stroke="rgba(56,189,248,0.25)" strokeWidth="2" fill="none" />
        {/* track */}
        <path d={arcPath(cx, cy, r, START, END)} stroke="url(#g-${label}-track)" strokeWidth="14" strokeLinecap="round" fill="none" />
        {/* progress fill by splitting arc into two for a subtle fill effect */}
        <path d={arcPath(cx, cy, r, START, START + norm * span)} stroke={`url(#g-${label}-prog)`} strokeWidth="14" strokeLinecap="round" fill="none" />

        {/* needle */}
        <g transform={`rotate(${needleDeg} ${cx} ${cy})`} style={{ transition: "transform 600ms ease" }}>
          <line x1={cx} y1={cy} x2={cx} y2={cy - (r + 6)} stroke="#e5e7eb" strokeWidth="2" />
          <circle cx={cx} cy={cy} r="4" fill="#e5e7eb" />
        </g>

        {/* center label */}
        <text x={cx} y={cy - 2} textAnchor="middle" className="fill-white" style={{ fontSize: 18, fontWeight: 700 }}>
          {fmt.num(value)}
          {unit ? ` ${unit}` : ""}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" className="fill-white/70" style={{ fontSize: 12 }}>
          {label}
        </text>
      </svg>
    </div>
  );
};

// ---------- Mini temperature chart ----------
const MiniTempChart = ({ data = [], dataKey = "motortemp", label = "Temp", color = "#60a5fa" }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-900/30 p-3">
      <div className="mb-2 text-xs text-white/70">{label}</div>
      <div className="h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#d1d5db", fontSize: 10 }}
              tickFormatter={(t) => {
                const d = fmt.parseDate(t);
                return d ? d.toLocaleTimeString() : "";
              }}
            />
            <YAxis
              width={30}
              tick={{ fill: "#d1d5db", fontSize: 10 }}
              tickFormatter={(v) => fmt.num(v, 0)}
            />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid rgba(34,211,238,.25)" }}
              labelFormatter={(t) => fmt.when(t)}
              formatter={(v) => [fmt.num(v), "°C"]}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ---------- Main Component ----------
export default function RealTimeChart({ vin: initialVin }) {
  const [vin, setVin] = useState(initialVin || "");
  const [vinList, setVinList] = useState([]);
  const [data, setData] = useState([]);
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [mode, setMode] = useState("realtime");
  const [details, setDetails] = useState(null);
  const [showInAHChart, setShowInAHChart] = useState(false);

  // VIN list
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`http://localhost/phpback/all_vinfetch.php`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          setVinList(json);
          if (!initialVin) setVin(json[0]);
        } else {
          setVinList([]);
          setVin("");
        }
      } catch (e) {
        console.error("VIN list error", e);
      }
    })();
  }, [initialVin]);

  // Vehicle details by VIN
  useEffect(() => {
    if (!vin) {
      setDetails(null);
      return;
    }
    (async () => {
      try {
        setDetails(null);
        const res = await fetch(
          `http://localhost/phpback/fetch_allvinmodeldtat.php?vin=${encodeURIComponent(vin)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setDetails(json?.error ? {} : json);
      } catch (e) {
        console.error("Vehicle details error", e);
        setDetails({});
      }
    })();
  }, [vin]);

  // Data fetching (realtime & historical)
  const fetchRealtimeData = async () => {
    if (!vin) return;
    try {
      const res = await fetch(`http://localhost/phpback/real_timedata1.php`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const arr = Array.isArray(json) ? json : json ? [json] : [];
      setData(arr.reverse());
    } catch (e) {
      console.error("Realtime error", e);
    }
  };

    const fetchHistoricalData = async () => {
    if (!startDateTime || !endDateTime || !vin) return;
    try {
      const start = encodeURIComponent(new Date(startDateTime).toISOString());
      const end = encodeURIComponent(new Date(endDateTime).toISOString());
      const res = await fetch(
        `http://localhost/phpback/timedataset.php?vin=${vin}&start=${start}&end=${end}`
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      setData(Array.isArray(json) ? json.reverse() : []);
    } catch (err) {
      console.error("Error fetching historical data", err);
    }
  };


  // Poll realtime every 5s
  useEffect(() => {
    if (!vin) return;
    let intv;
    if (mode === "realtime") {
      fetchRealtimeData();
      intv = setInterval(fetchRealtimeData, 5000);
    }
    return () => intv && clearInterval(intv);
  }, [vin, mode]);

  const latest = useMemo(() => (data?.length ? data[0] : {}), [data]);

  // Tooltip used in the main telemetry switcher (kept from your build)
  const CustomTooltip = ({ active, payload }) => {
    if (!(active && payload && payload.length)) return null;
    const p = payload[0].payload || {};
    return (
      <div className="rounded-xl border border-cyan-400/20 bg-slate-900/90 px-3 py-2 text-xs text-white shadow-lg">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 min-w-[280px]">
          <span className="text-white/60">Time</span><span>{p.time ? fmt.when(p.time) : "N/A"}</span>
          <span className="text-white/60">Current (A)</span><span>{fmt.num(p.currentconsumption)}</span>
          <span className="text-white/60">inAH</span><span>{fmt.num(p.inAH ?? p.inah)}</span>
          <span className="text-white/60">inAH by Charger</span><span>{fmt.num(p.inAH_by_charger ?? p.inah_by_charger)}</span>
          <span className="text-white/60">inAH by Regen</span><span>{fmt.num(p.inAH_by_regen ?? p.inah_by_regen)}</span>
          <span className="text-white/60">outAH</span><span>{fmt.num(p.outAH ?? p.outah)}</span>
        </div>
      </div>
    );
  };

  // ---------- Layout ----------
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1B263B,_#0D1B2A_70%)] text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-slate-900/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-cyan-400/20 ring-1 ring-cyan-300/30" />
            <h1 className="text-lg sm:text-xl font-semibold tracking-wide">
              RIVOT MOTORS <span className="text-cyan-300">COMMAND CENTER</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60">Mode</span>
            <div className="inline-flex overflow-hidden rounded-lg border border-white/10">
              <button
                className={`px-3 py-1.5 text-xs ${mode === "realtime" ? "bg-cyan-500/20 text-cyan-300" : "text-white/70 hover:bg-white/5"}`}
                onClick={() => setMode("realtime")}
              >
                Real-time
              </button>
              <button
                className={`px-3 py-1.5 text-xs ${mode === "historical" ? "bg-cyan-500/20 text-cyan-300" : "text-white/70 hover:bg-white/5"}`}
                onClick={() => setMode("historical")}
              >
                History
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Top controls */}
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <SectionTitle left="Vehicle" />
            <div className="flex items-center gap-3">
              <select
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none ring-0 hover:border-cyan-400/40 focus:border-cyan-400"
              >
                <option value="">— Select VIN —</option>
                {vinList.map((v, i) => (
                  <option key={i} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <StatChip label="VIN" value={(latest?.vinnumber || latest?.vinNumber || vin) || "N/A"} />
              <StatChip label="Model" value={details?.model || "N/A"} />
              <StatChip label="Owner" value={details?.ownerName || details?.ownername || "N/A"} />
              <StatChip label="Phone" value={details?.phoneNumber || details?.phonenumber || "N/A"} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <SectionTitle left="Date Range" />
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                disabled={mode === "realtime"}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none hover:border-cyan-400/40 focus:border-cyan-400 disabled:opacity-50"
              />
              <input
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                disabled={mode === "realtime"}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none hover:border-cyan-400/40 focus:border-cyan-400 disabled:opacity-50"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => { setMode("historical"); fetchHistoricalData(); }}
                className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-500/20"
              >
                Load History
              </button>
              {mode === "historical" && (
                <button
                  onClick={() => setMode("realtime")}
                  className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/20"
                >
                  Back to Real-time
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <SectionTitle left="System" />
            <div className="grid grid-cols-2 gap-3">
              <StatChip label="Controller ID" value={details?.controlerid || "N/A"} />
              <StatChip label="Motor ID" value={details?.motorid || "N/A"} />
              <StatChip label="BMS ID" value={details?.bmsid || "N/A"} />
              <StatChip label="Ride OS" value={details?.rideosversion || "N/A"} />
              <StatChip label="Smart Key" value={details?.smartkeyid || "N/A"} />
              <StatChip label="Charged" value={details?.chargingstate ?? details?.charged ?? "N/A"} />
            </div>
          </div>
        </div>

        {/* Telemetry chart (unchanged switch, kept for your inAH view) */}
        <div className="mb-5 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-slate-900/70 to-slate-900/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-wide">{mode === "realtime" ? "Live Telemetry" : "Historical Telemetry"}</h2>
            <button
              onClick={() => setShowInAHChart((s) => !s)}
              className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/20"
            >
              {showInAHChart ? "Show Line Chart" : "Show inAH Bars"}
            </button>
          </div>

          <div className="h-[320px] sm:h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              {showInAHChart ? (
                <BarChart data={data}>
                  <defs>
                    <linearGradient id="glowRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="glowGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="glowBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="glowOrange" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#d1d5db", fontSize: 12 }}
                    tickFormatter={(t) => {
                      const d = fmt.parseDate(t);
                      return d ? d.toLocaleTimeString() : "";
                    }}
                  />
                  <YAxis tick={{ fill: "#d1d5db" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: "#e5e7eb" }} />
                  <Bar dataKey="inah" name="inAH" fill="url(#glowRed)" />
                  <Bar dataKey="inah_by_charger" name="inAH by Charger" fill="url(#glowGreen)" />
                  <Bar dataKey="inah_by_regen" name="inAH by Regen" fill="url(#glowBlue)" />
                  <Bar dataKey="outah" name="outAH" fill="url(#glowOrange)" />
                </BarChart>
              ) : (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#d1d5db", fontSize: 12 }}
                    tickFormatter={(t) => {
                      const d = fmt.parseDate(t);
                      return d ? d.toLocaleTimeString() : "";
                    }}
                  />
                  <YAxis tick={{ fill: "#d1d5db" }} label={{ value: "Amps", angle: -90, position: "insideLeft", fill: "#e5e7eb" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: "#e5e7eb" }} />
                  <Line type="monotone" dataKey="currentconsumption" name="Current (A)" stroke="#f59e0b" dot />
                  <Line type="monotone" dataKey="inah" name="inAH" stroke="#3b82f6" dot={false} />
                  <Line type="monotone" dataKey="inah_by_charger" name="inAH by Charger" stroke="#22c55e" dot={false} />
                  <Line type="monotone" dataKey="inah_by_regen" name="inAH by Regen" stroke="#06b6d4" dot={false} />
                  <Line type="monotone" dataKey="outah" name="outAH" stroke="#ef4444" dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gauges row (compact) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Left: speed + SOC/APUSOC half arcs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-1">
            <SpeedGauge value={Number(latest?.speed_kmph) || 0} max={400} width={240} />
            {/* <HalfArcGauge label="SOC" value={Number(latest?.soc) || 0} max={100} width={240} /> */}
            {/* <HalfArcGauge label="APUSOC" value={Number(latest?.apusoc) || 0} max={100} width={240} /> */}
          </div>

          {/* Middle: ¾-circle Grafana gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:col-span-2">
            <ThreeQuarterGauge
              label="Current Consumption"
              value={Number(latest?.currentconsumption) || 0}
              min={0}
              max={300}
              unit="A"
              width={240}
            />
            <ThreeQuarterGauge
              label="Battery Voltage"
              value={Number(latest?.batvoltage) || 0}
              min={0}
              max={200}
              unit="V"
              width={240}
            />
            <ThreeQuarterGauge
              label="Tire Pressure"
              value={Number(latest?.tirepressure) || 0}
              min={0}
              max={100}
              unit="psi"
              width={240}
            />
          </div>
        </div>

        {/* Mini temperature charts with time axis (live in realtime) */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <MiniTempChart data={data} dataKey="controllermostemp" label="Controller MOS Temp (°C)" color="#f59e0b" />
          <MiniTempChart data={data} dataKey="motortemp" label="Motor Temp (°C)" color="#22c55e" />
          <MiniTempChart data={data} dataKey="bmsmostemp" label="BMS MOS Temp (°C)" color="#60a5fa" />
        </div>

        {/* Text / Meta cards (smaller) */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: "NTC", key: "ntc" },
            { label: "EV Power State", key: "ev_power_state" },
            { label: "Current Rider", key: "currentrider" },
            { label: "Location", key: "lat_long" },
            { label: "Odo", key: "odo", src: "allvin" },
            { label: "Trip KM", key: "tripkm", src: "allvin" },
            { label: "Handle Lock State", key: "handlelockstate", src: "allvin" },
            { label: "Seat Lock State", key: "seatlockstate", src: "allvin" },
            { label: "BMS MOS States Rider", key: "bmsmosstates", src: "allvin" },
            { label: "Charging State Rider", key: "chargingstate", src: "allvin" },
          ].map((t) => {
            const srcObj = t.src === "allvin" ? details : latest;
            const raw = srcObj?.[t.key];
            const val = raw === null || raw === undefined || raw === "" ? "N/A" : raw;
            return (
              <div key={t.key} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-white/60">{t.label}</p>
                <p className="text-base font-semibold break-all">{val}</p>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-white/50">
        VIN: {(latest?.vinnumber || latest?.vinNumber || vin) || "N/A"} • {mode === "realtime" ? "Live" : "History"}
      </footer>
    </div>
  );
}
