"use client";

import type { ReactNode } from "react";

type DashboardLayoutProps = {
  header: ReactNode;
  main: ReactNode;
  sidebar: ReactNode;
};

export function DashboardLayout({ header, main, sidebar }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(900px_circle_at_top,_#1f2937,_#0f172a_70%)]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 lg:px-6">
        {header}
        <div className="grid gap-6 lg:grid-cols-[2.1fr_1fr]">
          <div className="space-y-6">{main}</div>
          <aside className="space-y-6">{sidebar}</aside>
        </div>
      </div>
    </div>
  );
}
