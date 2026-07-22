"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import type { ContainerItem } from "./data";

// Solid marker colour driven by fill level (matches the table / details palette).
function fillColor(fill: number): string {
  if (fill > 90) return "bg-rose-600";
  if (fill > 50) return "bg-amber-500";
  return "bg-emerald-600";
}

// Render each container as a colour-coded rectangular label showing its id,
// instead of Leaflet's default teardrop pin. `className: ""` drops Leaflet's
// default white `.leaflet-div-icon` box so only our styled rectangle shows.
function labelIcon(item: ContainerItem): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div class="w-[72px] px-1.5 py-1 rounded-md shadow-md border border-white/40 text-white text-[11px] font-bold text-center leading-none ${fillColor(item.fill)}">${item.id}</div>`,
    iconSize: [72, 22],
    iconAnchor: [36, 11],
    popupAnchor: [0, -12],
  });
}

interface FleetMapProps {
  containers: ContainerItem[];
  fillLabel: string;
  daysLabel: string;
  center?: [number, number];
  zoom?: number;
  detailsLabel?: string;
}

export default function FleetMap({ containers, fillLabel, daysLabel, center, zoom, detailsLabel }: FleetMapProps) {
  return (
    <MapContainer center={center ?? [56.9496, 24.1052]} zoom={zoom ?? 13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {containers.map((item) => (
        <Marker key={item.id} position={item.coords} icon={labelIcon(item)}>
          <Popup>
            <div className="p-1 space-y-1">
              <p className="font-bold text-sm text-slate-900">{item.id} ({item.type})</p>
              <p className="text-xs text-slate-600">{fillLabel} <span className="font-semibold">{item.fill}%</span></p>
              <p className="text-xs text-slate-600">{daysLabel} {item.days}d</p>
              <Link href={`/container/${item.id}`} className="inline-block text-xs font-semibold text-emerald-600 hover:underline pt-1">
                {detailsLabel ?? "View details"} →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
