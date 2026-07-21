"use client";

import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: StatsCardProps) {
  return (
    <div className="group rounded-3xl bg-white border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6">

      <div className="flex justify-between items-start">

        <div>

          <p className="text-slate-500 text-sm">
            {title}
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {value}
          </h2>

          {subtitle && (
            <p className="text-green-600 text-sm mt-4">
              {subtitle}
            </p>
          )}

        </div>

        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center ${color}`}
        >
          <Icon className="text-white" size={30} />
        </div>

      </div>

    </div>
  );
}