import { useEffect, useState, ElementType } from "react";
import {
  Sun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudDrizzle, CloudFog,
} from "lucide-react";
import { fetchWeatherViaN8N, type WeatherKind } from "@/lib/weather";

type Glow = "soft" | "normal" | "strong";

type Props = {
  size?: number;         // px
  strokeWidth?: number;  // svg stroke width
  showCaption?: boolean;
  /** Force a specific icon (for demo/testing). If omitted, uses live weather. */
  overrideKind?: WeatherKind;
  /** Increase glow intensity. Default 'normal'. */
  glow?: Glow;
};

const IconByKind: Record<WeatherKind, ElementType> = {
  clear: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  thunder: CloudLightning,
  snow: CloudSnow,
  drizzle: CloudDrizzle,
  mist: CloudFog,
};

function styleByKind(kind?: WeatherKind, glow: Glow = "normal") {
  // helper to pick the glow class per intensity
  const g = (soft: string, normal: string, strong: string) =>
    glow === "soft" ? soft : glow === "strong" ? strong : normal;

  switch (kind) {
    case "thunder":
      return {
        color: "text-yellow-400/60",
        glow: g(
          "drop-shadow-[0_0_18px_rgba(250,204,21,0.28)]",
          "drop-shadow-[0_0_28px_rgba(250,204,21,0.35)]",
          "drop-shadow-[0_0_48px_rgba(250,204,21,0.55)]"
        ),
      };
    case "rain":
    case "drizzle":
      return {
        color: "text-blue-500/50",
        glow: g(
          "drop-shadow-[0_0_18px_rgba(59,130,246,0.24)]",
          "drop-shadow-[0_0_28px_rgba(59,130,246,0.30)]",
          "drop-shadow-[0_0_48px_rgba(59,130,246,0.50)]"
        ),
      };
    case "snow":
      return {
        color: "text-cyan-200/50",
        glow: g(
          "drop-shadow-[0_0_18px_rgba(34,211,238,0.24)]",
          "drop-shadow-[0_0_26px_rgba(34,211,238,0.30)]",
          "drop-shadow-[0_0_44px_rgba(34,211,238,0.50)]"
        ),
      };
    case "mist":
      return {
        color: "text-slate-400/60",
        glow: g(
          "drop-shadow-[0_0_16px_rgba(148,163,184,0.22)]",
          "drop-shadow-[0_0_22px_rgba(148,163,184,0.28)]",
          "drop-shadow-[0_0_40px_rgba(148,163,184,0.48)]"
        ),
      };
    case "cloudy":
      return {
        color: "text-slate-300/85",
        glow: g(
          "drop-shadow-[0_0_18px_rgba(148,163,184,0.22)]",
          "drop-shadow-[0_0_28px_rgba(148,163,184,0.35)]",
          "drop-shadow-[0_0_56px_rgba(148,163,184,0.60)]"
        ),
      };
    case "clear":
    default:
      return {
        color: "text-amber-400/60",
        glow: g(
          "drop-shadow-[0_0_18px_rgba(251,191,36,0.24)]",
          "drop-shadow-[0_0_28px_rgba(251,191,36,0.30)]",
          "drop-shadow-[0_0_48px_rgba(251,191,36,0.52)]"
        ),
      };
  }
}

export default function HeroWeather({
  size = 300,
  strokeWidth = 2,
  showCaption = false,
  overrideKind,
  glow = "normal",
}: Props) {
  const [data, setData] = useState<{ kind: WeatherKind; tempC: number; description: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (overrideKind) return; // skip fetch when forcing a kind
    fetchWeatherViaN8N()
      .then(w => setData({ kind: w.kind, tempC: w.tempC, description: w.description }))
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Weather unavailable"));
  }, [overrideKind]);

  const kind: WeatherKind = overrideKind ?? data?.kind ?? "clear";
  const Icon = IconByKind[kind];
  const s = styleByKind(kind, glow);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* OUTLINE-ONLY glyph */}
      <Icon
        strokeWidth={strokeWidth}
        className={`${s.color} ${s.glow}`}
        style={{ width: size, height: size }}
      />
      {showCaption && (
        <p className="text-sm text-muted-foreground">
          {err ? "Weather unavailable" : data ? `${data.tempC}°C • ${data.description}` : "Loading…"}
        </p>
      )}
    </div>
  );
}
