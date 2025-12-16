import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { purchaseService } from "../../services/modules.service";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Loader2, ArrowLeft, Download, Printer, Edit } from "lucide-react";
import { toast } from "sonner";

export function ViewGoodsReceivedNote() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [grn, setGRN] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGRN = async () => {
            try {
                if (!id) return;
                const response = await purchaseService.getGRNById(id);
                setGRN(response.data);
            } catch (error) {
                console.error("Failed to fetch GRN:", error);
                toast.error("Failed to load GRN");
            } finally {
                setLoading(false);
            }
        };
        fetchGRN();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!grn) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <p className="text-muted-foreground">GRN not found</p>
                <Button onClick={() => navigate('/purchase')}>Back to GRNs</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" onClick={() => navigate('/purchase')} className="gap-2">
                    <ArrowLeft className="size-4" />
                    Back to GRNs
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
                    <Button onClick={() => navigate(`/purchase/grn/${id}/edit`)} className="gap-2">
                        <Edit className="size-4" />
                        Edit GRN
                    </Button>
                </div>
            </div>

            <Card className="border-0 shadow-lg bg-white overflow-hidden">
                <CardContent className="p-8 md:p-12">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <h1 className="text-4xl font-bold text-primary mb-2">GOODS RECEIVED NOTE</h1>
                            <p className="text-muted-foreground">#{grn.grnNumber}</p>
                            <div className="mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                                {grn.status}
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="font-bold text-xl mb-1">BharatFlow</h2>
                            <p className="text-sm text-muted-foreground">Warehouse: {grn.warehouse || "Main Warehouse"}</p>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="flex justify-between mb-12">
                        <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Supplier</p>
                            {grn.supplier ? (
                                <div>
                                    <h3 className="font-bold text-lg">{grn.supplier.name}</h3>
                                    <p className="text-sm text-muted-foreground">{grn.supplier.email}</p>
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic">Unknown Supplier</p>
                            )}
                        </div>
                        <div className="text-right space-y-2">
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground">Received Date</p>
                                <p className="font-medium">{new Date(grn.receivedDate || grn.grnDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground">PO Reference</p>
                                <p className="font-medium">{grn.purchaseOrder?.orderNumber || grn.referenceNumber || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground">Challan No.</p>
                                <p className="font-medium">{grn.challanNumber || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-8">
                        <table className="w-full">
                            <thead className="border-b-2 border-primary/10">
                                <tr>
                                    <th className="text-left py-3 font-semibold text-sm text-muted-foreground">Item Description</th>
                                    <th className="text-center py-3 font-semibold text-sm text-muted-foreground w-32">Ordered Qty</th>
                                    <th className="text-center py-3 font-semibold text-sm text-muted-foreground w-32">Received Qty</th>
                                    <th className="text-right py-3 font-semibold text-sm text-muted-foreground w-32">Condition</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {(grn.items || []).map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="py-4">
                                            <p className="font-medium">{item.product?.name || item.productName}</p>
                                        </td>
                                        <td className="text-center py-4">{item.orderedQuantity || '-'} {item.unit}</td>
                                        <td className="text-center py-4 font-bold">{item.quantity || item.receivedQuantity} {item.unit}</td>
                                        <td className="text-right py-4">{item.condition || "Good"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Notes */}
                    <div className="grid grid-cols-1 gap-8 text-sm">
                        {grn.notes && (
                            <div>
                                <p className="font-semibold text-muted-foreground mb-1">Notes</p>
                                <p className="text-muted-foreground">{grn.notes}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
