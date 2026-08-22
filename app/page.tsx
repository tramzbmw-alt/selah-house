import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import StatsRow from "@/components/StatsRow";
import UnpaidBillsAlert from "@/components/UnpaidBillsAlert";
import OccupancyCalendar from "@/components/OccupancyCalendar";
import MaintenanceCard from "@/components/MaintenanceCard";

export default function Dashboard() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />

      <div
        className="flex flex-col flex-1 min-w-0 overflow-hidden"
        style={{ background: "#f5f4f1" }}
      >
        <div style={{ height: 3, background: "#3b9e95", flexShrink: 0 }} />
        <Topbar />

        <main
          className="flex-1 flex flex-col gap-4"
          style={{ background: "#f5f4f1", padding: "24px", overflow: "hidden", overflowY: "auto", boxSizing: "border-box" }}
        >
          <StatsRow />
          <UnpaidBillsAlert />
          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
            <OccupancyCalendar />
            <MaintenanceCard />
          </div>
        </main>
      </div>
    </div>
  );
}
