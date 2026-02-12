"use client";

import type { ReactNode } from "react";

type DashboardShellProps = {
  sidebar: ReactNode;
  topNav: ReactNode;
  children: ReactNode;
};

export function DashboardShell({ sidebar, topNav, children }: DashboardShellProps) {
  return (
    <div className="h-screen w-full overflow-hidden bg-[#f4f7f6] text-slate-800">
      <div className="grid h-full min-h-0 w-full overflow-hidden lg:grid-cols-[230px_1fr]">
        <aside className="h-full min-h-0 max-h-screen overflow-hidden border-r border-slate-200 bg-[#eef3f1] p-5">
          {sidebar}
        </aside>

        <main className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="sticky top-0 z-20 border-b border-slate-200 bg-[#f4f7f6] px-5 py-5 lg:px-7">
              {topNav}
            </div>
            <div className="px-5 pb-7 pt-5 lg:px-7">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
