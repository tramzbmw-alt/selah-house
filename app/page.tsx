import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import StatsRow from "@/components/StatsRow";
import HouseFacts from "@/components/HouseFacts";
import OccupancyCalendar from "@/components/OccupancyCalendar";
import MaintenanceCard from "@/components/MaintenanceCard";

export default function Dashboard() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />

      {/* Right panel — must not allow horizontal overflow */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ background: "#f4f3f0" }}>
        {/* Teal accent line */}
        <div style={{ height: 3, background: "#3b9e95", flexShrink: 0 }} />

        <Topbar />

        {/* Scrollable content — 24px padding on all sides, no horizontal bleed */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 flex flex-col gap-5">
          <StatsRow />
          <HouseFacts />
          <div className="grid grid-cols-2 gap-5 flex-1 min-h-0">
            <OccupancyCalendar />
            <MaintenanceCard />
          </div>
        </main>
      </div>
    </div>
  );
}
