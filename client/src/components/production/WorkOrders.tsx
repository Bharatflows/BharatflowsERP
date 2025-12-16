import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function WorkOrders() {
  const orders = [
    { id: "WO-001", product: "Product A", qty: 500, startDate: "2024-09-15", dueDate: "2024-09-25", status: "In Progress", progress: 75 },
    { id: "WO-002", product: "Product B", qty: 300, startDate: "2024-09-18", dueDate: "2024-09-28", status: "In Progress", progress: 40 },
    { id: "WO-003", product: "Product C", qty: 200, startDate: "2024-09-20", dueDate: "2024-09-30", status: "Pending", progress: 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Work Orders</CardTitle>
          <Button className="gap-2" onClick={() => toast.success("Create work order dialog opened")}>
            <Plus className="size-4" />
            Create Work Order
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Work Order</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="hidden md:table-cell">Start Date</TableHead>
                <TableHead className="hidden md:table-cell">Due Date</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="text-foreground">{order.id}</TableCell>
                  <TableCell>{order.product}</TableCell>
                  <TableCell>{order.qty} units</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Date(order.startDate).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Date(order.dueDate).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-accent rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${order.progress}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground">{order.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      order.status === "In Progress" ? "bg-[#2563eb] text-white" :
                        order.status === "Pending" ? "bg-[#f97316] text-white" :
                          "bg-[#10b981] text-white"
                    }>
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

