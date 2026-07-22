"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  Truck,
  AlertTriangle,
  Activity,
  MapPin,
  Search,
  CheckCircle2,
  Clock,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown
} from "lucide-react";

// Leaflet touches `window` at import time and relies on React context shared
// across its components, so load the whole map as one client-only chunk
// (ssr: false). Splitting the individual react-leaflet components into separate
// dynamic imports breaks that shared context (obj[eventsKey] runtime errors).
const FleetMap = dynamic(() => import("./FleetMap"), { ssr: false });

// Recharts measures the DOM, so keep the Load graphs client-only too.
const LoadCharts = dynamic(() => import("./LoadCharts"), { ssr: false });

// Mock container data for the Riga fleet live map & status table
export interface ContainerItem {
  id: string;
  type: string;
  fill: number;
  hubs: { a: boolean; b: boolean };
  days: number;
  coords: [number, number];
  status: "normal" | "warning" | "critical";
}

// Sortable columns for the container status table
type SortKey = "id" | "fill" | "hubs" | "days";
type SortDirection = "asc" | "desc";

// Comparable value for a given sort column. "hubs" ranks by number of online hubs.
function sortValue(item: ContainerItem, key: SortKey): number | string {
  switch (key) {
    case "id":
      return item.id;
    case "fill":
      return item.fill;
    case "days":
      return item.days;
    case "hubs":
      return (item.hubs.a ? 1 : 0) + (item.hubs.b ? 1 : 0);
  }
}

// Solid progress-bar colour by fill level (shared look with the map markers).
function fillBarColor(fill: number): string {
  if (fill > 90) return "bg-rose-500";
  if (fill > 50) return "bg-amber-500";
  return "bg-emerald-500";
}

// Badge styling for a container status, used in the details view.
const STATUS_BADGE: Record<ContainerItem["status"], string> = {
  normal: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  critical: "bg-rose-50 text-rose-700 border border-rose-200",
};

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
    detailsTitle: "Konteineru detalizēts pārskats",
    detailStatus: "Statuss",
    detailCoords: "Koordinātas",
    detailHubs: "Mezgli A/B",
    detailDays: "Aktīvs",
    statusNormal: "Normāls",
    statusWarning: "Brīdinājums",
    statusCritical: "Kritisks",
    noResults: "Nav atrasts neviens konteiners",
    loadTitle: "Noslodzes grafiki",
    loadCurrentFill: "Pašreizējais pildījums pēc konteinera",
    loadOverTime: "Pildījums laika gaitā (6h)",
    loadByStatus: "Konteineri pēc statusa",
    loadByType: "Vidējais pildījums pēc tipa",
    warningsTitle: "Brīdinājumu apstiprināšana",
    acknowledge: "Apstiprināt",
    acknowledged: "Apstiprināts",
    acknowledgeAll: "Apstiprināt visus",
    allClear: "Nav aktīvu brīdinājumu",
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
    detailsTitle: "Container Detailed Overview",
    detailStatus: "Status",
    detailCoords: "Coordinates",
    detailHubs: "Hubs A/B",
    detailDays: "Active",
    statusNormal: "Normal",
    statusWarning: "Warning",
    statusCritical: "Critical",
    noResults: "No containers found",
    loadTitle: "Load Graphs",
    loadCurrentFill: "Current Fill by Container",
    loadOverTime: "Fill Over Time (6h)",
    loadByStatus: "Containers by Status",
    loadByType: "Average Fill by Type",
    warningsTitle: "Warnings Acknowledgment",
    acknowledge: "Acknowledge",
    acknowledged: "Acknowledged",
    acknowledgeAll: "Acknowledge All",
    allClear: "No active warnings",
  }
};

export default function DashboardPage() {
  const [containers] = useState<ContainerItem[]>(INITIAL_CONTAINERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All Container Types");
  const [simulationActive, setSimulationActive] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(60);
  const [activeTab, setActiveTab] = useState("Parks");
  const [lang, setLang] = useState<"lv" | "en">("lv");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [acknowledged, setAcknowledged] = useState<string[]>([]);

  const t = translations[lang];

  // Containers in a warning/critical state drive the Warnings panel and badge.
  const alertContainers = containers.filter((c) => c.status !== "normal");
  const unacknowledgedCount = alertContainers.filter((c) => !acknowledged.includes(c.id)).length;

  const acknowledgeAll = () => setAcknowledged(alertContainers.map((c) => c.id));

  // Filter logic for containers
  const filteredContainers = containers.filter((item) => {
    const matchesSearch = item.id.toLowerCase().includes(searchQuery.toLowerCase()) || item.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "All Container Types" || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Sort the (already filtered) rows for the status table. The map keeps using
  // the unsorted filtered list since ordering is irrelevant there.
  const sortedContainers = [...filteredContainers];
  if (sortKey) {
    sortedContainers.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ChevronsUpDown className="h-3 w-3 text-slate-300" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-emerald-600" />
      : <ChevronDown className="h-3 w-3 text-emerald-600" />;
  };

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
          <button
            onClick={() => setActiveTab("Warnings")}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition border ${activeTab === "Warnings" ? 'bg-rose-600 border-rose-600 text-white' : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'}`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{t.warnings}</span>
            <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${activeTab === "Warnings" ? 'bg-white text-rose-700' : 'bg-rose-600 text-white'}`}>{unacknowledgedCount}</span>
          </button>
          <button
            onClick={() => setActiveTab("Load")}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${activeTab === "Load" ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
          >
            <Activity className={`h-3.5 w-3.5 ${activeTab === "Load" ? 'text-white' : 'text-slate-500'}`} />
            <span>{t.load}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* Filters and Search Bar Row (only for the container list views) */}
        {(activeTab === "Parks" || activeTab === "Detalizēta informācija") && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full md:w-96">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
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
        )}

        {/* Parks tab: live map + status table */}
        {activeTab === "Parks" && (
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
            <div className="h-130 w-full relative z-0">
              <FleetMap
                containers={filteredContainers}
                fillLabel={t.fillLevel}
                daysLabel={t.daysActive}
              />
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
                    <th className="py-2.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleSort("id")}
                        className="flex items-center space-x-1 uppercase tracking-wider hover:text-slate-700 transition select-none"
                      >
                        <span>{t.tableIdType}</span>
                        {renderSortIcon("id")}
                      </button>
                    </th>
                    <th className="py-2.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleSort("fill")}
                        className="flex items-center space-x-1 uppercase tracking-wider hover:text-slate-700 transition select-none"
                      >
                        <span>{t.tableFill}</span>
                        {renderSortIcon("fill")}
                      </button>
                    </th>
                    <th className="py-2.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleSort("hubs")}
                        className="flex items-center justify-center space-x-1 mx-auto uppercase tracking-wider hover:text-slate-700 transition select-none"
                      >
                        <span>{t.tableHubsAB}</span>
                        {renderSortIcon("hubs")}
                      </button>
                    </th>
                    <th className="py-2.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort("days")}
                        className="flex items-center justify-end space-x-1 ml-auto uppercase tracking-wider hover:text-slate-700 transition select-none"
                      >
                        <span>{t.tableDays}</span>
                        {renderSortIcon("days")}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedContainers.map((item) => {
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
        )}

        {/* Details tab: per-container detailed overview */}
        {activeTab === "Detalizēta informācija" && (
          <div>
            <h2 className="text-xs font-bold text-slate-700 tracking-wider uppercase mb-4">{t.detailsTitle}</h2>
            {filteredContainers.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center text-sm text-slate-500">
                {t.noResults}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredContainers.map((item) => {
                  const statusLabel =
                    item.status === "critical" ? t.statusCritical :
                    item.status === "warning" ? t.statusWarning : t.statusNormal;
                  return (
                    <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{item.id}</div>
                          <div className="text-[11px] text-slate-400">{item.type}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[item.status]}`}>
                          {statusLabel}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-500">{t.fillLevel}</span>
                          <span className="font-bold text-slate-700">{item.fill}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${fillBarColor(item.fill)}`} style={{ width: `${item.fill}%` }} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[11px] pt-1 border-t border-slate-100">
                        <div>
                          <div className="text-slate-400 uppercase tracking-wider mb-1">{t.detailHubs}</div>
                          <div className="flex items-center space-x-2">
                            <span className="flex items-center space-x-1">
                              <span className={`h-2 w-2 rounded-full ${item.hubs.a ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              <span className="text-slate-500 font-medium">A</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <span className={`h-2 w-2 rounded-full ${item.hubs.b ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              <span className="text-slate-500 font-medium">B</span>
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 uppercase tracking-wider mb-1">{t.detailDays}</div>
                          <div className="font-semibold text-slate-700">{item.days}d</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-slate-400 uppercase tracking-wider mb-1">{t.detailCoords}</div>
                          <div className="font-mono text-slate-600">{item.coords[0].toFixed(4)}, {item.coords[1].toFixed(4)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Load tab: recharts load graphs */}
        {activeTab === "Load" && (
          <div>
            <h2 className="text-xs font-bold text-slate-700 tracking-wider uppercase mb-4">{t.loadTitle}</h2>
            <LoadCharts
              containers={containers}
              labels={{
                currentFill: t.loadCurrentFill,
                overTime: t.loadOverTime,
                byStatus: t.loadByStatus,
                byType: t.loadByType,
                normal: t.statusNormal,
                warning: t.statusWarning,
                critical: t.statusCritical,
              }}
            />
          </div>
        )}

        {/* Warnings tab: acknowledge active alerts */}
        {activeTab === "Warnings" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-slate-700 tracking-wider uppercase">{t.warningsTitle}</h2>
              {unacknowledgedCount > 0 && (
                <button
                  onClick={acknowledgeAll}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
                >
                  {t.acknowledgeAll}
                </button>
              )}
            </div>
            {alertContainers.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center text-sm text-slate-500 flex items-center justify-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span>{t.allClear}</span>
              </div>
            ) : (
              <div className="space-y-3">
                {alertContainers.map((item) => {
                  const isAck = acknowledged.includes(item.id);
                  const statusLabel = item.status === "critical" ? t.statusCritical : t.statusWarning;
                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl border shadow-sm p-4 flex items-center justify-between gap-4 transition ${isAck ? 'border-slate-200 opacity-60' : item.status === "critical" ? 'border-rose-200' : 'border-amber-200'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className={`h-5 w-5 ${item.status === "critical" ? 'text-rose-500' : 'text-amber-500'}`} />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{item.id} <span className="text-[11px] font-normal text-slate-400">({item.type})</span></div>
                          <div className="text-[11px] text-slate-500">
                            <span className={`font-semibold ${item.status === "critical" ? 'text-rose-600' : 'text-amber-600'}`}>{statusLabel}</span>
                            {" · "}{t.fillLevel} {item.fill}% · {t.daysActive} {item.days}d
                          </div>
                        </div>
                      </div>
                      {isAck ? (
                        <span className="flex items-center space-x-1 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{t.acknowledged}</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => setAcknowledged((prev) => [...prev, item.id])}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition whitespace-nowrap"
                        >
                          {t.acknowledge}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Specification Note */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 mt-auto bg-white">
        {t.footerSpec}
      </footer>
    </div>
  );
}