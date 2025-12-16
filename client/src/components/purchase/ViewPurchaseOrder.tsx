import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { purchaseService } from "../../services/modules.service";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";
import { Loader2, ArrowLeft, Download, Printer, Edit } from "lucide-react";
import { toast } from "sonner";

export function ViewPurchaseOrder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                if (!id) return;
                const response = await purchaseService.getById(id);
                setOrder(response.data);
            } catch (error) {
                console.error("Failed to fetch order:", error);
                toast.error("Failed to load purchase order");
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <p className="text-muted-foreground">Purchase Order not found</p>
                <Button onClick={() => navigate('/purchase')}>Back to Orders</Button>
            </div>
        );
    }

    const calculateTotals = () => {
        const items = order.items || [];
        const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0);
        const totalTax = items.reduce((sum: number, item: any) => {
            const itemSubtotal = item.quantity * item.rate;
            const itemDiscount = (itemSubtotal * (item.discount || 0)) / 100;
            return sum + ((itemSubtotal - itemDiscount) * (item.taxRate || 0)) / 100;
        }, 0);
        const total = Number(order.totalAmount);
        return { subtotal, totalTax, total };
    };

    const totals = calculateTotals();

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" onClick={() => navigate('/purchase')} className="gap-2">
                    <ArrowLeft className="size-4" />
                    Back to Orders
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Download className="size-4" />
                        PDF
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Printer className="size-4" />
                        Print
                    </Button>
                    <Button onClick={() => navigate(`/purchase/orders/${id}/edit`)} className="gap-2">
                        <Edit className="size-4" />
                        Edit Order
                    </Button>
                </div>
            </div>

            <Card className="border-0 shadow-lg bg-white overflow-hidden">
                <CardContent className="p-8 md:p-12">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <h1 className="text-4xl font-bold text-primary mb-2">PURCHASE ORDER</h1>
                            <p className="text-muted-foreground">#{order.orderNumber}</p>
                            <div className="mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                                {order.status}
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="font-bold text-xl mb-1">BharatFlow</h2>
                            <p className="text-sm text-muted-foreground">123 Business Street</p>
                            <p className="text-sm text-muted-foreground">Mumbai, MH 400001</p>
                        </div>
                    </div>

                    {/* Vendor & Details */}
                    <div className="flex justify-between mb-12">
                        <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Vendor</p>
                            {order.supplier ? (
                                <div>
                                    <h3 className="font-bold text-lg">{order.supplier.name}</h3>
                                    <p className="text-sm text-muted-foreground">{order.supplier.email}</p>
                                    <p className="text-sm text-muted-foreground">{order.supplier.phone}</p>
                                    {order.supplier.gstin && (
                                        <p className="text-sm text-muted-foreground mt-1">GSTIN: {order.supplier.gstin}</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic">Unknown Supplier</p>
                            )}
                        </div>
                        <div className="text-right space-y-2">
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground">Order Date</p>
                                <p className="font-medium">{new Date(order.orderDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground">Expected Delivery</p>
                                <p className="font-medium">{order.expectedDate ? new Date(order.expectedDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) : '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-8">
                        <table className="w-full">
                            <thead className="border-b-2 border-primary/10">
                                <tr>
                                    <th className="text-left py-3 font-semibold text-sm text-muted-foreground">Item Description</th>
                                    <th className="text-center py-3 font-semibold text-sm text-muted-foreground w-24">Qty</th>
                                    <th className="text-right py-3 font-semibold text-sm text-muted-foreground w-32">Rate</th>
                                    <th className="text-right py-3 font-semibold text-sm text-muted-foreground w-32">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {(order.items || []).map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="py-4">
                                            <p className="font-medium">{item.product?.name || item.productName}</p>
                                            {item.hsnCode && <p className="text-sm text-muted-foreground">HSN: {item.hsnCode}</p>}
                                        </td>
                                        <td className="text-center py-4">{item.quantity} {item.unit}</td>
                                        <td className="text-right py-4">₹{Number(item.rate).toLocaleString('en-IN')}</td>
                                        <td className="text-right py-4 font-medium">
                                            ₹{((Number(item.quantity) * Number(item.rate)) + (Number(item.taxAmount) || 0)).toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mb-12">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tax (GST)</span>
                                <span>₹{totals.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span className="text-primary">₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Notes */}
                    <div className="grid grid-cols-2 gap-8 text-sm">
                        {order.notes && (
                            <div>
                                <p className="font-semibold text-muted-foreground mb-1">Notes</p>
                                <p className="text-muted-foreground">{order.notes}</p>
                            </div>
                        )}
                        {order.termsConditions && (
                            <div>
                                <p className="font-semibold text-muted-foreground mb-1">Terms & Conditions</p>
                                <p className="text-muted-foreground">{order.termsConditions}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
