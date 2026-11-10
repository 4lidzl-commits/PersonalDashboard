import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";

export type WxTheme = {
  icon: LucideIcon;
  /** kartın degrade arka planı */
  grad: string;
  /** degrade üstüne parlama efekti */
  glow: string;
};

export function wxIcon(code: number, isDay: boolean): LucideIcon {
  if (code === 0) return isDay ? Sun : Moon;
  if (code === 1 || code === 2) return isDay ? CloudSun : CloudMoon;
  if (code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if (code >= 51 && code <= 57) return CloudDrizzle;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return CloudRain;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return CloudSnow;
  if (code >= 95) return CloudLightning;
  return Cloud;
}

export function wxTheme(code: number, isDay: boolean): WxTheme {
  const icon = wxIcon(code, isDay);
  if (code === 0 || code === 1) {
    return isDay
      ? {
          icon,
          grad: "from-[#2B62C9] via-[#4A8AE0] to-[#7FC0F2]",
          glow: "bg-[radial-gradient(circle_at_75%_15%,rgba(255,224,130,0.55),transparent_55%)]",
        }
      : {
          icon,
          grad: "from-[#0C1230] via-[#18234E] to-[#2C3A66]",
          glow: "bg-[radial-gradient(circle_at_78%_12%,rgba(190,205,255,0.28),transparent_50%)]",
        };
  }
  if (code === 2 || code === 3) {
    return isDay
      ? {
          icon,
          grad: "from-[#3A5570] via-[#52708C] to-[#7E97AF]",
          glow: "bg-[radial-gradient(circle_at_74%_14%,rgba(255,255,255,0.25),transparent_55%)]",
        }
      : {
          icon,
          grad: "from-[#141A28] via-[#232E42] to-[#37445C]",
          glow: "bg-[radial-gradient(circle_at_74%_14%,rgba(160,180,220,0.18),transparent_55%)]",
        };
  }
  if (code === 45 || code === 48) {
    return {
      icon,
      grad: "from-[#3D4653] via-[#5A6572] to-[#828D98]",
      glow: "bg-[radial-gradient(circle_at_70%_12%,rgba(220,228,235,0.2),transparent_55%)]",
    };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      icon,
      grad: "from-[#202A3C] via-[#33445C] to-[#54677F]",
      glow: "bg-[radial-gradient(circle_at_72%_10%,rgba(120,170,255,0.22),transparent_55%)]",
    };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return {
      icon,
      grad: "from-[#40597A] via-[#5F7FA4] to-[#93B3D0]",
      glow: "bg-[radial-gradient(circle_at_72%_12%,rgba(255,255,255,0.32),transparent_55%)]",
    };
  }
  if (code >= 95) {
    return {
      icon,
      grad: "from-[#1B2130] via-[#2B3450] to-[#46536E]",
      glow: "bg-[radial-gradient(circle_at_72%_10%,rgba(150,140,255,0.28),transparent_55%)]",
    };
  }
  return {
    icon,
    grad: "from-[#33445C] via-[#4A6076] to-[#6E8296]",
    glow: "bg-[radial-gradient(circle_at_72%_12%,rgba(255,255,255,0.2),transparent_55%)]",
  };
}
