"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, MapPin, Radio, Thermometer, Battery, Signal, Cpu, Clock, Trash2 } from "lucide-react";
import type { ContainerItem, HubStatus } from "./data";

// The map uses Leaflet (client-only), so load it as a dynamic ssr:false chunk.
const FleetMap = dynamic(() => import("./FleetMap"), { ssr: false });

const tr = {
  lv: {
    back: "Atpakaļ uz paneli", status: "Statuss",
    normal: "Normāls", warning: "Brīdinājums", critical: "Kritisks",
    fillLevel: "Pildījuma līmenis", fillTrend: "Pildījuma tendence (nesenā)",
    deviceTelemetry: "Ierīces telemetrija", temperature: "Temperatūra",
    lastEmptied: "Pēdējo reizi iztukšots", daysActive: "Aktīvs", address: "Adrese",
    coordinates: "Koordinātas", hubHealth: "Mezglu stāvoklis (A/B)", location: "Atrašanās vieta",
    online: "Tiešsaistē", offline: "Bezsaistē", battery: "Baterija", signal: "Signāls",
    firmware: "Programmaparatūra", lastSeen: "Pēdējo reizi redzēts", hub: "Mezgls",
  },
  en: {
    back: "Back to dashboard", status: "Status",
    normal: "Normal", warning: "Warning", critical: "Critical",
    fillLevel: "Fill Level", fillTrend: "Fill Trend (recent)",
    deviceTelemetry: "Device Telemetry", temperature: "Temperature",
    lastEmptied: "Last emptied", daysActive: "Active", address: "Address",
    coordinates: "Coordinates", hubHealth: "Hub Health (A/B)", location: "Location",
    online: "Online", offline: "Offline", battery: "Battery", signal: "Signal",
    firmware: "Firmware", lastSeen: "Last seen", hub: "Hub",
  },
};

function fillBarColor(fill: number): string {
  if (fill > 90) return "bg-rose-500";
  if (fill > 50) return "bg-amber-500";
  return "bg-emerald-500";
}

const STATUS_BADGE: Record<ContainerItem["status"], string> = {
  normal: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  critical: "bg-rose-50 text-rose-700 border border-rose-200",
};

// Lightweight inline sparkline (avoids pulling a chart library into this route).
function Sparkline({ points }: { points: number[] }) {
  const w = 240;
  const h = 48;
  const max = Math.max(...points, 1);
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(h - (p / max) * (h - 4) - 2).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="#059669" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function HubCard({ label, hub, t }: { label: string; hub: HubStatus; t: typeof tr["en"] }) {
  return (
    <div className={`rounded-xl border p-4 space-y-3 ${hub.online ? "border-slate-200 bg-white" : "border-rose-200 bg-rose-50/40"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Radio className={`h-4 w-4 ${hub.online ? "text-emerald-600" : "text-rose-500"}`} />
          <span className="font-bold text-slate-800 text-sm">{t.hub} {label}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hub.online ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
          {hub.online ? t.online : t.offline}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-[11px]">
        <Metric icon={<Battery className="h-3.5 w-3.5" />} label={t.battery} value={`${hub.battery}%`} />
        <Metric icon={<Signal className="h-3.5 w-3.5" />} label={t.signal} value={`${hub.signal} dBm`} />
        <Metric icon={<Cpu className="h-3.5 w-3.5" />} label={t.firmware} value={hub.firmware} />
        <Metric icon={<Clock className="h-3.5 w-3.5" />} label={t.lastSeen} value={hub.lastSeen} />
      </dl>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center space-x-1 text-slate-400 uppercase tracking-wider mb-0.5">
        <span className="text-slate-400">{icon}</span>
        <span>{label}</span>
      </dt>
      <dd className="font-semibold text-slate-700">{value}</dd>
    </div>
  );
}

export default function ContainerDetail({ container }: { container: ContainerItem }) {
  const [lang, setLang] = useState<"lv" | "en">("lv");
  const t = tr[lang];
  const statusLabel = container.status === "critical" ? t.critical : container.status === "warning" ? t.warning : t.normal;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition">
          <ArrowLeft className="h-4 w-4" />
          <span>{t.back}</span>
        </Link>
        <div className="flex items-center space-x-2">
          <button onClick={() => setLang("lv")} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${lang === "lv" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"}`}>LV</button>
          <button onClick={() => setLang("en")} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${lang === "en" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"}`}>EN</button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-300 w-full mx-auto space-y-6">
        {/* Title row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{container.id}</h1>
            <span className="text-sm text-slate-400 font-medium">{container.type}</span>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_BADGE[container.status]}`}>{statusLabel}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: fill + telemetry */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-end justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.fillLevel}</span>
                <span className="text-3xl font-bold text-slate-900">{container.fill}%</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${fillBarColor(container.fill)}`} style={{ width: `${container.fill}%` }} />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">{t.fillTrend}</div>
                <Sparkline points={container.fillHistory} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{t.deviceTelemetry}</h2>
              <dl className="grid grid-cols-2 gap-4 text-xs">
                <Metric icon={<Thermometer className="h-3.5 w-3.5" />} label={t.temperature} value={`${container.temperature.toFixed(1)} °C`} />
                <Metric icon={<Trash2 className="h-3.5 w-3.5" />} label={t.lastEmptied} value={container.lastEmptied} />
                <Metric icon={<Clock className="h-3.5 w-3.5" />} label={t.daysActive} value={`${container.days}d`} />
                <Metric icon={<MapPin className="h-3.5 w-3.5" />} label={t.coordinates} value={`${container.coords[0].toFixed(4)}, ${container.coords[1].toFixed(4)}`} />
                <div className="col-span-2">
                  <dt className="flex items-center space-x-1 text-slate-400 uppercase tracking-wider mb-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{t.address}</span>
                  </dt>
                  <dd className="font-semibold text-slate-700">{container.address}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Right: hubs + map */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.hubHealth}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <HubCard label="A" hub={container.hubs.a} t={t} />
                <HubCard label="B" hub={container.hubs.b} t={t} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.location}</h2>
              </div>
              <div className="h-75 w-full relative z-0">
                <FleetMap
                  containers={[container]}
                  center={container.coords}
                  zoom={15}
                  fillLabel={`${t.fillLevel}:`}
                  daysLabel={`${t.daysActive}:`}
                  detailsLabel={t.back}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
