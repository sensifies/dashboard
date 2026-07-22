"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ContainerItem } from "./page";

// Hex equivalents of the fill-level palette used across the dashboard.
const EMERALD = "#059669";
const AMBER = "#f59e0b";
const ROSE = "#e11d48";

function fillHex(fill: number): string {
  if (fill > 90) return ROSE;
  if (fill > 50) return AMBER;
  return EMERALD;
}

// Line colours cycled per container so each series is distinguishable.
const LINE_PALETTE = ["#059669", "#e11d48", "#f59e0b", "#0ea5e9", "#8b5cf6", "#0f766e"];

interface LoadChartsProps {
  containers: ContainerItem[];
  labels: {
    currentFill: string;
    overTime: string;
    byStatus: string;
    byType: string;
    normal: string;
    warning: string;
    critical: string;
  };
}

const cardClass = "bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col";
const titleClass = "text-xs font-bold text-slate-700 tracking-wider uppercase mb-4";

export default function LoadCharts({ containers, labels }: LoadChartsProps) {
  // Current fill per container.
  const fillData = containers.map((c) => ({ id: c.id, fill: c.fill }));

  // Synthesized 6-hour history: the mock data has no time dimension, so each
  // container's fill is ramped up toward its current value for the demo.
  const HOURS = 6;
  const timeData = Array.from({ length: HOURS + 1 }, (_, i) => {
    const point: Record<string, number | string> = { time: i === HOURS ? "now" : `-${HOURS - i}h` };
    containers.forEach((c) => {
      point[c.id] = Math.round(c.fill * (0.45 + 0.55 * (i / HOURS)));
    });
    return point;
  });

  // Count by status for the donut.
  const statusData = [
    { name: labels.normal, value: containers.filter((c) => c.status === "normal").length, color: EMERALD },
    { name: labels.warning, value: containers.filter((c) => c.status === "warning").length, color: AMBER },
    { name: labels.critical, value: containers.filter((c) => c.status === "critical").length, color: ROSE },
  ].filter((d) => d.value > 0);

  // Average fill grouped by container type.
  const types = Array.from(new Set(containers.map((c) => c.type)));
  const typeData = types.map((tp) => {
    const items = containers.filter((c) => c.type === tp);
    const avg = Math.round(items.reduce((s, c) => s + c.fill, 0) / items.length);
    return { type: tp, avg };
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Current fill per container */}
      <div className={cardClass}>
        <h3 className={titleClass}>{labels.currentFill}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fillData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="id" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={50} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={(v) => [`${v}%`, "Fill"]} />
              <Bar dataKey="fill" radius={[3, 3, 0, 0]}>
                {fillData.map((d) => (
                  <Cell key={d.id} fill={fillHex(d.fill)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fill over time */}
      <div className={cardClass}>
        <h3 className={titleClass}>{labels.overTime}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {containers.map((c, i) => (
                <Line
                  key={c.id}
                  type="monotone"
                  dataKey={c.id}
                  stroke={LINE_PALETTE[i % LINE_PALETTE.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Containers by status */}
      <div className={cardClass}>
        <h3 className={titleClass}>{labels.byStatus}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {statusData.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Average fill by type */}
      <div className={cardClass}>
        <h3 className={titleClass}>{labels.byType}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="type" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={(v) => [`${v}%`, "Avg"]} />
              <Bar dataKey="avg" fill="#0f766e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
