import { Plus, Download, ShoppingCart, IndianRupee, ClipboardList, Package, CheckCircle2, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Skeleton } from "../ui/skeleton";
import { PurchaseOrderList } from "./PurchaseOrderList";
import { PurchaseBillList } from "./PurchaseBillList";
import { GoodsReceivedList } from "./GoodsReceivedList";
import { DebitNoteList } from "./DebitNoteList";
import { StatsCard } from "../ui/stats-card";
import { ModuleHeader } from "../ui/module-header";

interface PurchaseOverviewProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    orders: any[];
    ordersLoading: boolean;
    bills: any[];
    billsLoading: boolean;
}

export function PurchaseOverview({
    activeTab,
    setActiveTab,
    orders,
    ordersLoading,
    bills,
    billsLoading,
}: PurchaseOverviewProps) {
    const navigate = useNavigate();

    // Summary statistics
    const pendingGrnCount = orders.filter(o => o.status !== "RECEIVED" && o.status !== "CANCELLED").length;
    const totalSpent = bills.reduce((sum, bill) => sum + Number(bill.totalAmount || 0), 0);
    const paidBillsCount = bills.filter(b => b.status === "PAID").length;

    // Dynamic CTA label & route per active tab
    const ctaConfig: Record<string, { label: string; route: string }> = {
        orders: { label: "New Order", route: "/purchase/orders/new" },
        grn: { label: "New GRN", route: "/purchase/grn/new" },
        bills: { label: "New Bill", route: "/purchase/bills/new" },
        "debit-notes": { label: "New Debit Note", route: "/purchase/debit-notes/new" },
    };
    const cta = ctaConfig[activeTab] || ctaConfig.orders;

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 md:p-6 space-y-6">
                {/* Header — matches SalesOverview pattern */}
                <ModuleHeader
                    title="Purchase Management"
                    description="Manage purchase orders, vendor bills, and goods received"
                    showBackButton={false}
                    icon={<ShoppingCart className="size-5 text-primary" />}
                    actions={
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <Download className="size-4 mr-2" />
                                Export
                            </Button>
                            <Button size="sm" onClick={() => navigate(cta.route)}>
                                <Plus className="size-4 mr-2" />
                                {cta.label}
                            </Button>
                        </div>
                    }
                />

                {/* Summary Cards */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        label="Total Orders"
                        value={orders.length}
                        icon={ClipboardList}
                        gradient="bg-gradient-to-br from-primary to-primary/80"
                        shadowColor="shadow-primary/20"
                    />
                    <StatsCard
                        label="Total Spent"
                        value={totalSpent >= 100000
                            ? `${(totalSpent / 100000).toFixed(1)}L`
                            : totalSpent.toLocaleString('en-IN')}
                        prefix="₹"
                        icon={IndianRupee}
                        gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
                        shadowColor="shadow-emerald-500/20"
                    />
                    <StatsCard
                        label="Pending GRN"
                        value={pendingGrnCount}
                        icon={Package}
                        gradient="bg-gradient-to-br from-amber-500 to-amber-600"
                        shadowColor="shadow-amber-500/20"
                    />
                    <StatsCard
                        label="Completed Bills"
                        value={paidBillsCount}
                        icon={CheckCircle2}
                        gradient="bg-gradient-to-br from-violet-500 to-violet-600"
                        shadowColor="shadow-violet-500/20"
                    />
                </section>

                {/* Tabs + Content */}
                <div className="space-y-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
                            <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
                            <TabsTrigger value="grn">Goods Received (GRN)</TabsTrigger>
                            <TabsTrigger value="bills">Purchase Bills</TabsTrigger>
                            <TabsTrigger value="debit-notes">Debit Notes</TabsTrigger>
                        </TabsList>

                        {/* Purchase Orders Tab */}
                        <TabsContent value="orders" className="space-y-4" forceMount style={{ display: activeTab === 'orders' ? undefined : 'none' }}>
                            <PurchaseOrderList
                                onCreateNew={() => navigate('/purchase/orders/new')}
                                onViewOrder={(id) => navigate(`/purchase/orders/${id}`)}
                                onEditOrder={(id) => navigate(`/purchase/orders/${id}/edit`)}
                                hideStats={true}
                            />
                        </TabsContent>

                        {/* GRN Tab */}
                        <TabsContent value="grn" className="space-y-4" forceMount style={{ display: activeTab === 'grn' ? undefined : 'none' }}>
                            <GoodsReceivedList
                                onCreateNew={() => navigate('/purchase/grn/new')}
                                onViewGRN={(id) => navigate(`/purchase/grn/${id}`)}
                                onEditGRN={(id) => navigate(`/purchase/grn/${id}/edit`)}
                                hideStats={true}
                            />
                        </TabsContent>

                        {/* Purchase Bills Tab */}
                        <TabsContent value="bills" className="space-y-4" forceMount style={{ display: activeTab === 'bills' ? undefined : 'none' }}>
                            <PurchaseBillList
                                onCreateNew={() => navigate('/purchase/bills/new')}
                                onViewBill={(id) => navigate(`/purchase/bills/${id}`)}
                                onEditBill={(id) => navigate(`/purchase/bills/${id}/edit`)}
                                hideStats={true}
                            />
                        </TabsContent>

                        {/* Debit Notes Tab */}
                        <TabsContent value="debit-notes" className="space-y-4" forceMount style={{ display: activeTab === 'debit-notes' ? undefined : 'none' }}>
                            <DebitNoteList
                                onCreateNew={() => navigate('/purchase/debit-notes/new')}
                                onViewDebitNote={(id) => navigate(`/purchase/debit-notes/${id}`)}
                                onEditDebitNote={(id) => navigate(`/purchase/debit-notes/${id}/edit`)}
                                hideStats={true}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
