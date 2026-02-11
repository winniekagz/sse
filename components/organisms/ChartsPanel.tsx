"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LinePoint, OutcomePoint } from "@/lib/state/dashboardReducer";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTooltip,
  Filler,
);

type ChartsPanelProps = {
  lineSeries: LinePoint[];
  outcomeSeries: OutcomePoint[];
};

export function ChartsPanel({ lineSeries, outcomeSeries }: ChartsPanelProps) {
  const lineData = {
    labels: lineSeries.map((point) => point.label),
    datasets: [
      {
        label: "Orders/min",
        data: lineSeries.map((point) => point.count),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        tension: 0.35,
        fill: true,
      },
    ],
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm text-slate-700">
            Orders per minute (rolling window)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Line
            data={lineData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { maxTicksLimit: 6 }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { maxTicksLimit: 5 } },
              },
            }}
            height={220}
          />
        </CardContent>
      </Card>
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm text-slate-700">
            Success vs failure
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={outcomeSeries}>
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip cursor={{ fill: "rgba(15, 23, 42, 0.06)" }} />
              <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
