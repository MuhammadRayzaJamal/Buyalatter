import { Award, Medal, CreditCard, Star, Trophy, Wallet, BadgePercent, Banknote, BellRing, CalendarDays, CalendarRange, Clock, Eye, Flag, GraduationCap, HeartHandshake, Landmark, Lightbulb, PiggyBank, Rocket, ShieldCheck, Smartphone, Store, TrendingUp, Users, Zap, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "piggy-bank": PiggyBank, banknote: Banknote, shield: ShieldCheck, users: Users, trending: TrendingUp, clock: Clock, bank: Landmark, calendar: CalendarDays,
  zap: Zap, percent: BadgePercent, "calendar-range": CalendarRange, bell: BellRing, "heart-handshake": HeartHandshake, rocket: Rocket, flag: Flag,
  smartphone: Smartphone, award: Award, trophy: Trophy, medal: Medal, "credit-card": CreditCard, wallet: Wallet, star: Star, eye: Eye, lightbulb: Lightbulb, "graduation-cap": GraduationCap, store: Store,
};

/** Ikon dari kunci teks di database; kunci tak dikenal jatuh ke ikon bintang-tonggak (Flag). */
export function DynamicIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Flag;
  return <Icon aria-hidden className={className} />;
}
