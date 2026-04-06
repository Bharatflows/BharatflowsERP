import { useState, useEffect } from "react";
import { expensesService } from "../../services/modules.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import {
    RefreshCw,
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    User,
    Calendar,
    IndianRupee,
    FileText,
} from "lucide-react";
import { toast } from "sonner";

interface Expense {
    id: string;
    expenseNumber: string;
    category: string;
    amount: number;
    date: string;
    description: string;
    vendor?: string;
    status: string;
    createdAt: string;
}

export function PendingApprovals() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const fetchPendingExpenses = async () => {
        setLoading(true);
        try {
            const response = await expensesService.getAll({ status: "PENDING" });
            if (response.success) {
                setExpenses(response.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch pending expenses:", error);
            toast.error("Failed to load pending approvals");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingExpenses();
    }, []);

    const handleApprove = async (expense: Expense) => {
        setActionLoading(expense.id);
        try {
            const response = await expensesService.approve(expense.id);
            if (response.success) {
                toast.success(`Expense ${expense.expenseNumber || expense.id.slice(0, 8)} approved!`);
                fetchPendingExpenses();
            } else {
                toast.error(response.message || "Failed to approve expense");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to approve expense");
        } finally {
            setActionLoading(null);
        }
    };

    const openRejectDialog = (expense: Expense) => {
        setSelectedExpense(expense);
        setRejectionReason("");
        setRejectDialogOpen(true);
    };

    const handleReject = async () => {
        if (!selectedExpense || !rejectionReason.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }

        setActionLoading(selectedExpense.id);
        try {
            const response = await expensesService.reject(selectedExpense.id, rejectionReason);
            if (response.success) {
                toast.success(`Expense ${selectedExpense.expenseNumber || selectedExpense.id.slice(0, 8)} rejected`);
                setRejectDialogOpen(false);
                fetchPendingExpenses();
            } else {
                toast.error(response.message || "Failed to reject expense");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to reject expense");
        } finally {
            setActionLoading(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading pending approvals...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Pending Approvals</h2>
                    <p className="text-muted-foreground">
                        Review and approve or reject expense requests
                    </p>
                </div>
                <Button variant="outline" onClick={fetchPendingExpenses}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-500 p-2 rounded-lg">
                                <Clock className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-amber-600 font-medium">Pending</p>
                                <p className="text-2xl font-bold text-amber-700">{expenses.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500 p-2 rounded-lg">
                                <IndianRupee className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Total Amount</p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {formatCurrency(expenses.reduce((sum, e) => sum + Number(e.amount), 0))}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-500 p-2 rounded-lg">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-purple-600 font-medium">Categories</p>
                                <p className="text-2xl font-bold text-purple-700">
                                    {new Set(expenses.map((e) => e.category)).size}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Expenses List */}
            {expenses.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                        <h3 className="text-lg font-semibold">All caught up!</h3>
                        <p className="text-muted-foreground">No pending expenses to approve</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {expenses.map((expense) => (
                        <Card key={expense.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                <Clock className="h-3 w-3 mr-1" />
                                                PENDING
                                            </Badge>
                                            <span className="text-sm font-mono text-muted-foreground">
                                                {expense.expenseNumber || expense.id.slice(0, 8)}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold mb-1">
                                            {expense.description || expense.category}
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <FileText className="h-4 w-4" />
                                                <span>{expense.category}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <User className="h-4 w-4" />
                                                <span>{expense.vendor || "No vendor"}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                <span>{new Date(expense.date).toLocaleDateString("en-IN")}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <IndianRupee className="h-4 w-4" />
                                                <span className="font-semibold text-foreground">
                                                    {formatCurrency(Number(expense.amount))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={() => openRejectDialog(expense)}
                                            disabled={actionLoading === expense.id}
                                        >
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Reject
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => handleApprove(expense)}
                                            disabled={actionLoading === expense.id}
                                        >
                                            {actionLoading === expense.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                            ) : (
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                            )}
                                            Approve
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Rejection Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Expense</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this expense request.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Enter rejection reason..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectionReason.trim() || actionLoading !== null}
                        >
                            {actionLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                                <XCircle className="h-4 w-4 mr-1" />
                            )}
                            Reject Expense
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default PendingApprovals;
