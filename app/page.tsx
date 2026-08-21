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

      <div className="flex flex-col flex-1 min-w-0" style={{ background: "#f5f4f1" }}>
        {/* Teal door accent */}
        <div style={{ height: 3, background: "#3b9e95", flexShrink: 0 }} />

        <Topbar />

        <main className="flex flex-col gap-[1.25rem] p-[1.5rem_1.75rem] flex-1 overflow-y-auto">
          <StatsRow />
          <HouseFacts />
          <div className="grid grid-cols-2 gap-[1.25rem]">
            <OccupancyCalendar />
            <MaintenanceCard />
          </div>
        </main>
      </div>
    </div>
  );
}
