import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Plus, Edit } from "lucide-react";
import { toast } from "sonner";

export function BillOfMaterials() {
  const boms = [
    { id: "BOM-001", product: "Product A", rawMaterials: 5, totalCost: 850, status: "Active" },
    { id: "BOM-002", product: "Product B", rawMaterials: 3, totalCost: 620, status: "Active" },
    { id: "BOM-003", product: "Product C", rawMaterials: 7, totalCost: 1250, status: "Draft" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bill of Materials (BOM)</CardTitle>
          <Button className="gap-2" onClick={() => toast.success("Add BOM dialog opened")}>
            <Plus className="size-4" />
            Create BOM
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BOM ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Raw Materials</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boms.map((bom) => (
                <TableRow key={bom.id}>
                  <TableCell>{bom.id}</TableCell>
                  <TableCell className="text-foreground">{bom.product}</TableCell>
                  <TableCell>{bom.rawMaterials} items</TableCell>
                  <TableCell className="text-right">₹{bom.totalCost.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge className={bom.status === "Active" ? "bg-[#10b981] text-white" : "bg-[#6b7280] text-white"}>
                      {bom.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Edit className="size-4" />
                    </Button>
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

