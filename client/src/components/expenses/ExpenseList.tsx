import { useState, useEffect } from "react";
import { expensesService } from "../../services/modules.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface Expense {
  id: string;
  expenseNumber?: string;
  date: string;
  description: string;
  category: string;
  vendor: string;
  amount: number;
  paymentMethod: string;
  status: "paid" | "pending" | "approved";
  receiptUrl?: string;
  notes?: string;
}

interface ExpenseListProps {
  onEditExpense: (expenseId: string) => void;
}

export function ExpenseList({ onEditExpense }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await expensesService.getAll();
      const mappedExpenses = (response.data || []).map((exp: any) => ({
        id: exp.id,
        expenseNumber: exp.expenseNumber,
        date: exp.date,
        description: exp.description,
        category: exp.category,
        vendor: exp.vendor || '',
        amount: Number(exp.amount),
        paymentMethod: exp.paymentMethod || '',
        status: (exp.status || 'pending').toLowerCase(),
        receiptUrl: exp.receiptUrl,
        notes: exp.notes
      }));
      setExpenses(mappedExpenses);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const categories = [
    "all",
    "Rent",
    "Salaries",
    "Utilities",
    "Transport",
    "Marketing",
    "Office Supplies",
    "Business Meals",
  ];

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || expense.category === filterCategory;
    const matchesStatus = filterStatus === "all" || expense.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = async (expenseId: string) => {
    try {
      await expensesService.delete(expenseId);
      setExpenses(expenses.filter((e) => e.id !== expenseId));
      toast.success("Expense deleted successfully");
    } catch (error) {
      console.error("Failed to delete expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const handleApprove = async (expenseId: string) => {
    try {
      await expensesService.approve(expenseId);
      setExpenses(
        expenses.map((e) =>
          e.id === expenseId ? { ...e, status: "approved" as const } : e
        )
      );
      toast.success("Expense approved");
    } catch (error) {
      console.error("Failed to approve expense:", error);
      toast.error("Failed to approve expense");
    }
  };

  const handleMarkPaid = async (expenseId: string) => {
    try {
      await expensesService.markAsPaid(expenseId);
      setExpenses(
        expenses.map((e) => (e.id === expenseId ? { ...e, status: "paid" as const } : e))
      );
      toast.success("Expense marked as paid");
    } catch (error) {
      console.error("Failed to mark expense as paid:", error);
      toast.error("Failed to mark expense as paid");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-[#10b981] text-white">
            <CheckCircle className="size-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-[#f97316] text-white">
            <Clock className="size-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-[#2563eb] text-white">
            <CheckCircle className="size-3 mr-1" />
            Approved
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>All Expenses</CardTitle>
            <CardDescription>
              {filteredExpenses.length} expenses • Total: ₹
              {totalAmount.toLocaleString("en-IN")}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="size-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expenses Table */}
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Expense ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden lg:table-cell">Vendor</TableHead>
                <TableHead className="hidden md:table-cell">Payment</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No expenses found
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {new Date(expense.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{expense.expenseNumber || expense.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-foreground">{expense.description}</p>
                        <p className="text-muted-foreground lg:hidden">{expense.vendor}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{expense.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {expense.vendor}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {expense.paymentMethod}
                    </TableCell>
                    <TableCell className="font-medium">
                      ₹{expense.amount.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditExpense(expense.id)}>
                            <Edit className="size-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="size-4 mr-2" />
                            View Receipt
                          </DropdownMenuItem>
                          {expense.status === "pending" && (
                            <>
                              <DropdownMenuItem onClick={() => handleApprove(expense.id)}>
                                <CheckCircle className="size-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMarkPaid(expense.id)}>
                                <CheckCircle className="size-4 mr-2" />
                                Mark as Paid
                              </DropdownMenuItem>
                            </>
                          )}
                          {expense.status === "approved" && (
                            <DropdownMenuItem onClick={() => handleMarkPaid(expense.id)}>
                              <CheckCircle className="size-4 mr-2" />
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

