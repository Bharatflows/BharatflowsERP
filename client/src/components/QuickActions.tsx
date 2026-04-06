import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  ShoppingCart,
  Users,
  Package,
  Receipt,
  IndianRupee,
  Wallet
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import { usePersonaView } from "../hooks/usePersonaView";

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
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    route: "/dashboard/sales/invoices/new",
  },
  {
    id: "new-purchase",
    title: "New Purchase",
    description: "Record purchase",
    icon: ShoppingCart,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    route: "/dashboard/purchases/orders/new",
  },
  {
    id: "add-party",
    title: "Add Party",
    description: "Add customer/supplier",
    icon: Users,
    color: "text-violet-600",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
    route: "/dashboard/parties",
  },
  {
    id: "add-product",
    title: "Add Product",
    description: "Add inventory item",
    icon: Package,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    route: "/dashboard/inventory",
  },
  {
    id: "payment-in",
    title: "Payment In",
    description: "Record receipt",
    icon: IndianRupee,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    route: "/dashboard/banking",
  },
  {
    id: "payment-out",
    title: "Payment Out",
    description: "Record payment",
    icon: Wallet,
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-900/20",
    route: "/dashboard/expenses",
  },
  {
    id: "estimate",
    title: "New Estimate",
    description: "Create quotation",
    icon: Receipt,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
    route: "/dashboard/sales/quotations/new",
  },
  {
    id: "expense",
    title: "Add Expense",
    description: "Record expense",
    icon: Receipt,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    route: "/dashboard/expenses",
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  const handleAction = (action: QuickAction) => {
    toast.success(`Opening ${action.title}...`);
    navigate(action.route);
  };

  const persona = usePersonaView();

  const relevantActions = useMemo(() => {
    switch (persona.type) {
      case 'OWNER':
        return quickActions.filter(a => ['new-invoice', 'new-purchase', 'payment-in', 'expense'].includes(a.id));
      case 'ACCOUNTANT':
        return quickActions.filter(a => ['payment-in', 'payment-out', 'expense', 'new-invoice'].includes(a.id));
      case 'MANAGER':
        return quickActions.filter(a => ['add-product', 'new-purchase', 'new-invoice', 'add-party'].includes(a.id));
      case 'STAFF':
        return quickActions.filter(a => ['new-invoice', 'add-party', 'estimate', 'add-product'].includes(a.id));
      default:
        return quickActions.slice(0, 4);
    }
  }, [persona]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {relevantActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.id}
              onClick={() => handleAction(action)}
              className="cursor-pointer hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 border-muted/40 group bg-card hover:bg-accent/5"
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg shrink-0 transition-colors bg-background border border-border group-hover:border-transparent", action.bgColor)}>
                  <Icon className={cn("size-4", action.color)} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm truncate leading-tight">{action.title}</span>
                  <span className="text-overline text-muted-foreground truncate opacity-80">{action.description}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}