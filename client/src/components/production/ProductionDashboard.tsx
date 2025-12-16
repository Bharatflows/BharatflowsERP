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

interface ProductionDashboardProps {
  onViewWorkOrders: () => void;
}

const productionData = [
  { month: "Apr", produced: 1200, target: 1500 },
  { month: "May", produced: 1450, target: 1500 },
  { month: "Jun", produced: 1380, target: 1500 },
  { month: "Jul", produced: 1620, target: 1500 },
  { month: "Aug", produced: 1580, target: 1500 },
  { month: "Sep", produced: 1720, target: 1500 },
];

export function ProductionDashboard({ onViewWorkOrders }: ProductionDashboardProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Active Work Orders</CardDescription>
              <div className="bg-[#2563eb]/10 p-2 rounded-lg">
                <Factory className="size-4 text-[#2563eb]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">15</p>
            <Button variant="link" className="p-0 h-auto mt-2" onClick={onViewWorkOrders}>
              View All <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Monthly Production</CardDescription>
              <div className="bg-[#10b981]/10 p-2 rounded-lg">
                <Package className="size-4 text-[#10b981]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">1,720 units</p>
            <p className="text-muted-foreground mt-2">Target: 1,500 units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Efficiency</CardDescription>
              <div className="bg-[#f97316]/10 p-2 rounded-lg">
                <TrendingUp className="size-4 text-[#f97316]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">114.7%</p>
            <p className="text-muted-foreground mt-2">+14.7% above target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Pending Orders</CardDescription>
              <div className="bg-[#8b5cf6]/10 p-2 rounded-lg">
                <Clock className="size-4 text-[#8b5cf6]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">8</p>
            <p className="text-muted-foreground mt-2">Awaiting materials</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
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
                <Bar dataKey="produced" fill="#10b981" name="Produced" />
                <Bar dataKey="target" fill="#e5e7eb" name="Target" />
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
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Production"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Active Work Orders & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Work Orders</CardTitle>
            <CardDescription>Currently in production</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { id: "WO-001", product: "Product A", qty: 500, status: "In Progress", progress: 75 },
                { id: "WO-002", product: "Product B", qty: 300, status: "In Progress", progress: 40 },
                { id: "WO-003", product: "Product C", qty: 200, status: "Quality Check", progress: 95 },
              ].map((order) => (
                <div key={order.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground">{order.product}</p>
                      <p className="text-muted-foreground">{order.id}</p>
                    </div>
                    <Badge className={
                      order.status === "Quality Check" ? "bg-[#f97316] text-white" : "bg-[#2563eb] text-white"
                    }>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Quantity: {order.qty} units</span>
                    <span>Progress: {order.progress}%</span>
                  </div>
                  <div className="w-full bg-accent rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${order.progress}%` }}
                    />
                  </div>
                </div>
              ))}
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
                    <CheckCircle className="size-5 text-[#10b981]" />
                    <span className="text-foreground">Completed</span>
                  </div>
                  <span className="text-foreground">5 orders</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="size-5 text-[#2563eb]" />
                    <span className="text-foreground">In Progress</span>
                  </div>
                  <span className="text-foreground">15 orders</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="size-5 text-[#f97316]" />
                    <span className="text-foreground">Delayed</span>
                  </div>
                  <span className="text-foreground">2 orders</span>
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
                <span className="text-foreground">1,720 units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Work Orders</span>
                <span className="text-foreground">22</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quality Passed</span>
                <span className="text-foreground">98.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Efficiency</span>
                <span className="text-foreground text-[#10b981]">114.7%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
