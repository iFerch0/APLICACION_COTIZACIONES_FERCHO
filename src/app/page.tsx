export const dynamic = "force-dynamic";

import { getDashboardStats } from "@/app/actions/dashboard";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function HomePage() {
  const stats = await getDashboardStats();
  return <DashboardClient stats={stats} />;
}
