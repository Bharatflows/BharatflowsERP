import { Plus, Download, ShoppingCart, FileText, ClipboardList, Truck, FileDown, Sheet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ModuleHeader } from "../ui/module-header";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Skeleton } from "../ui/skeleton";
import { InvoiceList } from "./InvoiceList";
import { EstimateList } from "./EstimateList";
import { SalesOrderList } from "./SalesOrderList";
import { DeliveryChallanList } from "./DeliveryChallanList";
import { QuotationList } from "./QuotationList";
import type { Estimate, SalesOrder, Quotation } from "../../types";
import { SalesTicker } from "./SalesTicker";
// Removing conflicting imports from ModuleLayout
import {
    ModuleLayout,
    ModuleControls,
    ModuleContent,
    ControlGroup,
    FilterBar
} from "../layout/ModuleLayout";
import { ListFilters } from "../ui/ListFilters";

interface SalesOverviewProps {
    invoices: any[];
    loading: boolean;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onDeleteInvoice: (id: string) => void;
    onRefresh: () => void;
    onRefreshEstimates: () => void;
    onRefreshOrders: () => void;
    onRefreshChallans: () => void;
    onRefreshQuotations: () => void;
    onExport: () => void;
    onDeleteQuotation: (id: string) => void;
    onCreateNew?: () => void; // Optional prop for custom creation handler (Drawer)
    // New props
    estimates: Estimate[];
    estimatesLoading: boolean;
    salesOrders: SalesOrder[];
    ordersLoading: boolean;
    challans: any[];
    challansLoading: boolean;
    quotations: Quotation[];
    quotationsLoading: boolean;
}

export function SalesOverview({
    invoices,
    loading,
    activeTab,
    setActiveTab,
    onDeleteInvoice,
    onRefresh,
    onRefreshEstimates,
    onRefreshOrders,
    onRefreshChallans,
    onRefreshQuotations,
    onExport,
    onDeleteQuotation,
    onCreateNew,
    estimates,
    estimatesLoading,
    salesOrders,
    ordersLoading,
    challans,
    challansLoading,
    quotations,
    quotationsLoading,
}: SalesOverviewProps) {
    const navigate = useNavigate();





    return (
        <div className="flex flex-col h-full">
            <SalesTicker />
            <div className="p-4 md:p-6 space-y-4">
                <ModuleHeader
                    title="Sales & Invoicing"
                    description="Manage your sales invoices, estimates, and orders"
                    showBackButton={false}
                    icon={<ShoppingCart className="size-5 text-primary" />}
                    actions={
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={onExport}>
                                <Download className="size-4 mr-2" />
                                Export
                            </Button>
                            <Button size="sm" onClick={() => {
                                if (activeTab === 'invoices') {
                                    if (onCreateNew) onCreateNew();
                                    else navigate('/sales/invoices/new');
                                }
                                else if (activeTab === 'estimates') navigate('/sales/estimates/new');
                                else if (activeTab === 'quotations') navigate('/sales/quotations/new');
                                else if (activeTab === 'orders') navigate('/sales/orders/new');
                                else if (activeTab === 'challans') navigate('/sales/challans/new');
                            }}>
                                <Plus className="size-4 mr-2" />
                                {activeTab === 'invoices' ? 'New Invoice' :
                                    activeTab === 'estimates' ? 'New Estimate' :
                                        activeTab === 'quotations' ? 'New Quotation' :
                                            activeTab === 'orders' ? 'New Sales Order' :
                                                activeTab === 'challans' ? 'New Delivery Challan' : 'Create New'}
                            </Button>
                        </div>
                    }
                />

                <div className="space-y-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
                            <TabsTrigger value="invoices">Invoices</TabsTrigger>
                            <TabsTrigger value="estimates">Estimates</TabsTrigger>
                            <TabsTrigger value="quotations">Quotations</TabsTrigger>
                            <TabsTrigger value="orders">Sales Orders</TabsTrigger>
                            <TabsTrigger value="challans">Delivery Challans</TabsTrigger>
                        </TabsList>

                        <TabsContent value="invoices" className="space-y-4" forceMount style={{ display: activeTab === 'invoices' ? undefined : 'none' }}>
                            <InvoiceList
                                invoices={invoices}
                                onDelete={onDeleteInvoice}
                                onRefresh={onRefresh}
                                onCreateNew={onCreateNew || (() => navigate('/sales/invoices/new'))}
                            />
                        </TabsContent>

                        <TabsContent value="estimates" className="space-y-4" forceMount style={{ display: activeTab === 'estimates' ? undefined : 'none' }}>
                            <EstimateList
                                estimates={estimates}
                                onCreateNew={() => navigate('/sales/estimates/new')}
                                onViewEstimate={(id) => navigate(`/sales/estimates/${id}`)}
                                onEditEstimate={(id) => navigate(`/sales/estimates/${id}/edit`)}
                                onRefresh={onRefreshEstimates}
                            />
                        </TabsContent>

                        <TabsContent value="quotations" className="space-y-4" forceMount style={{ display: activeTab === 'quotations' ? undefined : 'none' }}>
                            <QuotationList
                                quotations={quotations}
                                onCreateNew={() => navigate('/sales/quotations/new')}
                                onViewQuotation={(id) => navigate(`/sales/quotations/${id}`)}
                                onEditQuotation={(id) => navigate(`/sales/quotations/${id}/edit`)}
                                onDeleteQuotation={onDeleteQuotation}
                                onRefresh={onRefreshQuotations}
                            />
                        </TabsContent>

                        <TabsContent value="orders" className="space-y-4" forceMount style={{ display: activeTab === 'orders' ? undefined : 'none' }}>
                            <SalesOrderList
                                salesOrders={salesOrders}
                                onCreateNew={() => navigate('/sales/orders/new')}
                                onViewOrder={(id) => navigate(`/sales/orders/${id}`)}
                                onEditOrder={(id) => navigate(`/sales/orders/${id}/edit`)}
                                onCreateDeliveryChallan={(id) => navigate(`/sales/challans/new?orderId=${id}`)}
                                onRefresh={onRefreshOrders}
                            />
                        </TabsContent>

                        <TabsContent value="challans" className="space-y-4" forceMount style={{ display: activeTab === 'challans' ? undefined : 'none' }}>
                            <DeliveryChallanList
                                challans={challans}
                                onCreateNew={() => navigate('/sales/challans/new')}
                                onViewChallan={(id) => navigate(`/sales/challans/${id}`)}
                                onEditChallan={(id) => navigate(`/sales/challans/${id}/edit`)}
                                onRefresh={onRefreshChallans}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
