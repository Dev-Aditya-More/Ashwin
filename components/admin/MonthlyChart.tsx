"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/format";

type Point = { month: string; revenue: number; labour: number; vendor: number };

export function MonthlyChart({ data }: { data: Point[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke="var(--text-muted)"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke="var(--text-muted)"
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            width={40}
          />
          <Tooltip
            formatter={(value) => formatMoney(Number(value))}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              fontSize: 12,
            }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) =>
              value === "revenue" ? "Revenue" : value === "labour" ? "Labour Cost" : "Vendor Cost"
            }
          />
          <Bar dataKey="revenue" fill="#16a34a" radius={[3, 3, 0, 0]} maxBarSize={14} />
          <Bar dataKey="labour" fill="#d97706" radius={[3, 3, 0, 0]} maxBarSize={14} />
          <Bar dataKey="vendor" fill="#dc2626" radius={[3, 3, 0, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
