import React, { useState, useEffect } from "react";

// Temporary replacements if you don’t have real ones yet
const Svg = ({ title, children }) => (
  <div className="p-4 rounded-2xl border border-cyan-500/30 bg-slate-800/50">
    <h1 className="text-cyan-300 mb-2">{title}</h1>
    {children}
  </div>
);

const Calendar = ({ className }) => (
  <span className={className}>📅</span>
);

export default function HistorySelector({ vin, fetchHistoricalData, loading }) {
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");

  function formatDateTimeLocal(date) {
    return date.toISOString().slice(0, 16);
  }

useEffect(() => {
  function formatDateTimeLocal(date) {
    return date.toISOString().slice(0, 16);
  }

  const updateTimes = () => {
    const now = new Date();
    const minus24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    setEndDateTime(formatDateTimeLocal(now));
    setStartDateTime(formatDateTimeLocal(minus24h));
  };

  updateTimes(); // run immediately
  const timer = setInterval(updateTimes, 60 * 1000); // update every minute

  return () => clearInterval(timer); // cleanup
}, []);

  return (
    <Svg >
      <h2 className="text-base font-semibold tracking-wider text-cyan-300 mb-3 border-b border-cyan-500/30 pb-1">
        Select Date and Time To View Data:{" "}
        <span className="text-white">{vin}</span>
      </h2>

      <div className="flex flex-col gap-3 md:flex-row">
        {/* Start Date */}
        <div className="relative w-full">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
          <input
            type="datetime-local"
            value={startDateTime}
            onChange={(e) => setStartDateTime(e.target.value)}
            className="w-full rounded-xl border border-cyan-400/30 bg-slate-900/70 pl-10 pr-3 py-2 text-sm text-cyan-200 outline-none
                       hover:border-cyan-400/60 focus:border-cyan-400/90 focus:shadow-[0_0_12px_2px_rgba(34,211,238,0.4)] transition"
          />
        </div>
        {/* End Date */}
        <div className="relative w-full">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
          <input
            type="datetime-local"
            value={endDateTime}
            onChange={(e) => setEndDateTime(e.target.value)}
            className="w-full rounded-xl border border-cyan-400/30 bg-slate-900/70 pl-10 pr-3 py-2 text-sm text-cyan-200 outline-none
                       hover:border-cyan-400/60 focus:border-cyan-400/90 focus:shadow-[0_0_12px_2px_rgba(34,211,238,0.4)] transition"
          />
        </div>
      </div>
      {/* Button */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={fetchHistoricalData}
          disabled={loading}
          className="rounded-xl border border-cyan-500/50 bg-cyan-600/10 px-5 py-2 text-sm text-cyan-300 
                     hover:bg-cyan-600/20 hover:shadow-[0_0_15px_2px_rgba(34,211,238,0.5)] 
                     transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : "Load History"}
        </button>
      </div>
    </Svg>
  );
}
