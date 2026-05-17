"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Settings2, GripHorizontal } from "lucide-react";

export function DemoSwitcher() {
  const { data: session } = useSession();
  const [demoQuarter, setDemoQuarter] = useState<string>("Real Time");
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: -20, y: -20 }); // From bottom right
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

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

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    if (cardRef.current) {
      cardRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (cardRef.current) {
      cardRef.current.releasePointerCapture(e.pointerId);
    }
  };

  if (!session) return null;

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        bottom: '20px',
        right: '20px',
      }}
      className="fixed bg-white/95 backdrop-blur-md text-gray-800 p-3.5 rounded-2xl shadow-2xl z-50 flex flex-col gap-2.5 border border-indigo-100 cursor-grab active:cursor-grabbing touch-none hover:shadow-indigo-500/10 transition-shadow w-52"
    >
      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-1">
        <div className="flex items-center gap-2 text-indigo-600">
          <Settings2 className="w-4 h-4" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-gray-800">Demo Mode</span>
        </div>
        <GripHorizontal className="w-4 h-4 text-gray-300 hover:text-gray-500 transition-colors" />
      </div>
      <select
        value={demoQuarter}
        onChange={handleChange}
        onPointerDown={(e) => e.stopPropagation()}
        className="bg-gray-50/80 text-gray-800 border border-gray-200 rounded-lg px-2.5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-gray-400 transition-all w-full cursor-pointer shadow-sm"
      >
        <option value="Real Time">Real Time</option>
        <option value="Q1">Simulate Q1</option>
        <option value="Q2">Simulate Q2</option>
        <option value="Q3">Simulate Q3</option>
        <option value="Q4">Simulate Q4</option>
      </select>
    </div>
  );
}
