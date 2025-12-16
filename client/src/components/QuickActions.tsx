import { useNavigate } from "react-router-dom";
import {
  Plus,
  FileText,
  ShoppingCart,
  Users,
  Package,
  Receipt,
  IndianRupee,
  Wallet
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { toast } from "sonner";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  route: string;
}

const quickActions: QuickAction[] = [
  {
    id: "new-invoice",
    title: "New Invoice",
    description: "Create sales invoice",
    icon: FileText,
    color: "text-info",
    bgColor: "bg-info-light",
    route: "/dashboard/sales/invoices/new",
  },
  {
    id: "new-purchase",
    title: "New Purchase",
    description: "Record purchase order",
    icon: ShoppingCart,
    color: "text-success",
    bgColor: "bg-success-light",
    route: "/dashboard/purchases/orders/new",
  },
  {
    id: "add-party",
    title: "Add Party",
    description: "Add customer/supplier",
    icon: Users,
    color: "text-purple",
    bgColor: "bg-purple-light",
    route: "/dashboard/parties",
  },
  {
    id: "add-product",
    title: "Add Product",
    description: "Add inventory item",
    icon: Package,
    color: "text-orange",
    bgColor: "bg-orange-light",
    route: "/dashboard/inventory",
  },
  {
    id: "payment-in",
    title: "Payment In",
    description: "Record payment received",
    icon: IndianRupee,
    color: "text-success",
    bgColor: "bg-success-light",
    route: "/dashboard/banking",
  },
  {
    id: "payment-out",
    title: "Payment Out",
    description: "Record payment made",
    icon: Wallet,
    color: "text-error",
    bgColor: "bg-error-light",
    route: "/dashboard/expenses",
  },
  {
    id: "estimate",
    title: "New Estimate",
    description: "Create quotation",
    icon: Receipt,
    color: "text-info",
    bgColor: "bg-info-light",
    route: "/dashboard/sales/quotations/new",
  },
  {
    id: "expense",
    title: "Add Expense",
    description: "Record business expense",
    icon: Receipt,
    color: "text-warning",
    bgColor: "bg-warning-light",
    route: "/dashboard/expenses",
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  const handleAction = (action: QuickAction) => {
    toast.success(`Opening ${action.title}...`);
    navigate(action.route);
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="size-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Button
                key={action.id}
                variant="outline"
                onClick={() => handleAction(action)}
                className="h-auto flex flex-col items-center gap-3 p-4 hover:shadow-md transition-all border-border hover:border-primary/50"
              >
                <div className={cn("p-3 rounded-xl", action.bgColor)}>
                  <Icon className={cn("size-6", action.color)} />
                </div>
                <div className="text-center">
                  <p className="text-foreground mb-0.5">{action.title}</p>
                  <p className="text-muted-foreground">{action.description}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}