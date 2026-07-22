// Shared container data + types. Kept in a plain (non-"use client") module so
// both the client dashboard (app/page.tsx) and the server route
// (app/container/[id]/page.tsx) can import it.

export interface HubStatus {
  online: boolean;
  battery: number; // percent
  signal: number; // dBm (negative; closer to 0 is stronger)
  firmware: string;
  lastSeen: string; // human-readable, e.g. "12s ago"
}

export interface ContainerItem {
  id: string;
  type: string;
  fill: number;
  hubs: { a: HubStatus; b: HubStatus };
  days: number;
  coords: [number, number];
  status: "normal" | "warning" | "critical";
  temperature: number; // °C
  lastEmptied: string; // human-readable, e.g. "8d ago"
  address: string;
  fillHistory: number[]; // recent fill readings, oldest → newest (for sparkline)
}

// Synthesize a believable recent fill trend ramping up to the current value.
function trend(current: number): number[] {
  return Array.from({ length: 8 }, (_, i) => Math.round(current * (0.55 + 0.45 * (i / 7))));
}

export const INITIAL_CONTAINERS: ContainerItem[] = [
  {
    id: "KC8U-003", type: "KC-8U", fill: 2, days: 8, coords: [56.9520, 24.1000], status: "normal",
    hubs: {
      a: { online: true, battery: 94, signal: -58, firmware: "2.4.1", lastSeen: "8s ago" },
      b: { online: true, battery: 91, signal: -61, firmware: "2.4.1", lastSeen: "11s ago" },
    },
    temperature: 14.2, lastEmptied: "8d ago", address: "Brīvības iela 214, Rīga", fillHistory: trend(2),
  },
  {
    id: "KC8U-001", type: "KC-8U", fill: 46, days: 4, coords: [56.9500, 24.1080], status: "normal",
    hubs: {
      a: { online: true, battery: 88, signal: -63, firmware: "2.4.1", lastSeen: "5s ago" },
      b: { online: true, battery: 85, signal: -67, firmware: "2.4.1", lastSeen: "9s ago" },
    },
    temperature: 17.8, lastEmptied: "4d ago", address: "Krasta iela 68, Rīga", fillHistory: trend(46),
  },
  {
    id: "KC8U-002", type: "KC-8U", fill: 50, days: 6, coords: [56.9470, 24.1150], status: "warning",
    hubs: {
      a: { online: true, battery: 72, signal: -71, firmware: "2.4.1", lastSeen: "14s ago" },
      b: { online: false, battery: 39, signal: -89, firmware: "2.3.9", lastSeen: "2h 12m ago" },
    },
    temperature: 21.4, lastEmptied: "6d ago", address: "Maskavas iela 240, Rīga", fillHistory: trend(50),
  },
  {
    id: "K15-001", type: "K-15", fill: 83, days: 9, coords: [56.9430, 24.0950], status: "critical",
    hubs: {
      a: { online: true, battery: 66, signal: -74, firmware: "2.4.1", lastSeen: "7s ago" },
      b: { online: false, battery: 18, signal: -93, firmware: "2.3.9", lastSeen: "1d 3h ago" },
    },
    temperature: 24.9, lastEmptied: "9d ago", address: "Lāčplēša iela 125, Rīga", fillHistory: trend(83),
  },
  {
    id: "K15-002", type: "K-15", fill: 43, days: 5, coords: [56.9450, 24.1050], status: "normal",
    hubs: {
      a: { online: true, battery: 90, signal: -60, firmware: "2.4.1", lastSeen: "3s ago" },
      b: { online: true, battery: 87, signal: -64, firmware: "2.4.1", lastSeen: "6s ago" },
    },
    temperature: 16.5, lastEmptied: "5d ago", address: "Čaka iela 88, Rīga", fillHistory: trend(43),
  },
  {
    id: "K15-003", type: "K-15", fill: 93, days: 12, coords: [56.9410, 24.1200], status: "critical",
    hubs: {
      a: { online: true, battery: 58, signal: -76, firmware: "2.4.1", lastSeen: "10s ago" },
      b: { online: true, battery: 54, signal: -79, firmware: "2.4.1", lastSeen: "15s ago" },
    },
    temperature: 27.3, lastEmptied: "12d ago", address: "Katrīnas dambis 17, Rīga", fillHistory: trend(93),
  },
];

export function getContainer(id: string): ContainerItem | undefined {
  return INITIAL_CONTAINERS.find((c) => c.id === id);
}
