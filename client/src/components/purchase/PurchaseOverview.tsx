import React from "react";
import { Plus, Search, Download, Filter, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ModuleHeader } from "../ui/module-header";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { PurchaseOrderList } from "./PurchaseOrderList";
import { PurchaseBillList } from "./PurchaseBillList";
import { GoodsReceivedList } from "./GoodsReceivedList";

interface PurchaseOverviewProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export function PurchaseOverview({
    activeTab,
    setActiveTab,
}: PurchaseOverviewProps) {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = React.useState("");
    const [grnRefreshKey, setGrnRefreshKey] = React.useState(0);
    const [prevTab, setPrevTab] = React.useState(activeTab);

    // Refresh GRN list when navigating to GRN tab
    React.useEffect(() => {
        if (activeTab === 'grn' && prevTab !== 'grn') {
            setGrnRefreshKey(prev => prev + 1);
        }
        setPrevTab(activeTab);
    }, [activeTab, prevTab]);

    return (
        <div className="p-6 space-y-6 min-h-full bg-background">
            <ModuleHeader
                title="Purchase Management"
                description="Manage purchase orders, bills, and goods received"
                showBackButton={false}
                icon={<ShoppingCart className="size-5 text-primary" />}
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm">
                            <Download className="size-4 mr-2" />
                            Export
                        </Button>
                        <Button size="sm" onClick={() => {
                            if (activeTab === 'orders') navigate('/purchase/orders/new');
                            else if (activeTab === 'bills') navigate('/purchase/bills/new');
                            else if (activeTab === 'grn') navigate('/purchase/grn/new');
                        }}>
                            <Plus className="size-4 mr-2" />
                            {activeTab === 'orders' ? 'New Purchase Order' :
                                activeTab === 'bills' ? 'New Purchase Bill' :
                                    activeTab === 'grn' ? 'New GRN' : 'Create New'}
                        </Button>
                    </div>
                }
            />

            <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by number, supplier, or status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline" size="sm">
                        <Filter className="size-4 mr-2" />
                        Filters
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
                        <TabsTrigger value="grn">Goods Received (GRN)</TabsTrigger>
                        <TabsTrigger value="bills">Purchase Bills</TabsTrigger>
                    </TabsList>

                    <TabsContent value="orders">
                        <PurchaseOrderList
                            onCreateNew={() => navigate('/purchase/orders/new')}
                            onViewOrder={(id) => navigate(`/purchase/orders/${id}`)}
                            onEditOrder={(id) => navigate(`/purchase/orders/${id}/edit`)}
                        />
                    </TabsContent>

                    <TabsContent value="grn">
                        <GoodsReceivedList
                            refreshKey={grnRefreshKey}
                            onCreateNew={() => navigate('/purchase/grn/new')}
                            onViewGRN={(id) => navigate(`/purchase/grn/${id}`)}
                            onEditGRN={(id) => navigate(`/purchase/grn/${id}/edit`)}
                        />
                    </TabsContent>

                    <TabsContent value="bills">
                        <PurchaseBillList
                            onCreateNew={() => navigate('/purchase/bills/new')}
                            onViewBill={(id) => navigate(`/purchase/bills/${id}`)}
                            onEditBill={(id) => navigate(`/purchase/bills/${id}/edit`)}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

