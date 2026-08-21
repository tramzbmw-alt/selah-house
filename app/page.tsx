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

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ background: "#f4f3f0" }}>
        <div style={{ height: 3, background: "#3b9e95", flexShrink: 0 }} />
        <Topbar />

        <main
          className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-4"
          style={{ padding: '24px' }}
        >
          <StatsRow />
          <HouseFacts />
          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
            <OccupancyCalendar />
            <MaintenanceCard />
          </div>
        </main>
      </div>
    </div>
  );
}
