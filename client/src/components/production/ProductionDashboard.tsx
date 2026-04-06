import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Factory,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { productionService } from "@/services/modules.service";
import { chartColors } from "@/lib/chartColors";

interface ProductionDashboardProps {
  onViewWorkOrders: () => void;
  hideStats?: boolean;
}

interface DashboardData {
  kpis: {
    activeWorkOrders: number;
    monthlyProduction: number;
    completedThisMonth: number;
    pendingOrders: number;
    inProgressOrders: number;
    activeBOMs: number;
  };
  statusBreakdown: Record<string, number>;
  recentWorkOrders: {
    id: string;
    orderNumber: string;
    productName: string;
    plannedQty: number;
    completedQty: number;
    status: string;
    progress: number;
  }[];
  productionByMonth: Record<string, number>;
}

export function ProductionDashboard({ onViewWorkOrders, hideStats = false }: ProductionDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await productionService.getDashboard();
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load production dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const PRODUCTION_TARGET = 1500;

  // Transform production by month data for charts
  const productionData = data?.productionByMonth
    ? Object.entries(data.productionByMonth).map(([month, produced]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-IN", { month: "short" }),
      produced,
      target: PRODUCTION_TARGET,
    }))
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpis = data?.kpis || {
    activeWorkOrders: 0,
    monthlyProduction: 0,
    completedThisMonth: 0,
    pendingOrders: 0,
    inProgressOrders: 0,
    activeBOMs: 0,
  };

  const efficiency = kpis.monthlyProduction > 0 && productionData.length > 0
    ? ((kpis.monthlyProduction / PRODUCTION_TARGET) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {!hideStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Active Work Orders</CardDescription>
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Factory className="size-4 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground text-2xl font-bold">{kpis.activeWorkOrders}</p>
              <Button variant="link" className="p-0 h-auto mt-2" onClick={onViewWorkOrders}>
                View All <ArrowRight className="ml-1 size-3" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Monthly Production</CardDescription>
                <div className="bg-success/10 p-2 rounded-lg">
                  <Package className="size-4 text-success" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground text-2xl font-bold">{kpis.monthlyProduction.toLocaleString("en-IN")} units</p>
              <p className="text-muted-foreground mt-2">Target: {PRODUCTION_TARGET.toLocaleString("en-IN")} units</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Efficiency</CardDescription>
                <div className="bg-warning/10 p-2 rounded-lg">
                  <TrendingUp className="size-4 text-warning" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground text-2xl font-bold">{efficiency}%</p>
              <p className="text-muted-foreground mt-2">
                {parseFloat(efficiency) >= 100 ? "Above target" : "Below target"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Pending Orders</CardDescription>
                <div className="bg-chart-4/10 p-2 rounded-lg">
                  <Clock className="size-4 text-chart-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground text-2xl font-bold">{kpis.pendingOrders}</p>
              <p className="text-muted-foreground mt-2">Awaiting start</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {productionData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Production vs Target</CardTitle>
              <CardDescription>Monthly production performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="produced" fill={chartColors.success} name="Produced" />
                  <Bar dataKey="target" fill={chartColors.grid} name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Production Trend</CardTitle>
              <CardDescription>6-month production trend</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={productionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="produced"
                    stroke={chartColors.brand}
                    strokeWidth={2}
                    name="Production"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Work Orders & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Work Orders</CardTitle>
            <CardDescription>Latest production activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.recentWorkOrders || []).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent work orders</p>
              ) : (
                data?.recentWorkOrders.map((order) => (
                  <div key={order.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-foreground font-medium">{order.productName}</p>
                        <p className="text-muted-foreground text-sm">{order.orderNumber}</p>
                      </div>
                      <Badge className={
                        order.status === "COMPLETED" ? "bg-success text-white" :
                          order.status === "IN_PROGRESS" ? "bg-primary text-white" :
                            "bg-warning text-white"
                      }>
                        {order.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground text-sm">
                      <span>Quantity: {order.completedQty} / {order.plannedQty} units</span>
                      <span>Progress: {order.progress}%</span>
                    </div>
                    <div className="w-full bg-accent rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${order.progress}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Production Status */}
          <Card>
            <CardHeader>
              <CardTitle>Production Status</CardTitle>
              <CardDescription>Current status overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="size-5 text-success" />
                    <span className="text-foreground">Completed</span>
                  </div>
                  <span className="text-foreground font-medium">
                    {data?.statusBreakdown?.["COMPLETED"] || 0} orders
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="size-5 text-primary" />
                    <span className="text-foreground">In Progress</span>
                  </div>
                  <span className="text-foreground font-medium">
                    {data?.statusBreakdown?.["IN_PROGRESS"] || 0} orders
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="size-5 text-warning" />
                    <span className="text-foreground">Pending</span>
                  </div>
                  <span className="text-foreground font-medium">
                    {data?.statusBreakdown?.["PENDING"] || 0} orders
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This Month Summary */}
          <Card>
            <CardHeader>
              <CardTitle>This Month Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Production</span>
                <span className="text-foreground font-medium">{kpis.monthlyProduction.toLocaleString("en-IN")} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed Orders</span>
                <span className="text-foreground font-medium">{kpis.completedThisMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active BOMs</span>
                <span className="text-foreground font-medium">{kpis.activeBOMs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Efficiency</span>
                <span className={`font-medium ${parseFloat(efficiency) >= 100 ? "text-success" : "text-foreground"}`}>
                  {efficiency}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
