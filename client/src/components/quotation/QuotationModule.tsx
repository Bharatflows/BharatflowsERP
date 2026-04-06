import { useState } from "react";
import { Quote, Loader2 } from "lucide-react";
import { useQuotations, useDeleteQuotation, useConvertQuotation } from "../../hooks/useSales";
import type { Quotation } from "../../types";
import { QuotationList } from "./QuotationList";
import { QuotationForm } from "./QuotationForm";
import { QuotationDetail } from "./QuotationDetail";

type View = "list" | "create" | "edit" | "detail";

export function QuotationModule() {
  const [currentView, setCurrentView] = useState<View>("list");
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // API hooks
  const { data: response, isLoading } = useQuotations();
  const deleteQuotationMutation = useDeleteQuotation();
  const convertQuotationMutation = useConvertQuotation();

  const quotations = response?.data || [];

  const handleCreateSuccess = () => {
    setCurrentView("list");
  };

  const handleUpdateSuccess = () => {
    setCurrentView("list");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this quotation?")) {
      await deleteQuotationMutation.mutateAsync(id);
    }
  };

  const handleView = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setCurrentView("detail");
  };

  const handleEdit = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setCurrentView("edit");
  };

  const handleConvertToSO = async (quotationId: string) => {
    try {
      await convertQuotationMutation.mutateAsync(quotationId);
      setCurrentView("list");
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading quotations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {currentView === "list" && (
        <QuotationList
          quotations={quotations}
          onCreateNew={() => setCurrentView("create")}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
      {currentView === "create" && (
        <QuotationForm
          onSave={handleCreateSuccess}
          onCancel={() => setCurrentView("list")}
        />
      )}
      {currentView === "edit" && selectedQuotation && (
        <QuotationForm
          quotation={selectedQuotation}
          onSave={handleUpdateSuccess}
          onCancel={() => setCurrentView("list")}
        />
      )}
      {currentView === "detail" && selectedQuotation && (
        <QuotationDetail
          quotation={selectedQuotation}
          onBack={() => setCurrentView("list")}
          onEdit={() => setCurrentView("edit")}
          onConvertToSO={() => handleConvertToSO(selectedQuotation.id)}
        />
      )}
    </div>
  );
}
