import { useState, Component, ErrorInfo, ReactNode } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import {
  usePurchaseOrders,
  usePurchaseBills,
  useCreateDebitNote
} from "../../hooks/usePurchase";
import { PurchaseOverview } from "./PurchaseOverview";
import { ViewPurchaseOrder } from "./ViewPurchaseOrder";
import { ViewPurchaseBill } from "./ViewPurchaseBill";
import { ViewGoodsReceivedNote } from "./ViewGoodsReceivedNote";
import { CreatePurchaseOrder } from "./CreatePurchaseOrder";
import { CreatePurchaseBill } from "./CreatePurchaseBill";
import { CreateGoodsReceivedNote } from "./CreateGoodsReceivedNote";
import { CreateDebitNote } from "./CreateDebitNote";
import { ViewDebitNote } from "./ViewDebitNote";
import { AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("PurchaseModule Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
          <AlertCircle className="size-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            {this.state.error?.message || "An unexpected error occurred in the Purchase module."}
          </p>
          <Button onClick={() => this.setState({ hasError: false, error: null })} variant="outline">
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function PurchaseModule() {
  const navigate = useNavigate();
  console.log("PurchaseModule component rendering");
  const [activeTab, setActiveTab] = useState("orders");

  // Data fetching
  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = usePurchaseOrders();
  const { data: billsData, isLoading: billsLoading, refetch: refetchBills } = usePurchaseBills();

  // Mutations
  const createDebitNoteMutation = useCreateDebitNote();

  // Extract data
  const ordersResult = ordersData?.data as any;
  const orders = Array.isArray(ordersResult?.orders) ? ordersResult.orders : (Array.isArray(ordersResult) ? ordersResult : []);

  const billsResult = billsData?.data as any;
  const bills = Array.isArray(billsResult?.bills) ? billsResult.bills : (Array.isArray(billsResult) ? billsResult : []);

  return (
    <ErrorBoundary>
      <Routes>
        <Route
          path=""
          element={
            <PurchaseOverview
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              orders={orders}
              ordersLoading={ordersLoading}
              bills={bills}
              billsLoading={billsLoading}
            />
          }
        />

        {/* Purchase Orders */}
        <Route
          path="orders/new"
          element={
            <CreatePurchaseOrder
              orderId={null}
              onSave={() => navigate('/purchase')}
              onCancel={() => navigate('/purchase')}
            />
          }
        />
        <Route path="orders/:id" element={<ViewPurchaseOrder />} />
        <Route
          path="orders/:id/edit"
          element={
            <WrapperCreatePurchaseOrder
              onSave={() => navigate('/purchase')}
              onCancel={() => navigate('/purchase')}
            />
          }
        />

        {/* Purchase Bills */}
        <Route
          path="bills/new"
          element={
            <CreatePurchaseBill
              billId={null}
              onSave={() => navigate('/purchase')}
              onCancel={() => navigate('/purchase')}
            />
          }
        />
        <Route path="bills/:id" element={<ViewPurchaseBill />} />
        <Route
          path="bills/:id/edit"
          element={
            <WrapperCreatePurchaseBill
              onSave={() => navigate('/purchase')}
              onCancel={() => navigate('/purchase')}
            />
          }
        />

        {/* Goods Received Notes */}
        <Route
          path="grn/new"
          element={
            <CreateGoodsReceivedNote
              grnId={null}
              onSave={() => navigate('/purchase')}
              onCancel={() => navigate('/purchase')}
            />
          }
        />
        <Route path="grn/:id" element={<ViewGoodsReceivedNote />} />
        <Route
          path="grn/:id/edit"
          element={
            <WrapperCreateGoodsReceivedNote
              onSave={() => navigate('/purchase')}
              onCancel={() => navigate('/purchase')}
            />
          }
        />
        {/* Debit Notes */}
        <Route
          path="debit-notes/new"
          element={
            <CreateDebitNote
              debitNoteId={null}
              onSave={(data) => {
                createDebitNoteMutation.mutate(data, {
                  onSuccess: () => navigate('/purchase')
                });
              }}
              onCancel={() => navigate('/purchase')}
            />
          }
        />
        <Route path="debit-notes/:id" element={<ViewDebitNote />} />
        <Route
          path="debit-notes/:id/edit"
          element={
            <WrapperCreateDebitNote
              onSave={(data) => {
                // For now, reuse create or implement update mutation
                createDebitNoteMutation.mutate(data, {
                  onSuccess: () => navigate('/purchase')
                });
              }}
              onCancel={() => navigate('/purchase')}
            />
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}

// Wrapper components to extract ID from params
function WrapperCreatePurchaseOrder({ onSave, onCancel }: { onSave: () => void, onCancel: () => void }) {
  const { id } = useParams();
  return <CreatePurchaseOrder orderId={id || null} onSave={onSave} onCancel={onCancel} />;
}

function WrapperCreatePurchaseBill({ onSave, onCancel }: { onSave: () => void, onCancel: () => void }) {
  const { id } = useParams();
  return <CreatePurchaseBill billId={id || null} onSave={onSave} onCancel={onCancel} />;
}

function WrapperCreateGoodsReceivedNote({ onSave, onCancel }: { onSave: () => void, onCancel: () => void }) {
  const { id } = useParams();
  return <CreateGoodsReceivedNote grnId={id || null} onSave={onSave} onCancel={onCancel} />;
}

function WrapperCreateDebitNote({ onSave, onCancel }: { onSave: (data: any) => void, onCancel: () => void }) {
  const { id } = useParams();
  return <CreateDebitNote debitNoteId={id || null} onSave={onSave} onCancel={onCancel} />;
}

export default PurchaseModule;