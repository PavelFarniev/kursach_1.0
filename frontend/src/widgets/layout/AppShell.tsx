import { Outlet } from "react-router-dom";

import { UnifiedHeader } from "@/widgets/layout/UnifiedHeader";

export function AppShell(): JSX.Element {
  return (
    <div className="min-h-screen">
      <UnifiedHeader />

      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
}
