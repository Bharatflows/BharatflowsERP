import { useState, useEffect } from "react";
import { hrService } from "../../services/modules.service";
import { PaymentMethodCard } from "./dashboard/PaymentMethodCard";
import { UpcomingEventsCard } from "./dashboard/UpcomingEventsCard";
import { TodayScheduleCard } from "./dashboard/TodayScheduleCard";
import { EmployeeRequestCard } from "./dashboard/EmployeeRequestCard";

interface HRDashboardProps {
  onViewEmployees: () => void;
  onViewAttendance: () => void;
}

export function HRDashboard({ onViewEmployees, onViewAttendance }: HRDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await hrService.getDashboardStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (e) {
        console.error('Failed to load dashboard stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  // Use recent leaves for the Employee Cards section, or fallback to demo data if empty
  const requestCards = stats?.recentLeaves?.length > 0 ? stats.recentLeaves : [
    { id: 1, employee: { name: "Floyd Miles", designation: "General Manager", email: "floyd@example.com", phone: "+1 234 567 890", avatar: "https://i.pravatar.cc/150?u=4" }, type: "Sick Leave" },
    { id: 2, employee: { name: "Robert Fox", designation: "UI Designer", email: "robert@example.com", phone: "+1 987 654 321", avatar: "https://i.pravatar.cc/150?u=5" }, type: "Annual Leave" },
    { id: 3, employee: { name: "Leslie Alexander", designation: "Product Manager", email: "leslie@example.com", phone: "+1 555 123 456", avatar: "https://i.pravatar.cc/150?u=6" }, type: "Remote Work" },
    { id: 4, employee: { name: "Esther Howard", designation: "Frontend Dev", email: "esther@example.com", phone: "+1 444 777 888", avatar: "https://i.pravatar.cc/150?u=7" }, type: "Sick Leave" },
  ];

  return (
    <div className="space-y-6 pt-2">
      {/* Top Row: Payment & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[340px]">
        <div className="lg:col-span-1 h-full">
          <PaymentMethodCard />
        </div>
        <div className="lg:col-span-2 h-full">
          <UpcomingEventsCard />
        </div>
      </div>

      {/* Middle Row: Schedule */}
      <div className="w-full">
        <TodayScheduleCard />
      </div>

      {/* Bottom Section: Employee Requests */}
      <div>
        <h3 className="text-lg font-bold mb-4">Employee Requests</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {requestCards.map((req: any) => (
            <EmployeeRequestCard
              key={req.id}
              name={req.employee?.name || "Unknown"}
              role={req.employee?.designation || "Employee"}
              email={req.employee?.email || "email@company.com"}
              phone={req.employee?.phone || "+91 98765 43210"}
              department={req.employee?.department || "General"}
              avatar={req.employee?.avatar || `https://ui-avatars.com/api/?name=${req.employee?.name}&background=random`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
