"use client";

import { useState, useEffect } from "react";

export function DemoSwitcher() {
  const [demoQuarter, setDemoQuarter] = useState<string>("Real Time");

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )demo_quarter=([^;]*)/);
    if (match && match[1]) {
      setDemoQuarter(decodeURIComponent(match[1]));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDemoQuarter(val);
    if (val === "Real Time") {
      document.cookie = "demo_quarter=; max-age=0; path=/";
    } else {
      document.cookie = `demo_quarter=${val}; path=/`;
    }
    // Refresh to instantly apply across all client and server components
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-lg shadow-2xl z-50 flex flex-col gap-2 border border-gray-700">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Demo Mode
      </div>
      <select
        value={demoQuarter}
        onChange={handleChange}
        className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="Real Time">Real Time</option>
        <option value="Q1">Simulate Q1 (July)</option>
        <option value="Q2">Simulate Q2 (October)</option>
        <option value="Q3">Simulate Q3 (January)</option>
        <option value="Q4">Simulate Q4 (March)</option>
      </select>
      <div className="text-[10px] text-gray-500 max-w-[150px] leading-tight">
        Simulate quarterly governance windows for demo/testing.
      </div>
    </div>
  );
}
