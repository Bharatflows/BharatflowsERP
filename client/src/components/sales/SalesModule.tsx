import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  useCreateDeliveryChallan,
  useCreditNotes,
  useCreateQuotation,
  useUpdateEstimate,
  useUpdateSalesOrder,
  useUpdateDeliveryChallan,
  useUpdateQuotation,
  useCreateCreditNote,
  useDeleteCreditNote,
  useUpdateCreditNote
} from "../../hooks/useSales";
import { SalesOverview } from "./SalesOverview";
import { CreateInvoice } from "./CreateInvoice";
import { ViewInvoice } from "./ViewInvoice";
import { CreateEstimate } from "./CreateEstimate";
import { CreateSalesOrder } from "./CreateSalesOrder";
import { CreateDeliveryChallan } from "./CreateDeliveryChallan";
import { CreateQuotation } from "./CreateQuotation";
import { CreateCreditNote } from "./CreateCreditNote";
import { toast } from "sonner";

// Wrapper components for edit routes
function EditInvoiceWrapper({ onSave, onCancel }: { onSave: (data: any) => void; onCancel: () => void }) {
  const { id } = useParams();
  return <CreateInvoice invoiceId={id} onSave={onSave} onCancel={onCancel} />;
}

function EditEstimateWrapper({ onSave, onCancel }: { onSave: (data: any) => void; onCancel: () => void }) {
  const { id } = useParams();
  return <CreateEstimate estimateId={id} onSave={onSave} onCancel={onCancel} />;
}

function EditSalesOrderWrapper({ onSave, onCancel }: { onSave: (data: any) => void; onCancel: () => void }) {
  const { id } = useParams();
  return <CreateSalesOrder orderId={id} onSave={onSave} onCancel={onCancel} />;
}

function EditDeliveryChallanWrapper({ onSave, onCancel }: { onSave: (data: any) => void; onCancel: () => void }) {
  const { id } = useParams();
  return <CreateDeliveryChallan challanId={id} onSave={onSave} onCancel={onCancel} />;
}

function EditQuotationWrapper({ onSave, onCancel }: { onSave: (data: any) => void; onCancel: () => void }) {
  const { id } = useParams();
  return <CreateQuotation quotationId={id} onSave={onSave} onCancel={onCancel} />;
}

function EditCreditNoteWrapper({ onSave, onCancel }: { onSave: (data: any) => void; onCancel: () => void }) {
  const { id } = useParams();
  return <CreateCreditNote creditNoteId={id} onSave={onSave} onCancel={onCancel} />;
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

function ViewCreditNoteWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <CreateCreditNote
      creditNoteId={id}
      defaultPreview={true}
      onSave={(data) => console.log('Update from view', data)}
      onCancel={() => navigate('/sales')}
    />
  );
}

export function SalesModule() {
  const navigate = useNavigate();
  console.log("SalesModule component rendering"); // Debugging load issue
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("invoices");


  // Hooks
  const { data: invoices = [], isLoading: invoicesLoading, refetch: refetchInvoices } = useInvoices();
  const { data: estimates = [], isLoading: estimatesLoading, refetch: refetchEstimates } = useEstimates();
  const { data: salesOrders = [], isLoading: ordersLoading, refetch: refetchOrders } = useSalesOrders();
  const { data: challans = [], isLoading: challansLoading, refetch: refetchChallans } = useDeliveryChallans();
  const { data: quotations = [], isLoading: quotationsLoading, refetch: refetchQuotations } = useQuotations();

  // Mutations
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const deleteInvoiceMutation = useDeleteInvoice();

  const createEstimateMutation = useCreateEstimate();
  const updateEstimateMutation = useUpdateEstimate();
  const deleteEstimateMutation = useDeleteEstimate();

  const createOrderMutation = useCreateSalesOrder();
  const updateOrderMutation = useUpdateSalesOrder();
  const deleteOrderMutation = useDeleteSalesOrder();

  const createChallanMutation = useCreateDeliveryChallan();
  const updateChallanMutation = useUpdateDeliveryChallan();
  const deleteChallanMutation = useDeleteDeliveryChallan();

  const createQuotationMutation = useCreateQuotation();
  const updateQuotationMutation = useUpdateQuotation();
  const deleteQuotationMutation = useDeleteQuotation();

  const createCreditNoteMutation = useCreateCreditNote();
  const updateCreditNoteMutation = useUpdateCreditNote();

  const extractArray = (resp: any): any[] => {
    if (Array.isArray(resp)) return resp;
    if (resp && typeof resp === 'object') {
      // Unwrap standard API response wrapper: { success, data: { invoices: [...] } }
      const inner = resp.data && typeof resp.data === 'object' && !Array.isArray(resp.data) ? resp.data : resp;
      // Check for known array keys in the (possibly unwrapped) object
      for (const key of ['docs', 'data', 'orders', 'items', 'invoices', 'estimates', 'quotations', 'challans', 'salesOrders']) {
        if (Array.isArray(inner[key])) return inner[key];
      }
      // If data itself is an array
      if (Array.isArray(resp.data)) return resp.data;
    }
    return [];
  };

  const invoicesList = extractArray(invoices);
  const estimatesList = extractArray(estimates);
  const salesOrdersList = extractArray(salesOrders);
  const challansList = extractArray(challans);
  const quotationsList = extractArray(quotations);

  const handleSaveInvoice = async (data: any) => {
    try {
      // CreateInvoice already saved via API — just invalidate cache and navigate
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate('/sales');
    } catch (error) {
      console.error('Failed to save invoice:', error);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      await deleteInvoiceMutation.mutateAsync(id);
      toast.success("Invoice deleted successfully");
    }
  };

  const handleDeleteEstimate = async (id: string) => {
    if (confirm("Are you sure you want to delete this estimate?")) {
      await deleteEstimateMutation.mutateAsync(id);
      toast.success("Estimate deleted successfully");
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    if (confirm("Are you sure you want to delete this quotation?")) {
      await deleteQuotationMutation.mutateAsync(id);
      toast.success("Quotation deleted successfully");
    }
  };

  const handleNavBack = () => navigate('/sales');

  const handleSaveEstimate = async (data: any) => {
    try {
      if (data.id) {
        await updateEstimateMutation.mutateAsync({ id: data.id, data });
        toast.success("Estimate updated successfully");
      } else {
        await createEstimateMutation.mutateAsync(data);
        toast.success("Estimate created successfully");
      }
      navigate('/sales');
    } catch (error) {
      console.error(error);
      toast.error("Failed to save estimate");
    }
  };

  const handleSaveOrder = async (data: any) => {
    try {
      if (data.id) {
        await updateOrderMutation.mutateAsync({ id: data.id, data });
        toast.success("Sales Order updated successfully");
      } else {
        await createOrderMutation.mutateAsync(data);
        toast.success("Sales Order created successfully");
      }
      navigate('/sales');
    } catch (error) {
      console.error(error);
      toast.error("Failed to save sales order");
    }
  };

  const handleSaveChallan = async (data: any) => {
    try {
      if (data.id) {
        await updateChallanMutation.mutateAsync({ id: data.id, data });
        toast.success("Delivery Challan updated successfully");
      } else {
        await createChallanMutation.mutateAsync(data);
        toast.success("Delivery Challan created successfully");
      }
      navigate('/sales');
    } catch (error) {
      console.error(error);
      toast.error("Failed to save delivery challan");
    }
  };

  const handleSaveQuotation = async (data: any) => {
    try {
      if (data.id) {
        await updateQuotationMutation.mutateAsync({ id: data.id, data });
        toast.success("Quotation updated successfully");
      } else {
        await createQuotationMutation.mutateAsync(data);
        toast.success("Quotation created successfully");
      }
      navigate('/sales');
    } catch (error) {
      console.error(error);
      toast.error("Failed to save quotation");
    }
  };

  const handleSaveCreditNote = async (data: any) => {
    try {
      if (data.id) {
        await updateCreditNoteMutation.mutateAsync({ id: data.id, data });
        toast.success("Credit Note updated successfully");
      } else {
        await createCreditNoteMutation.mutateAsync(data);
        toast.success("Credit Note created successfully");
      }
      navigate('/sales');
    } catch (error) {
      console.error(error);
      toast.error("Failed to save credit note");
    }
  };

  return (
    <>
      <Routes>
        <Route
          path=""
          element={
            <SalesOverview
              invoices={invoicesList}
              loading={invoicesLoading}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onDeleteInvoice={handleDeleteInvoice}
              onDeleteQuotation={handleDeleteQuotation}
              onRefresh={() => refetchInvoices()}
              onCreateNew={() => navigate('/sales/invoices/new')}
              onRefreshEstimates={() => refetchEstimates()}
              onRefreshOrders={() => refetchOrders()}
              onRefreshChallans={() => refetchChallans()}
              onRefreshQuotations={() => refetchQuotations()}
              onExport={() => toast.info("Export feature coming soon")}
              estimates={estimatesList}
              estimatesLoading={estimatesLoading}
              salesOrders={salesOrdersList}
              ordersLoading={ordersLoading}
              challans={challansList}
              challansLoading={challansLoading}
              quotations={quotationsList}
              quotationsLoading={quotationsLoading}
            />
          }
        />

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
              onSave={handleSaveEstimate}
              onCancel={handleNavBack}
            />
          }
        />
        <Route path="estimates/:id" element={<ViewEstimateWrapper />} />
        <Route
          path="estimates/:id/edit"
          element={
            <EditEstimateWrapper
              onSave={handleSaveEstimate}
              onCancel={handleNavBack}
            />
          }
        />

        {/* Quotations Routes */}
        <Route
          path="quotations/new"
          element={
            <CreateQuotation
              onSave={handleSaveQuotation}
              onCancel={handleNavBack}
            />
          }
        />
        <Route path="quotations/:id" element={<ViewQuotationWrapper />} />
        <Route
          path="quotations/:id/edit"
          element={
            <EditQuotationWrapper
              onSave={handleSaveQuotation}
              onCancel={handleNavBack}
            />
          }
        />

        {/* Sales Orders Routes */}
        <Route
          path="orders/new"
          element={
            <CreateSalesOrder
              onSave={handleSaveOrder}
              onCancel={handleNavBack}
            />
          }
        />
        <Route path="orders/:id" element={<ViewSalesOrderWrapper />} />
        <Route
          path="orders/:id/edit"
          element={
            <EditSalesOrderWrapper
              onSave={handleSaveOrder}
              onCancel={handleNavBack}
            />
          }
        />

        {/* Delivery Challans Routes */}
        <Route
          path="challans/new"
          element={
            <CreateDeliveryChallan
              onSave={handleSaveChallan}
              onCancel={handleNavBack}
            />
          }
        />
        <Route path="challans/:id" element={<ViewDeliveryChallanWrapper />} />
        <Route
          path="challans/:id/edit"
          element={
            <EditDeliveryChallanWrapper
              onSave={handleSaveChallan}
              onCancel={handleNavBack}
            />
          }
        />

        {/* Route aliases for alternative URL patterns */}
        <Route
          path="sales-orders/new"
          element={
            <CreateSalesOrder
              onSave={handleSaveOrder}
              onCancel={handleNavBack}
            />
          }
        />
        <Route path="sales-orders/:id" element={<ViewSalesOrderWrapper />} />
        <Route
          path="sales-orders/:id/edit"
          element={
            <EditSalesOrderWrapper
              onSave={handleSaveOrder}
              onCancel={handleNavBack}
            />
          }
        />
        <Route
          path="delivery-challans/new"
          element={
            <CreateDeliveryChallan
              onSave={handleSaveChallan}
              onCancel={handleNavBack}
            />
          }
        />
        <Route
          path="delivery-challans/:id/edit"
          element={
            <EditDeliveryChallanWrapper
              onSave={handleSaveChallan}
              onCancel={handleNavBack}
            />
          }
        />

        {/* Credit Notes Routes */}
        <Route
          path="credit-notes/new"
          element={
            <CreateCreditNote
              onSave={handleSaveCreditNote}
              onCancel={handleNavBack}
            />
          }
        />
        <Route path="credit-notes/:id" element={<ViewCreditNoteWrapper />} />
        <Route
          path="credit-notes/:id/edit"
          element={
            <EditCreditNoteWrapper
              onSave={handleSaveCreditNote}
              onCancel={handleNavBack}
            />
          }
        />
      </Routes>
    </>
  );
}