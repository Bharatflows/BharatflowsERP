import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Download } from "lucide-react";
import { Button } from "../ui/button";

interface ReportDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    type: "category" | "vendor" | "tax";
    data: any[];
}

export function ReportDetailsDialog({
    isOpen,
    onClose,
    title,
    type,
    data,
}: ReportDetailsDialogProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const renderTableContent = () => {
        if (!data || data.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No data available for this report
                    </TableCell>
                </TableRow>
            );
        }

        switch (type) {
            case "category":
                return (
                    <>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Category Name</TableHead>
                                <TableHead className="text-right">Budget</TableHead>
                                <TableHead className="text-right">Spent</TableHead>
                                <TableHead className="text-right">Utilization</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => {
                                const utilization = item.budget > 0 ? (item.spent / item.budget) * 100 : 0;
                                return (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: item.color || "#ccc" }}
                                                />
                                                {item.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.budget || 0)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.spent || 0)}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge
                                                variant="outline"
                                                className={
                                                    utilization > 100
                                                        ? "text-red-600 border-red-200 bg-red-50"
                                                        : utilization > 80
                                                            ? "text-orange-600 border-orange-200 bg-orange-50"
                                                            : "text-green-600 border-green-200 bg-green-50"
                                                }
                                            >
                                                {utilization.toFixed(0)}%
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </>
                );

            case "vendor":
                return (
                    <>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vendor Name</TableHead>
                                <TableHead className="text-right">Expenses Count</TableHead>
                                <TableHead className="text-right">Total Amount</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-right">{item.count}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">View History</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </>
                );

            case "tax":
                return (
                    <>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tax Component</TableHead>
                                <TableHead className="text-right">Taxable Amount</TableHead>
                                <TableHead className="text-right">Tax Amount</TableHead>
                                <TableHead className="text-right">% of Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.taxableAmount)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.taxAmount)}</TableCell>
                                    <TableCell className="text-right">{item.percentage}%</TableCell>
                                </TableRow>
                            ))}
                            {data.length > 0 && (
                                <TableRow className="bg-muted font-bold">
                                    <TableCell>Total Input Credit</TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(data.reduce((sum, item) => sum + item.taxableAmount, 0))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(data.reduce((sum, item) => sum + item.taxAmount, 0))}
                                    </TableCell>
                                    <TableCell className="text-right">-</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>{title}</DialogTitle>
                            <DialogDescription>
                                Detailed breakdown for the selected report
                            </DialogDescription>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="size-4" />
                            Export
                        </Button>
                    </div>
                </DialogHeader>
                <div className="rounded-md border mt-4">
                    <Table>{renderTableContent()}</Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
