"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type ButtonProps = {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className">;

/** Kilau halus yang menyapu tombol saat hover. */
const KILAU = "relative overflow-hidden before:pointer-events-none before:absolute before:inset-y-0 before:-left-1/2 before:w-1/3 before:-skew-x-12 before:bg-white/30 before:opacity-0 before:transition-all before:duration-700 hover:before:left-[130%] hover:before:opacity-100 motion-reduce:before:hidden";

const variants = {
  primary: `${KILAU} bg-gradient-to-r from-secondary to-[#2F7BE0] text-white shadow-md shadow-secondary/25 hover:from-[#1A52AD] hover:to-secondary hover:shadow-lg hover:shadow-secondary/30`,
  secondary: `${KILAU} bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-secondary/30`,
  outline: "border-2 border-slate-200 bg-white text-slate-700 hover:border-secondary hover:text-secondary hover:shadow-md",
  danger: "bg-red-600 text-white shadow-md shadow-red-600/20 hover:bg-red-700 hover:shadow-lg",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-navy",
};

const sizes = {
  sm: "h-9 px-3.5 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  href,
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-[10px] font-bold tracking-tight transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0 ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return <Link href={href} className={classes} {...props} />;
  }

  return <button className={classes} {...props} />;
}