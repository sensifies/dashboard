"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  Truck, 
  AlertTriangle, 
  Activity, 
  MapPin, 
  Layers, 
  Search, 
  Filter, 
  Sliders, 
  CheckCircle2, 
  Clock, 
  Radio, 
  RefreshCw,
  Info
} from "lucide-react";

// Dynamically import Leaflet components to ensure client-side rendering only (preventing SSR window errors)
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

// Mock container data for the Riga fleet live map & status table
interface ContainerItem {
  id: string;
  type: string;
  fill: number;
  hubs: { a: boolean; b: boolean };
  days: number;
  coords: [number, number];
  status: "normal" | "warning" | "critical";
}

const INITIAL_CONTAINERS: ContainerItem[] = [
  { id: "KC8U-003", type: "KC-8U", fill: 2, hubs: { a: true, b: true }, days: 8, coords: [56.9520, 24.1000], status: "normal" },
  { id: "KC8U-001", type: "KC-8U", fill: 46, hubs: { a: true, b: true }, days: 4, coords: [56.9500, 24.1080], status: "normal" },
  { id: "KC8U-002", type: "KC-8U", fill: 50, hubs: { a: true, b: false }, days: 6, coords: [56.9470, 24.1150], status: "warning" },
  { id: "K15-001", type: "K-15", fill: 83, hubs: { a: true, b: false }, days: 9, coords: [56.9430, 24.0950], status: "critical" },
  { id: "K15-002", type: "K-15", fill: 43, hubs: { a: true, b: true }, days: 5, coords: [56.9450, 24.1050], status: "normal" },
  { id: "K15-003", type: "K-15", fill: 93, hubs: { a: true, b: true }, days: 12, coords: [56.9410, 24.1200], status: "critical" },
];

// Dictionary translations for LV and EN
const translations = {
  lv: {
    subtitle: "Divu mezglpunktu radaru atkritumu līmeņa un operāciju vadības panelis",
    simActive: "Simulācija aktīva",
    simPaused: "Pārtraukts",
    speed: "Ātrums:",
    toggle: "Mainīt",
    parks: "Parks",
    details: "Detalizēta informācija",
    warnings: "Brīdinājumi",
    load: "Noslodze",
    searchPlaceholder: "Meklēt konteineru...",
    allTypes: "Visi konteineru tipi",
    showing: "Rāda",
    activeContainers: "aktīvos Clean R konteinerus",
    mapTitle: "Rīgas flotes karte (Leaflet / OSM)",
    clusterActive: "Klasteris aktīvs",
    markers: "marķieri",
    tableTitle: "Konteineru statusa tabula",
    tableHubHealth: "Divu mezglu veselība (A/B)",
    tableIdType: "ID / TIPS",
    tableFill: "PILDĪJUMS %",
    tableHubsAB: "MEZGLI A/B",
    tableDays: "DIENAS",
    tableFooter: "Tiešsaistes atjauninājumi, izmantojot drošu WebSocket straumi",
    footerSpec: "Sensifies Pilot Vadības Panelis - Clean R Projekta Specifikācija 1.0",
    fillLevel: "Pildījuma līmenis:",
    daysActive: "Aktīvs dienas:",
  },
  en: {
    subtitle: "Dual-Hub Radar Waste Level & Operations Dashboard",
    simActive: "Simulation Active",
    simPaused: "Paused",
    speed: "Speed:",
    toggle: "Toggle",
    parks: "Parks",
    details: "Detailed Information",
    warnings: "Warnings",
    load: "Load",
    searchPlaceholder: "Search container...",
    allTypes: "All Container Types",
    showing: "Showing",
    activeContainers: "active Clean R containers",
    mapTitle: "Riga Fleet Live Map (Leaflet / OSM)",
    clusterActive: "Cluster Active",
    markers: "Markers",
    tableTitle: "Container Status Table",
    tableHubHealth: "Dual Hub Health (A/B)",
    tableIdType: "ID / TYPE",
    tableFill: "FILL %",
    tableHubsAB: "HUBS A/B",
    tableDays: "DAYS",
    tableFooter: "Live updates synchronized via secure WebSocket stream",
    footerSpec: "Sensifies Pilot Dashboard - Clean R Project Specification 1.0",
    fillLevel: "Fill Level:",
    daysActive: "Days active:",
  }
};

export default function DashboardPage() {
  const [containers, setContainers] = useState<ContainerItem[]>(INITIAL_CONTAINERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All Container Types");
  const [simulationActive, setSimulationActive] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(60);
  const [activeTab, setActiveTab] = useState("Parks");
  const [lang, setLang] = useState<"lv" | "en">("lv");

  const t = translations[lang];

  // Filter logic for containers
  const filteredContainers = containers.filter((item) => {
    const matchesSearch = item.id.toLowerCase().includes(searchQuery.toLowerCase()) || item.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "All Container Types" || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Header Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-600 text-white p-2 rounded-lg flex items-center justify-center shadow">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg text-slate-900 tracking-tight">SENSIFIES</h1>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">Clean R Pilot</span>
              </div>
              <p className="text-xs text-slate-500">{t.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Simulation Toolbar & Status indicators */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="hidden md:flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>MQTT Broker: mosquitto:9001 (WebSocket)</span>
          </div>

          <div className="flex items-center space-x-3 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => setSimulationActive(!simulationActive)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${simulationActive ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'}`}
            >
              {simulationActive ? t.simActive : t.simPaused}
            </button>
            <div className="flex items-center space-x-1 text-xs text-slate-600 font-medium">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{t.speed}</span>
              <span className="font-bold text-slate-900">{speedMultiplier}x</span>
              <button 
                onClick={() => setSpeedMultiplier(speedMultiplier === 60 ? 120 : 60)}
                className="text-emerald-600 hover:underline font-semibold ml-1"
              >
                {t.toggle}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setLang("lv")}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${lang === "lv" ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}`}
            >
              LV
            </button>
            <button 
              onClick={() => setLang("en")}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${lang === "en" ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Secondary Sub-nav Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between">
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveTab("Parks")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === "Parks" ? 'bg-emerald-700 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {t.parks}
          </button>
          <button 
            onClick={() => setActiveTab("Detalizēta informācija")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === "Detalizēta informācija" ? 'bg-emerald-700 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {t.details}
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1 rounded-full text-xs font-semibold">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{t.warnings}</span>
            <span className="bg-rose-600 text-white rounded-full px-1.5 py-0.2 text-[10px]">3</span>
          </div>
          <button className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition border border-slate-200">
            <Activity className="h-3.5 w-3.5 text-slate-500" />
            <span>{t.load}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* Filters and Search Bar Row */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full md:w-96">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All Container Types">{t.allTypes}</option>
              <option value="KC-8U">KC-8U</option>
              <option value="K-15">K-15</option>
            </select>
            <span className="text-xs text-slate-500 font-medium">
              {t.showing} <strong className="text-slate-800">{filteredContainers.length}</strong> {t.activeContainers}
            </span>
          </div>
        </div>

        {/* Dashboard Grid: Map Section & Status Table Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Leaflet Map Card (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-slate-700 tracking-wider uppercase">{t.mapTitle}</h2>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {t.clusterActive} - {filteredContainers.length} {t.markers}
              </span>
            </div>

            {/* Map Container View */}
            <div className="h-[520px] w-full relative z-0">
              <MapContainer 
                center={[56.9496, 24.1052]} 
                zoom={13} 
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {filteredContainers.map((item) => (
                  <Marker key={item.id} position={item.coords}>
                    <Popup>
                      <div className="p-1 space-y-1">
                        <p className="font-bold text-sm text-slate-900">{item.id} ({item.type})</p>
                        <p className="text-xs text-slate-600">{t.fillLevel} <span className="font-semibold">{item.fill}%</span></p>
                        <p className="text-xs text-slate-600">{t.daysActive} {item.days}d</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Container Status Table Card (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 tracking-wider uppercase">{t.tableTitle}</h2>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t.tableHubHealth}</span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-4">{t.tableIdType}</th>
                    <th className="py-2.5 px-4">{t.tableFill}</th>
                    <th className="py-2.5 px-4 text-center">{t.tableHubsAB}</th>
                    <th className="py-2.5 px-4 text-right">{t.tableDays}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContainers.map((item) => {
                    let fillBadgeStyle = "bg-emerald-50 text-emerald-700 border border-emerald-200";
                    if (item.fill > 50 && item.fill <= 90) fillBadgeStyle = "bg-amber-50 text-amber-700 border border-amber-200";
                    if (item.fill > 90) fillBadgeStyle = "bg-rose-50 text-rose-700 border border-rose-200";

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/85 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.id}</div>
                          <div className="text-[11px] text-slate-400">{item.type}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${fillBadgeStyle}`}>
                            {item.fill}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center space-x-2">
                            <span className="flex items-center space-x-1" title={item.hubs.a ? "Hub A Online" : "Hub A Offline"}>
                              <span className={`h-2 w-2 rounded-full ${item.hubs.a ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              <span className="text-[10px] text-slate-500 font-medium">A</span>
                            </span>
                            <span className="flex items-center space-x-1" title={item.hubs.b ? "Hub B Online" : "Hub B Offline"}>
                              <span className={`h-2 w-2 rounded-full ${item.hubs.b ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              <span className="text-[10px] text-slate-500 font-medium">B</span>
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-600">
                          {item.days}d
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Summary inside Table Card */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
              {t.tableFooter}
            </div>
          </div>

        </div>
      </main>

      {/* Footer Specification Note */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 mt-auto bg-white">
        {t.footerSpec}
      </footer>
    </div>
  );
}