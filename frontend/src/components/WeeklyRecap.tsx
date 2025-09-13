// src/components/WeeklyRecap.tsx
import { Card } from "@/components/ui/card";
import { Moon, Smile, Target, HeartPulse, Edit } from "lucide-react";
import { useMemo } from "react";

type DayStat = {
  label: string;       // Mon, Tue...
  sleepH: number;      // hours slept
  mood: number;        // 1..5
  productivity: number;// 0..10
  health: number;      // 0..100 (readiness/health score)
};

// TODO: swap to real data later
const MOCK_WEEK: DayStat[] = [
  { label: "Mon", sleepH: 7.2, mood: 3, productivity: 6.5, health: 72 },
  { label: "Tue", sleepH: 6.5, mood: 4, productivity: 7.2, health: 74 },
  { label: "Wed", sleepH: 8.0, mood: 4, productivity: 8.3, health: 80 },
  { label: "Thu", sleepH: 7.8, mood: 3, productivity: 6.1, health: 76 },
  { label: "Fri", sleepH: 5.9, mood: 2, productivity: 5.2, health: 68 },
  { label: "Sat", sleepH: 7.1, mood: 4, productivity: 7.8, health: 83 },
  { label: "Sun", sleepH: 7.6, mood: 5, productivity: 8.8, health: 85 },
];

function Bars({
  values,
  labels,
  max,
  className = "bg-primary/60",
  height = 72,
  tooltipUnit = "",
}: {
  values: number[];
  labels: string[];
  max: number;
  className?: string;
  height?: number;
  tooltipUnit?: string;
}) {
  return (
    <div className="w-full">
      <div className="flex items-end gap-2" style={{ height }}>
        {values.map((v, i) => {
          const h = Math.max(4, (v / max) * height); // tiny minimum for visibility
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`w-3 rounded-md ${className}`}
                style={{ height: h }}
                title={`${labels[i]} — ${v}${tooltipUnit}`}
              />
              <span className="text-[10px] text-muted-foreground">{labels[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WeeklyRecap() {
  const week = MOCK_WEEK;
  const labels = week.map(d => d.label);

  const avg = <T extends keyof DayStat>(k: T, digits = 1) =>
    +(
      week.reduce((a, b) => a + (b[k] as unknown as number), 0) / week.length
    ).toFixed(digits);

  const avgSleep = avg("sleepH");
  const avgMood = avg("mood");
  const avgProd = avg("productivity");
  const avgHealth = avg("health", 0);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Sleep */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-indigo-500" />
            <h3 className="font-semibold">Sleep (hours)</h3>
          </div>
          <span className="text-sm text-muted-foreground">avg {avgSleep}h</span>
        </div>
        <Bars
          values={week.map(d => d.sleepH)}
          labels={labels}
          max={9}
          className="bg-indigo-400/70"
          height={72}
          tooltipUnit="h"
        />
      </Card>

      {/* Mood */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smile className="h-4 w-4 text-rose-500" />
            <h3 className="font-semibold">Mood (1–5)</h3>
          </div>
          <span className="text-sm text-muted-foreground">avg {avgMood}</span>
        </div>
        <Bars
          values={week.map(d => d.mood)}
          labels={labels}
          max={5}
          className="bg-rose-400/70"
          height={72}
        />
      </Card>

      {/* Productivity */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-500" />
            <h3 className="font-semibold">Productivity (0–10)</h3>
          </div>
          <span className="text-sm text-muted-foreground">avg {avgProd}</span>
        </div>
        <Bars
          values={week.map(d => d.productivity)}
          labels={labels}
          max={10}
          className="bg-amber-400/70"
          height={72}
        />
      </Card>

      {/* Health */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-emerald-500" />
            <h3 className="font-semibold">Health score (0–100)</h3>
          </div>
          <span className="text-sm text-muted-foreground">avg {avgHealth}</span>
        </div>
        <Bars
          values={week.map(d => d.health)}
          labels={labels}
          max={100}
          className="bg-emerald-400/70"
          height={72}
        />
      </Card>
    </div>
  );
}
