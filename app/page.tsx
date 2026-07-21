"use client";

import React, { useState, useEffect } from 'react';
import { 
  Truck, Activity, MapPin, 
  RefreshCw, CheckCircle, Clock, BarChart2, ShieldAlert, WifiOff
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

// --- TYPES & INTERFACES ---
type ContainerType = 'KC-8U' | 'K-15';
type HubStatus = 'active' | 'warning' | 'silent';
type AlertStatus = 'new' | 'acknowledged';

interface HubInfo {
  batteryMv: number;
  rssi: number;
  lastSeen: string;
  status: HubStatus;
}

interface ContainerPoint {
  idx: number;
  fillPct: number | null;
}

interface ContainerData {
  id: string;
  type: ContainerType;
  site: string;
  coordinates: { lat: number; lng: number };
  daysOnSite: number;
  hubs: { A: HubInfo; B: HubInfo };
  points: ContainerPoint[];
  statusLabel: 'working' | 'full_awaiting_pickup' | 'idle_empty' | 'insufficient_data';
}

interface AlertItem {
  id: string;
  time: string;
  containerId: string;
  type: 'fill_high' | 'hub_silent' | 'low_battery' | 'long_idle';
  status: AlertStatus;
}

// --- INITIAL MOCK DATA ---
const INITIAL_CONTAINERS: ContainerData[] = [
  {
    id: "KC8U-001",
    type: "KC-8U",
    site: "Central Market Hub, Riga",
    coordinates: { lat: 56.9496, lng: 24.1052 },
    daysOnSite: 4,
    hubs: {
      A: { batteryMv: 3600, rssi: -85, lastSeen: new Date().toISOString(), status: 'active' },
      B: { batteryMv: 3580, rssi: -88, lastSeen: new Date().toISOString(), status: 'active' }
    },
    points: [{ idx: 1, fillPct: 45 }, { idx: 2, fillPct: 50 }, { idx: 3, fillPct: 42 }, { idx: 4, fillPct: 48 }],
    statusLabel: 'working'
  },
  {
    id: "K15-001",
    type: "K-15",
    site: "Port Terminal North",
    coordinates: { lat: 56.9716, lng: 24.1012 },
    daysOnSite: 9,
    hubs: {
      A: { batteryMv: 3450, rssi: -92, lastSeen: new Date().toISOString(), status: 'active' },
      B: { batteryMv: 3470, rssi: -90, lastSeen: new Date().toISOString(), status: 'active' }
    },
    points: Array.from({ length: 8 }, (_, i) => ({ idx: i + 1, fillPct: 82 + (i % 3) })),
    statusLabel: 'full_awaiting_pickup'
  },
  {
    id: "KC8U-002",
    type: "KC-8U",
    site: "Old Town Construction Site",
    coordinates: { lat: 56.9510, lng: 24.1130 },
    daysOnSite: 6,
    hubs: {
      A: { batteryMv: 3550, rssi: -80, lastSeen: new Date().toISOString(), status: 'active' },
      B: { batteryMv: 3100, rssi: -105, lastSeen: new Date(Date.now() - 25 * 3600 * 1000).toISOString(), status: 'silent' }
    },
    points: [{ idx: 1, fillPct: 65 }, { idx: 2, fillPct: 70 }, { idx: 3, fillPct: 0 }, { idx: 4, fillPct: 68 }],
    statusLabel: 'working'
  },
  {
    id: "K15-003",
    type: "K-15",
    site: "Industrial Zone South",
    coordinates: { lat: 56.9200, lng: 24.0800 },
    daysOnSite: 12,
    hubs: {
      A: { batteryMv: 3300, rssi: -95, lastSeen: new Date().toISOString(), status: 'active' },
      B: { batteryMv: 3320, rssi: -94, lastSeen: new Date().toISOString(), status: 'active' }
    },
    points: Array.from({ length: 8 }, (_, i) => ({ idx: i + 1, fillPct: 91 })),
    statusLabel: 'full_awaiting_pickup'
  },
  {
    id: "KC8U-003",
    type: "KC-8U",
    site: "Railway Depot Yard",
    coordinates: { lat: 56.9350, lng: 24.1400 },
    daysOnSite: 8,
    hubs: {
      A: { batteryMv: 3620, rssi: -78, lastSeen: new Date().toISOString(), status: 'active' },
      B: { batteryMv: 3610, rssi: -79, lastSeen: new Date().toISOString(), status: 'active' }
    },
    points: [{ idx: 1, fillPct: 4 }, { idx: 2, fillPct: 2 }, { idx: 3, fillPct: 5 }, { idx: 4, fillPct: 3 }],
    statusLabel: 'idle_empty'
  },
  {
    id: "K15-002",
    type: "K-15",
    site: "Shopping Mall Extension",
    coordinates: { lat: 56.9600, lng: 24.1700 },
    daysOnSite: 5,
    hubs: {
      A: { batteryMv: 3500, rssi: -82, lastSeen: new Date().toISOString(), status: 'active' },
      B: { batteryMv: 3490, rssi: -84, lastSeen: new Date().toISOString(), status: 'active' }
    },
    points: Array.from({ length: 8 }, (_, i) => ({ idx: i + 1, fillPct: 35 + (i * 2) })),
    statusLabel: 'working'
  }
];

const INITIAL_ALERTS: AlertItem[] = [
  { id: 'alt-1', time: '10:42 AM', containerId: 'K15-001', type: 'fill_high', status: 'new' },
  { id: 'alt-2', time: '09:15 AM', containerId: 'KC8U-002', type: 'hub_silent', status: 'new' },
  { id: 'alt-3', time: 'Yesterday', containerId: 'K15-003', type: 'long_idle', status: 'new' },
  { id: 'alt-4', time: '2 days ago', containerId: 'KC8U-003', type: 'long_idle', status: 'acknowledged' }
];

const tDict = {
  lv: {
    fleet: "Parks",
    alerts: "Brīdinājumi",
    utilization: "Noslodze",
    liveDemo: "Simulētie dati",
    resetScenario: "Atiestatīt scenāriju",
    speed: "Ātrums",
    search: "Meklēt konteineru...",
    actions: "Darbības",
    ack: "Apstiprināt",
    idleDays: "Vid. dienas objektā",
    turnaround: "Vid. cikls (dienas)",
    fullUncollected: "Pilni, nepaņemti",
    idleEmpty: "Tukši dīkstāvē",
    details: "Detalizēta informācija",
    battery: "Baterija",
    connectionLost: "Zudis savienojums ar brokeri — mēģina atjaunot..."
  },
  en: {
    fleet: "Fleet",
    alerts: "Alerts",
    utilization: "Utilization",
    liveDemo: "Simulated Data",
    resetScenario: "Reset Scenario",
    speed: "Speed",
    search: "Search container...",
    actions: "Actions",
    ack: "Acknowledge",
    idleDays: "Avg Days on Site",
    turnaround: "Avg Turnaround",
    fullUncollected: "Full & Uncollected",
    idleEmpty: "Idle Empty",
    details: "Container Detail",
    battery: "Battery",
    connectionLost: "Connection lost to broker — reconnecting..."
  }
};

export default function SensifiesDashboard() {
  const [lang, setLang] = useState<'lv' | 'en'>('lv');
  const [activeTab, setActiveTab] = useState<'fleet' | 'detail' | 'alerts' | 'utilization'>('fleet');
  const [selectedContainerId, setSelectedContainerId] = useState<string>('K15-001');
  
  const [containers, setContainers] = useState<ContainerData[]>(INITIAL_CONTAINERS);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(60);
  const [isConnected] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const t = tDict[lang];

  useEffect(() => {
    const interval = setInterval(() => {
      setContainers(prev => prev.map(c => {
        const updatedPoints = c.points.map(p => {
          if (p.fillPct === null) return p;
          const delta = (Math.random() - 0.48) * 2;
          const newVal = Math.min(100, Math.max(0, Math.round(p.fillPct + delta)));
          return { ...p, fillPct: newVal };
        });
        return { ...c, points: updatedPoints };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getContainerMeanFill = (c: ContainerData) => {
    const valid = c.points.filter(p => p.fillPct !== null);
    if (valid.length === 0 || valid.length < c.points.length * 0.5) return -1;
    const sum = valid.reduce((acc, curr) => acc + (curr.fillPct || 0), 0);
    return Math.round(sum / valid.length);
  };

  const getBadgeColor = (fill: number) => {
    if (fill < 0) return 'bg-gray-200 text-gray-700';
    if (fill < 50) return 'bg-[#E8F5E9] text-[#1B5E20] border border-[#97BC62]';
    if (fill < 80) return 'bg-amber-100 text-amber-800 border border-amber-300';
    return 'bg-red-100 text-red-800 border border-red-300 animate-pulse';
  };

  const getHubDot = (status: HubStatus) => {
    switch(status) {
      case 'active': return <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block shadow-sm"></span>;
      case 'warning': return <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm"></span>;
      case 'silent': return <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-sm"></span>;
    }
  };

  const handleResetScenario = () => {
    setContainers(JSON.parse(JSON.stringify(INITIAL_CONTAINERS)));
    setAlerts(INITIAL_ALERTS);
  };

  const activeContainer = containers.find(c => c.id === selectedContainerId) || containers[0];
  const activeMeanFill = getContainerMeanFill(activeContainer);

  const filteredContainers = containers.filter(c => {
    const matchesType = filterType === 'all' || c.type === filterType;
    const matchesSearch = c.id.toLowerCase().includes(searchQuery.toLowerCase()) || c.site.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F4F7F4] text-[#0F2310] font-sans flex flex-col">
      <div className="bg-[#0F2310] text-[#E8F5E9] px-4 py-2 text-xs flex flex-wrap justify-between items-center border-b border-[#1B5E20]">
        <div className="flex items-center space-x-3">
          <span className="flex items-center bg-[#1B5E20] text-white px-2 py-0.5 rounded text-[11px] font-medium tracking-wide">
            <Activity className="w-3 h-3 mr-1 animate-pulse" /> {t.liveDemo}
          </span>
          <span className="hidden sm:inline text-gray-300">MQTT Broker: mosquitto:9001 (WebSocket)</span>
          {!isConnected && (
            <span className="text-red-400 flex items-center font-bold">
              <WifiOff className="w-3 h-3 mr-1" /> {t.connectionLost}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-[#97BC62]" />
            <span>{t.speed}: <strong>{speedMultiplier}×</strong></span>
            <button 
              onClick={() => setSpeedMultiplier(s => s === 1 ? 60 : 1)}
              className="ml-1 text-[10px] bg-[#1B5E20] hover:bg-[#2E7D32] px-1.5 py-0.5 rounded text-white transition"
            >
              Toggle
            </button>
          </div>
          <button 
            onClick={handleResetScenario}
            className="flex items-center bg-[#1B5E20] hover:bg-[#2E7D32] text-white px-2 py-0.5 rounded transition text-[11px]"
          >
            <RefreshCw className="w-3 h-3 mr-1" /> {t.resetScenario}
          </button>
          <div className="flex items-center bg-[#1B5E20] rounded p-0.5">
            <button 
              onClick={() => setLang('lv')} 
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${lang === 'lv' ? 'bg-[#97BC62] text-[#0F2310]' : 'text-gray-300'}`}
            >
              LV
            </button>
            <button 
              onClick={() => setLang('en')} 
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${lang === 'en' ? 'bg-[#97BC62] text-[#0F2310]' : 'text-gray-300'}`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-xs">
        <div className="flex items-center space-x-3 mb-3 md:mb-0">
          <div className="bg-[#1B5E20] p-2 rounded-lg text-white">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#0F2310] flex items-center">
              SENSIFIES <span className="text-[#1B5E20] ml-2 font-normal text-sm bg-[#E8F5E9] px-2 py-0.5 rounded-full">Clean R Pilot</span>
            </h1>
            <p className="text-xs text-gray-500">Dual-Hub Radar Waste Level & Operations Dashboard</p>
          </div>
        </div>

        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('fleet')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'fleet' ? 'bg-[#1B5E20] text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
          >
            {t.fleet}
          </button>
          <button 
            onClick={() => setActiveTab('detail')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'detail' ? 'bg-[#1B5E20] text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
          >
            {t.details}
          </button>
          <button 
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition relative ${activeTab === 'alerts' ? 'bg-[#1B5E20] text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
          >
            {t.alerts}
            {alerts.filter(a => a.status === 'new').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold">
                {alerts.filter(a => a.status === 'new').length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('utilization')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'utilization' ? 'bg-[#1B5E20] text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
          >
            {t.utilization}
          </button>
        </nav>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'fleet' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <input 
                  type="text" 
                  placeholder={t.search} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-[#1B5E20]"
                />
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B5E20]"
                >
                  <option value="all">All Container Types</option>
                  <option value="KC-8U">KC-8U (4 points)</option>
                  <option value="K-15">K-15 (8 points)</option>
                </select>
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Showing <strong>{filteredContainers.length}</strong> active Clean R containers
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white rounded-2xl shadow-xs border border-gray-200 p-4 flex flex-col h-[520px] relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-bold text-gray-800 text-sm flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-[#1B5E20]" /> Riga Fleet Live Map (Leaflet / OSM)
                  </h2>
                  <span className="text-[11px] bg-green-50 text-[#1B5E20] px-2 py-0.5 rounded border border-green-200 font-medium">
                    Cluster Active · 6 Markers
                  </span>
                </div>

                <div className="flex-1 bg-[#E8F5E9] rounded-xl relative border border-green-200 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#1B5E20_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  
                  {filteredContainers.map((c, idx) => {
                    const mean = getContainerMeanFill(c);
                    const colorClass = mean >= 80 ? 'bg-red-600 text-white animate-bounce' : mean >= 50 ? 'bg-amber-500 text-white' : 'bg-[#1B5E20] text-white';
                    const positions = [
                      { top: '30%', left: '45%' },
                      { top: '65%', left: '25%' },
                      { top: '40%', left: '75%' },
                      { top: '75%', left: '70%' },
                      { top: '20%', left: '20%' },
                      { top: '55%', left: '50%' },
                    ];
                    const pos = positions[idx % positions.length];

                    return (
                      <div 
                        key={c.id}
                        onClick={() => { setSelectedContainerId(c.id); setActiveTab('detail'); }}
                        style={{ top: pos.top, left: pos.left }}
                        className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl shadow-lg flex items-center space-x-1.5 transition hover:scale-110 ${colorClass}`}
                      >
                        <Truck className="w-4 h-4" />
                        <span className="text-xs font-bold">{c.id} ({mean}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-5 bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden flex flex-col h-[520px]">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h2 className="font-bold text-gray-800 text-sm">Container Status Table</h2>
                  <span className="text-xs text-gray-500">Dual Hub Health (A/B)</span>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider">
                        <th className="p-3">ID / Type</th>
                        <th className="p-3">Fill %</th>
                        <th className="p-3">Hubs A/B</th>
                        <th className="p-3">Days</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredContainers.map(c => {
                        const mean = getContainerMeanFill(c);
                        return (
                          <tr 
                            key={c.id} 
                            onClick={() => { setSelectedContainerId(c.id); setActiveTab('detail'); }}
                            className="hover:bg-green-50/50 cursor-pointer transition"
                          >
                            <td className="p-3 font-medium">
                              <div className="text-[#0F2310] font-bold">{c.id}</div>
                              <div className="text-[10px] text-gray-500">{c.type}</div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getBadgeColor(mean)}`}>
                                  {mean >= 0 ? `${mean}%` : 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center space-x-2">
                                <span title={`Hub A: ${c.hubs.A.status}`}>{getHubDot(c.hubs.A.status)} A</span>
                                <span title={`Hub B: ${c.hubs.B.status}`}>{getHubDot(c.hubs.B.status)} B</span>
                              </div>
                            </td>
                            <td className="p-3 font-medium text-gray-600">
                              {c.daysOnSite}d
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'detail' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center space-x-3">
                  <select 
                    value={selectedContainerId} 
                    onChange={(e) => setSelectedContainerId(e.target.value)}
                    className="text-lg font-bold border border-gray-300 rounded-lg px-3 py-1 bg-white focus:ring-2 focus:ring-[#1B5E20]"
                  >
                    {containers.map(c => (
                      <option key={c.id} value={c.id}>{c.id} — {c.site}</option>
                    ))}
                  </select>
                  <span className="bg-[#E8F5E9] text-[#1B5E20] font-bold text-xs px-2.5 py-1 rounded-full border border-[#97BC62]">
                    {activeContainer.type}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">📍 {activeContainer.site} · On site for <strong>{activeContainer.daysOnSite} days</strong></p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-xs text-gray-500">Aggregate Fill Level</div>
                  <div className={`text-2xl font-black ${activeMeanFill >= 80 ? 'text-red-600' : 'text-[#1B5E20]'}`}>
                    {activeMeanFill >= 0 ? `${activeMeanFill}%` : 'Insufficient Data'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 text-sm flex items-center">
                  <BarChart2 className="w-4 h-4 mr-1.5 text-[#1B5E20]" /> Fill Level History & Point Breakdown ({activeContainer.type})
                </h3>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activeContainer.points.map(p => ({ name: `Pt #${p.idx}`, fill: p.fillPct || 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#666" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="#666" fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="fill" stroke="#1B5E20" strokeWidth={3} dot={{ r: 5, fill: '#97BC62' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-sm text-[#0F2310] flex items-center">
                    {getHubDot(activeContainer.hubs.A.status)} Hub Node A
                  </h4>
                  <span className="text-xs font-semibold text-gray-500">{activeContainer.hubs.A.status.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div className="text-[10px] text-gray-500">{t.battery}</div>
                    <div className="font-bold text-sm text-[#1B5E20]">{activeContainer.hubs.A.batteryMv} mV</div>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div className="text-[10px] text-gray-500">RSSI</div>
                    <div className="font-bold text-sm text-gray-700">{activeContainer.hubs.A.rssi} dBm</div>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div className="text-[10px] text-gray-500">Heartbeat</div>
                    <div className="font-bold text-xs text-green-600">Just now</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-sm text-[#0F2310] flex items-center">
                    {getHubDot(activeContainer.hubs.B.status)} Hub Node B
                  </h4>
                  <span className={`text-xs font-semibold ${activeContainer.hubs.B.status === 'silent' ? 'text-red-600 animate-pulse font-bold' : 'text-gray-500'}`}>
                    {activeContainer.hubs.B.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div className="text-[10px] text-gray-500">{t.battery}</div>
                    <div className="font-bold text-sm text-[#1B5E20]">{activeContainer.hubs.B.batteryMv} mV</div>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div className="text-[10px] text-gray-500">RSSI</div>
                    <div className="font-bold text-sm text-gray-700">{activeContainer.hubs.B.rssi} dBm</div>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div className="text-[10px] text-gray-500">Heartbeat</div>
                    <div className={`font-bold text-xs ${activeContainer.hubs.B.status === 'silent' ? 'text-red-500' : 'text-green-600'}`}>
                      {activeContainer.hubs.B.status === 'silent' ? '>25h ago' : 'Just now'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-800 text-base flex items-center">
                  <ShieldAlert className="w-5 h-5 mr-2 text-red-600" /> Active System Alerts & Notifications
                </h2>
                <span className="text-xs bg-red-50 text-red-700 font-semibold px-2.5 py-1 rounded-full border border-red-200">
                  {alerts.filter(a => a.status === 'new').length} Unacknowledged
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider">
                      <th className="p-3">Time</th>
                      <th className="p-3">Container ID</th>
                      <th className="p-3">Alert Type</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {alerts.map(alert => (
                      <tr key={alert.id} className="hover:bg-gray-50 transition">
                        <td className="p-3 text-gray-500 font-medium">{alert.time}</td>
                        <td className="p-3 font-bold text-[#0F2310]">{alert.containerId}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                            alert.type === 'fill_high' ? 'bg-red-100 text-red-800' :
                            alert.type === 'hub_silent' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`font-semibold ${alert.status === 'new' ? 'text-red-600' : 'text-green-600'}`}>
                            {alert.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {alert.status === 'new' ? (
                            <button 
                              onClick={() => setAlerts(alerts.map(a => a.id === alert.id ? { ...a, status: 'acknowledged' } : a))}
                              className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white px-3 py-1 rounded text-[11px] font-bold transition shadow-xs"
                            >
                              {t.ack}
                            </button>
                          ) : (
                            <span className="text-gray-400 flex items-center justify-end font-medium">
                              <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-600" /> Acknowledged
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'utilization' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200">
                <div className="text-xs text-gray-500 font-medium">{t.idleDays}</div>
                <div className="text-2xl font-black text-[#0F2310] mt-1">7.3 Days</div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200">
                <div className="text-xs text-gray-500 font-medium">{t.turnaround}</div>
                <div className="text-2xl font-black text-[#0F2310] mt-1">4.2 Days</div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200">
                <div className="text-xs text-gray-500 font-medium">{t.fullUncollected}</div>
                <div className="text-2xl font-black text-red-600 mt-1">2 Containers</div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200">
                <div className="text-xs text-gray-500 font-medium">{t.idleEmpty}</div>
                <div className="text-2xl font-black text-amber-600 mt-1">1 Container</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200">
              <h3 className="font-bold text-gray-800 text-sm mb-4">Days on Site per Container</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={containers.map(c => ({ id: c.id, days: c.daysOnSite }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="id" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="days" fill="#1B5E20" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center text-xs text-gray-500">
        Sensifies Pilot Dashboard · Clean R Project Specification 1.0
      </footer>
    </div>
  );
}