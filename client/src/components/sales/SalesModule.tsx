import { useState } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import {
  useInvoices,
  useEstimates,
  useSalesOrders,
  useDeliveryChallans,
  useQuotations,
  useDeleteInvoice,
  useDeleteEstimate,
  useDeleteSalesOrder,
  useDeleteDeliveryChallan,
  useDeleteQuotation,
  useCreateInvoice,
  useUpdateInvoice,
  useCreateEstimate,
  useCreateSalesOrder,
  useCreateDeliveryChallan
} from "../../hooks/useSales";
import { SalesOverview } from "./SalesOverview";
import { CreateInvoice } from "./CreateInvoice";
import { ViewInvoice } from "./ViewInvoice";
import { CreateEstimate } from "./CreateEstimate";
import { CreateSalesOrder } from "./CreateSalesOrder";
import { CreateDeliveryChallan } from "./CreateDeliveryChallan";
import { CreateQuotation } from "./CreateQuotation";
import { toast } from "sonner";

// Wrapper components for edit routes
function EditInvoiceWrapper({ onSave, onCancel }: { onSave: (data: any) => void; onCancel: () => void }) {
  const { id } = useParams();
  return <CreateInvoice invoiceId={id} onSave={onSave} onCancel={onCancel} />;
}

function EditEstimateWrapper({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const { id } = useParams();
  return <CreateEstimate estimateId={id} onSave={onSave} onCancel={onCancel} />;
}

function EditSalesOrderWrapper({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const { id } = useParams();
  return <CreateSalesOrder orderId={id} onSave={onSave} onCancel={onCancel} />;
}

function EditDeliveryChallanWrapper({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const { id } = useParams();
  return <CreateDeliveryChallan challanId={id} onSave={onSave} onCancel={onCancel} />;
}

function EditQuotationWrapper({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const { id } = useParams();
  return <CreateQuotation quotationId={id} onSave={onSave} onCancel={onCancel} />;
}

// View wrappers
function ViewQuotationWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <CreateQuotation
      quotationId={id}
      defaultPreview={true}
      onSave={() => navigate('/sales')}
      onCancel={() => navigate('/sales')}
    />
  );
}

function ViewEstimateWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <CreateEstimate
      estimateId={id}
      defaultPreview={true}
      onSave={() => navigate('/sales')}
      onCancel={() => navigate('/sales')}
    />
  );
}

function ViewSalesOrderWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <CreateSalesOrder
      orderId={id}
      defaultPreview={true}
      onSave={() => navigate('/sales')}
      onCancel={() => navigate('/sales')}
    />
  );
}

function ViewDeliveryChallanWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <CreateDeliveryChallan
      challanId={id}
      defaultPreview={true}
      onSave={() => navigate('/sales')}
      onCancel={() => navigate('/sales')}
    />
  );
}

export function SalesModule() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("invoices");
  const [searchTerm, setSearchTerm] = useState("");

  // TanStack Query hooks - automatic caching, refetching, and loading states
  const { data: invoicesData, isLoading: invoicesLoading, refetch: refetchInvoices } = useInvoices();
  const { data: estimatesData, isLoading: estimatesLoading, refetch: refetchEstimates } = useEstimates();
  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useSalesOrders();
  const { data: challansData, isLoading: challansLoading, refetch: refetchChallans } = useDeliveryChallans();
  const { data: quotationsData, isLoading: quotationsLoading, refetch: refetchQuotations } = useQuotations();

  // Mutations with automatic cache invalidation
  const deleteInvoiceMutation = useDeleteInvoice();
  const deleteEstimateMutation = useDeleteEstimate();
  const deleteSalesOrderMutation = useDeleteSalesOrder();
  const deleteChallanMutation = useDeleteDeliveryChallan();
  const deleteQuotationMutation = useDeleteQuotation();

  // Create/Update mutations
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const createEstimateMutation = useCreateEstimate();
  const createSalesOrderMutation = useCreateSalesOrder();
  const createChallanMutation = useCreateDeliveryChallan();

  // Extract data from API responses (ensure arrays)
  // API response structure: { success: true, data: { [entityName]: [], pagination: {} } }
  const invoicesFromApi = invoicesData?.data as any;
  const invoices = Array.isArray(invoicesFromApi?.invoices) ? invoicesFromApi.invoices : (Array.isArray(invoicesFromApi) ? invoicesFromApi : []);

  // Estimates: data.estimates
  const estimatesFromApi = estimatesData?.data as any;
  const estimates = Array.isArray(estimatesFromApi?.estimates) ? estimatesFromApi.estimates : (Array.isArray(estimatesFromApi) ? estimatesFromApi : []);

  // Sales Orders: data.orders
  const ordersFromApi = ordersData?.data as any;
  const salesOrders = Array.isArray(ordersFromApi?.orders) ? ordersFromApi.orders : (Array.isArray(ordersFromApi) ? ordersFromApi : []);

  // Delivery Challans: data.challans or data directly
  const challansFromApi = challansData?.data as any;
  const challans = Array.isArray(challansFromApi?.challans) ? challansFromApi.challans : (Array.isArray(challansFromApi) ? challansFromApi : []);

  // Quotations: data.quotations
  const quotationsFromApi = quotationsData?.data as any;
  const quotations = Array.isArray(quotationsFromApi?.quotations) ? quotationsFromApi.quotations : (Array.isArray(quotationsFromApi) ? quotationsFromApi : []);

  // Client-side search filter
  const filteredInvoices = searchTerm
    ? invoices.filter((invoice: any) =>
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.status?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : invoices;

  // Save handlers - call API then navigate back
  const handleSaveInvoice = async (data: any) => {
    try {
      if (data.id) {
        await updateInvoiceMutation.mutateAsync({ id: data.id, data });
      } else {
        await createInvoiceMutation.mutateAsync(data);
      }
      navigate('/sales');
    } catch (error) {
      // Error toast is handled by the mutation's onError
      console.error('Failed to save invoice:', error);
    }
  };

  const handleSaveEstimate = async (data: any) => {
    try {
      await createEstimateMutation.mutateAsync(data);
      navigate('/sales');
    } catch (error) {
      console.error('Failed to save estimate:', error);
    }
  };

  const handleSaveOrder = async (data: any) => {
    try {
      await createSalesOrderMutation.mutateAsync(data);
      navigate('/sales');
    } catch (error) {
      console.error('Failed to save sales order:', error);
    }
  };

  const handleSaveChallan = async (data: any) => {
    try {
      await createChallanMutation.mutateAsync(data);
      navigate('/sales');
    } catch (error) {
      console.error('Failed to save delivery challan:', error);
    }
  };

  // Delete handlers - using mutations (auto-invalidate cache)
  const handleDeleteInvoice = (id: string) => {
    deleteInvoiceMutation.mutate(id);
  };

  const handleDeleteEstimate = (id: string) => {
    deleteEstimateMutation.mutate(id);
  };

  const handleDeleteOrder = (id: string) => {
    deleteSalesOrderMutation.mutate(id);
  };

  const handleDeleteChallan = (id: string) => {
    deleteChallanMutation.mutate(id);
  };

  const handleDeleteQuotation = (id: string) => {
    deleteQuotationMutation.mutate(id);
  };

  const handleExport = () => {
    toast.info('Exporting invoices to PDF...');
  };

  const handleNavBack = () => navigate('/sales');

  return (
    <Routes>
      <Route
        path=""
        element={
          <SalesOverview
            invoices={invoices}
            filteredInvoices={filteredInvoices}
            loading={invoicesLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onDeleteInvoice={handleDeleteInvoice}
            onDeleteQuotation={handleDeleteQuotation}
            onRefresh={() => refetchInvoices()}
            onRefreshEstimates={() => refetchEstimates()}
            onRefreshOrders={() => refetchOrders()}
            onRefreshChallans={() => refetchChallans()}
            onRefreshQuotations={() => refetchQuotations()}
            onExport={handleExport}
            estimates={estimates}
            estimatesLoading={estimatesLoading}
            quotations={quotations}
            quotationsLoading={quotationsLoading}
            salesOrders={salesOrders}
            ordersLoading={ordersLoading}
            challans={challans}
            challansLoading={challansLoading}
          />
        }
      />

      {/* Invoice Routes */}
      <Route
        path="invoices/new"
        element={
          <CreateInvoice
            onSave={handleSaveInvoice}
            onCancel={handleNavBack}
          />
        }
      />
      <Route path="invoices/:id" element={<ViewInvoice />} />
      <Route
        path="invoices/:id/edit"
        element={
          <EditInvoiceWrapper
            onSave={handleSaveInvoice}
            onCancel={handleNavBack}
          />
        }
      />

      {/* Estimates Routes */}
      <Route
        path="estimates/new"
        element={
          <CreateEstimate
            onSave={handleNavBack}
            onCancel={handleNavBack}
          />
        }
      />
      <Route path="estimates/:id" element={<ViewEstimateWrapper />} />
      <Route
        path="estimates/:id/edit"
        element={
          <EditEstimateWrapper
            onSave={handleNavBack}
            onCancel={handleNavBack}
          />
        }
      />

      {/* Quotations Routes */}
      <Route
        path="quotations/new"
        element={
          <CreateQuotation
            onSave={handleNavBack}
            onCancel={handleNavBack}
          />
        }
      />
      <Route path="quotations/:id" element={<ViewQuotationWrapper />} />
      <Route
        path="quotations/:id/edit"
        element={
          <EditQuotationWrapper
            onSave={handleNavBack}
            onCancel={handleNavBack}
          />
        }
      />

      {/* Sales Orders Routes */}
      <Route
        path="orders/new"
        element={
          <CreateSalesOrder
            onSave={handleNavBack}
            onCancel={handleNavBack}
          />
        }
      />
      <Route path="orders/:id" element={<ViewSalesOrderWrapper />} />
      <Route
        path="orders/:id/edit"
        element={
          <EditSalesOrderWrapper
            onSave={handleNavBack}
            onCancel={handleNavBack}
          />
        }
      />

      {/* Delivery Challans Routes */}
      <Route
        path="challans/new"
        element={
          <CreateDeliveryChallan
            onSave={handleNavBack}
            onCancel={handleNavBack}
          />
        }
      />
      <Route path="challans/:id" element={<ViewDeliveryChallanWrapper />} />
      <Route
        path="challans/:id/edit"
        element={
          <EditDeliveryChallanWrapper
            onSave={handleNavBack}
            onCancel={handleNavBack}
          />
        }
      />

      {/* Route aliases for alternative URL patterns */}
      <Route
        path="sales-orders/new"
        element={
          <CreateSalesOrder
            onSave={handleNavBack}
            onCancel={handleNavBack}
          />
        }
      />
      <Route path="sales-orders/:id" element={<ViewSalesOrderWrapper />} />
      <Route
        path="sales-orders/:id/edit"
        element={
          <EditSalesOrderWrapper
            onSave={handleNavBack}
            onCancel={handleNavBack}
          />
        }
      />
      <Route
        path="delivery-challans/new"
        element={
          <CreateDeliveryChallan
            onSave={handleNavBack}
            onCancel={handleNavBack}
          />
        }
      />
      <Route path="delivery-challans/:id" element={<ViewDeliveryChallanWrapper />} />
      <Route
        path="delivery-challans/:id/edit"
        element={
          <EditDeliveryChallanWrapper
            onSave={handleNavBack}
            onCancel={handleNavBack}
          />
        }
      />
    </Routes>
  );
}