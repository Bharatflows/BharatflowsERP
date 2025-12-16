import { Plus, Search, Download, Filter, ShoppingCart, FileText, ClipboardList, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ModuleHeader } from "../ui/module-header";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Skeleton } from "../ui/skeleton";
import { InvoiceList } from "./InvoiceList";
import { EstimateList } from "./EstimateList";
import { SalesOrderList } from "./SalesOrderList";
import { DeliveryChallanList } from "./DeliveryChallanList";
import { QuotationList } from "./QuotationList";
import type { Estimate, SalesOrder, Quotation } from "../../types";

interface SalesOverviewProps {
    invoices: any[];
    filteredInvoices: any[];
    loading: boolean;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
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
    filteredInvoices,
    loading,
    searchTerm,
    setSearchTerm,
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
        <div className="p-4 md:p-6">
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
                            if (activeTab === 'invoices') navigate('/sales/invoices/new');
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
                {/* Search Bar */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by invoice number, customer, or status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    {searchTerm && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchTerm('')}
                        >
                            Clear
                        </Button>
                    )}
                    <Button variant="outline" size="sm">
                        <Filter className="size-4 mr-2" />
                        Filters
                    </Button>
                </div>

                {/* Results count */}
                {searchTerm && (
                    <div className="text-sm text-muted-foreground">
                        Found {filteredInvoices.length} of {invoices.length} invoices
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-5 lg:w-auto">
                        <TabsTrigger value="invoices">Invoices</TabsTrigger>
                        <TabsTrigger value="estimates">Estimates</TabsTrigger>
                        <TabsTrigger value="quotations">Quotations</TabsTrigger>
                        <TabsTrigger value="orders">Sales Orders</TabsTrigger>
                        <TabsTrigger value="challans">Delivery Challans</TabsTrigger>
                    </TabsList>

                    <TabsContent value="invoices" className="space-y-4" forceMount style={{ display: activeTab === 'invoices' ? undefined : 'none' }}>
                        {loading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        ) : filteredInvoices.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <div className="flex justify-center mb-4">
                                    <div className="bg-primary/10 p-4 rounded-full">
                                        <Plus className="size-8 text-primary" />
                                    </div>
                                </div>
                                <h3 className="text-foreground mb-2">
                                    {searchTerm ? 'No invoices found' : 'No invoices yet'}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchTerm
                                        ? 'Try adjusting your search criteria'
                                        : 'Create your first sales invoice to get started'}
                                </p>
                                {!searchTerm && (
                                    <Button onClick={() => navigate('/sales/invoices/new')}>
                                        <Plus className="size-4 mr-2" />
                                        Create First Invoice
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <InvoiceList
                                invoices={filteredInvoices}
                                onDelete={onDeleteInvoice}
                                onRefresh={onRefresh}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="estimates" className="space-y-4" forceMount style={{ display: activeTab === 'estimates' ? undefined : 'none' }}>
                        {estimatesLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        ) : estimates.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <div className="flex justify-center mb-4">
                                    <div className="bg-primary/10 p-4 rounded-full">
                                        <FileText className="size-8 text-primary" />
                                    </div>
                                </div>
                                <h3 className="text-foreground mb-2">
                                    No estimates yet
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    Create your first estimate to get started
                                </p>
                                <Button onClick={() => navigate('/sales/estimates/new')}>
                                    <Plus className="size-4 mr-2" />
                                    Create First Estimate
                                </Button>
                            </div>
                        ) : (
                            <EstimateList
                                estimates={estimates}
                                onCreateNew={() => navigate('/sales/estimates/new')}
                                onViewEstimate={(id) => navigate(`/sales/estimates/${id}`)}
                                onEditEstimate={(id) => navigate(`/sales/estimates/${id}/edit`)}
                                onRefresh={onRefreshEstimates}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="quotations" className="space-y-4" forceMount style={{ display: activeTab === 'quotations' ? undefined : 'none' }}>
                        {quotationsLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        ) : quotations.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <div className="flex justify-center mb-4">
                                    <div className="bg-primary/10 p-4 rounded-full">
                                        <FileText className="size-8 text-primary" />
                                    </div>
                                </div>
                                <h3 className="text-foreground mb-2">
                                    No quotations yet
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    Create your first quotation to get started
                                </p>
                                <Button onClick={() => navigate('/sales/quotations/new')}>
                                    <Plus className="size-4 mr-2" />
                                    Create First Quotation
                                </Button>
                            </div>
                        ) : (
                            <QuotationList
                                quotations={quotations}
                                onCreateNew={() => navigate('/sales/quotations/new')}
                                onViewQuotation={(id) => navigate(`/sales/quotations/${id}`)}
                                onEditQuotation={(id) => navigate(`/sales/quotations/${id}/edit`)}
                                onDelete={onDeleteQuotation}
                                onRefresh={onRefreshQuotations}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="orders" className="space-y-4" forceMount style={{ display: activeTab === 'orders' ? undefined : 'none' }}>
                        {ordersLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        ) : salesOrders.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <div className="flex justify-center mb-4">
                                    <div className="bg-primary/10 p-4 rounded-full">
                                        <ClipboardList className="size-8 text-primary" />
                                    </div>
                                </div>
                                <h3 className="text-foreground mb-2">
                                    No sales orders yet
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    Create your first sales order to get started
                                </p>
                                <Button onClick={() => navigate('/sales/orders/new')}>
                                    <Plus className="size-4 mr-2" />
                                    Create First Sales Order
                                </Button>
                            </div>
                        ) : (
                            <SalesOrderList
                                orders={salesOrders}
                                onCreateNew={() => navigate('/sales/orders/new')}
                                onViewOrder={(id) => navigate(`/sales/orders/${id}`)}
                                onEditOrder={(id) => navigate(`/sales/orders/${id}/edit`)}
                                onCreateDeliveryChallan={(id) => navigate(`/sales/challans/new?orderId=${id}`)}
                                onRefresh={onRefreshOrders}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="challans" className="space-y-4" forceMount style={{ display: activeTab === 'challans' ? undefined : 'none' }}>
                        {challansLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        ) : challans.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <div className="flex justify-center mb-4">
                                    <div className="bg-primary/10 p-4 rounded-full">
                                        <Truck className="size-8 text-primary" />
                                    </div>
                                </div>
                                <h3 className="text-foreground mb-2">
                                    No delivery challans yet
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    Create your first delivery challan to get started
                                </p>
                                <Button onClick={() => navigate('/sales/challans/new')}>
                                    <Plus className="size-4 mr-2" />
                                    Create First Delivery Challan
                                </Button>
                            </div>
                        ) : (
                            <DeliveryChallanList
                                challans={challans}
                                onCreateNew={() => navigate('/sales/challans/new')}
                                onViewChallan={(id) => navigate(`/sales/challans/${id}`)}
                                onEditChallan={(id) => navigate(`/sales/challans/${id}/edit`)}
                                onRefresh={onRefreshChallans}
                            />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
