import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import StatsRow from "@/components/StatsRow";
import HouseFacts from "@/components/HouseFacts";
import OccupancyCalendar from "@/components/OccupancyCalendar";
import MaintenanceCard from "@/components/MaintenanceCard";

export default function Dashboard() {
  return (
    <div
      className="min-h-screen flex items-start justify-center p-8"
      style={{ background: "#eeece8" }}
    >
      <div
        className="grid w-full overflow-hidden"
        style={{
          gridTemplateColumns: "230px 1fr",
          maxWidth: 1100,
          minHeight: 700,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 4px 32px rgba(0,0,0,0.12)",
          border: "1px solid rgba(228,226,220,0.6)",
        }}
      >
        <Sidebar />

        <div className="flex flex-col" style={{ background: "#f5f4f1" }}>
          {/* Teal door accent */}
          <div style={{ height: 3, background: "#3b9e95" }} />

          <Topbar />

          <main className="flex flex-col gap-[1.25rem] p-[1.5rem_1.75rem] flex-1">
            <StatsRow />
            <HouseFacts />
            <div className="grid grid-cols-2 gap-[1.25rem]">
              <OccupancyCalendar />
              <MaintenanceCard />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
