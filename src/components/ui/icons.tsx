import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function IconGrid(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 20c0-3.31 2.46-5.5 5.5-5.5s5.5 2.19 5.5 5.5" />
      <path d="M15.5 4.7a3.25 3.25 0 0 1 0 6.3" />
      <path d="M16 14.7c2.6.4 4.5 2.4 4.5 5.3" />
    </svg>
  );
}

export function IconPiggyBank(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12.5c0-3.6 3.2-6.5 8-6.5s8 2.6 8 6c0 1.4-.6 2.6-1.6 3.5V18a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-.6a13 13 0 0 1-4.8 0V18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2.2A5.6 5.6 0 0 1 4 12.5Z" />
      <path d="M17.5 10.5 20 9" />
      <path d="M8.5 7 7.2 4.6" />
      <circle cx="15" cy="11.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconArrowDownCircle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v7" />
      <path d="M8.75 12.25 12 15.5l3.25-3.25" />
    </svg>
  );
}

export function IconBanknote(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="6.5" width="18" height="11" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6.5 9v.01" />
      <path d="M17.5 15v.01" />
    </svg>
  );
}

export function IconCalendarCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3" />
      <path d="M16 3v3" />
      <path d="M9 14.5l2 2 4-4" />
    </svg>
  );
}

export function IconImage(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.75" />
      <path d="M4.5 17.5 9.5 13l3 2.5L17 11l3 3.5" />
    </svg>
  );
}

export function IconNewspaper(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 5h11a2 2 0 0 1 2 2v11.5a1.5 1.5 0 0 1-3 0" />
      <path d="M15 18.5H6.5A1.5 1.5 0 0 1 5 17V5" />
      <path d="M8 9h5" />
      <path d="M8 12.5h5" />
      <path d="M8 16h3" />
    </svg>
  );
}

export function IconMail(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4.5 7 12 12.5 19.5 7" />
    </svg>
  );
}

export function IconBarChart(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20V10.5" />
      <path d="M12 20V4" />
      <path d="M20 20v-7" />
      <path d="M3 20h18" />
    </svg>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.1M12 18.4v2.1M20.5 12h-2.1M5.6 12H3.5M17.8 6.2l-1.5 1.5M7.7 16.3l-1.5 1.5M17.8 17.8l-1.5-1.5M7.7 7.7 6.2 6.2" />
    </svg>
  );
}

export function IconUserCircle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="10" r="2.75" />
      <path d="M6.5 18.2c.9-2.3 3-3.4 5.5-3.4s4.6 1.1 5.5 3.4" />
    </svg>
  );
}

export function IconHistory(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 9.5A8 8 0 1 1 4 13" />
      <path d="M4.5 4.5v4.6H9" />
      <path d="M12 8.5V12l2.5 1.5" />
    </svg>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6.5h16" />
      <path d="M4 12h16" />
      <path d="M4 17.5h16" />
    </svg>
  );
}

export function IconX(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5.5 5.5l13 13" />
      <path d="M18.5 5.5l-13 13" />
    </svg>
  );
}

export function IconLogOut(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 4.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 19.5h3" />
      <path d="M13.5 15.5 18 12l-4.5-3.5" />
      <path d="M18 12H9" />
    </svg>
  );
}

export function IconTrendingUp(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 16 9 10.5l3.5 3.5L20.5 6" />
      <path d="M15 6h5.5v5.5" />
    </svg>
  );
}

export function IconBell(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function IconChevronsLeft(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m11 17-5-5 5-5" />
      <path d="m18 17-5-5 5-5" />
    </svg>
  );
}

export function IconChevronsRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 17 5-5-5-5" />
      <path d="m13 17 5-5-5-5" />
    </svg>
  );
}

export function IconStar(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
    </svg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconShieldCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5 19.5 6.5V11c0 4.5-3 7.8-7.5 9.5C7.5 18.8 4.5 15.5 4.5 11V6.5L12 3.5Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function IconBank(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 9.5 12 4l8.5 5.5" />
      <path d="M4.5 9.5h15V19a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V9.5Z" />
      <path d="M9 13v4" />
      <path d="M15 13v4" />
      <path d="M3.5 20.5h17" />
    </svg>
  );
}

export function IconSend(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20.5 3.5 3 10.5l7 3 3 7 7.5-17Z" />
      <path d="M10 13.5 20.5 3.5" />
    </svg>
  );
}

export function IconReceipt(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 3.5h12v17l-2.5-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 20.5Z" />
      <path d="M8.5 8h7" />
      <path d="M8.5 11.5h7" />
      <path d="M8.5 15h4.5" />
    </svg>
  );
}
