import { useState } from "react";
import { QuotationList } from "./QuotationList";
import { QuotationForm } from "./QuotationForm";
import { QuotationDetail } from "./QuotationDetail";

export interface QuotationItem {
  id: string;
  productName: string;
  hsn: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  taxRate: number;
  amount: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  date: string;
  validUntil: string;
  partyName: string;
  partyGSTIN: string;
  partyAddress: string;
  items: QuotationItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  status: "Draft" | "Sent" | "Viewed" | "Accepted" | "Rejected" | "Converted";
  terms: string;
  notes: string;
  convertedToSO?: string;
  createdBy: string;
}

type View = "list" | "create" | "edit" | "detail";

export function QuotationModule() {
  const [currentView, setCurrentView] = useState<View>("list");
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // Mock data
  const [quotations, setQuotations] = useState<Quotation[]>([
    {
      id: "1",
      quotationNumber: "QT-2024-001",
      date: "2024-11-01",
      validUntil: "2024-11-30",
      partyName: "Sharma Enterprises",
      partyGSTIN: "27AABCU9603R1ZM",
      partyAddress: "123 MG Road, Mumbai, Maharashtra - 400001",
      items: [
        {
          id: "1",
          productName: "Premium Widget",
          hsn: "8471",
          quantity: 10,
          unit: "pcs",
          rate: 5000,
          discount: 5,
          taxRate: 18,
          amount: 47500,
        },
      ],
      subtotal: 47500,
      cgst: 4275,
      sgst: 4275,
      igst: 0,
      total: 56050,
      status: "Sent",
      terms: "Payment within 30 days of invoice",
      notes: "Thank you for your business",
      createdBy: "Admin",
    },
    {
      id: "2",
      quotationNumber: "QT-2024-002",
      date: "2024-11-10",
      validUntil: "2024-12-10",
      partyName: "Tech Solutions Pvt Ltd",
      partyGSTIN: "29AADCT1234F1Z5",
      partyAddress: "456 Brigade Road, Bangalore, Karnataka - 560001",
      items: [
        {
          id: "1",
          productName: "Software License",
          hsn: "9973",
          quantity: 5,
          unit: "nos",
          rate: 15000,
          discount: 10,
          taxRate: 18,
          amount: 67500,
        },
      ],
      subtotal: 67500,
      cgst: 6075,
      sgst: 6075,
      igst: 0,
      total: 79650,
      status: "Accepted",
      terms: "50% advance, 50% on delivery",
      notes: "Includes 1 year support",
      createdBy: "Admin",
    },
  ]);

  const handleCreate = (quotation: Quotation) => {
    setQuotations([quotation, ...quotations]);
    setCurrentView("list");
  };

  const handleUpdate = (quotation: Quotation) => {
    setQuotations(quotations.map((q) => (q.id === quotation.id ? quotation : q)));
    setCurrentView("list");
  };

  const handleDelete = (id: string) => {
    setQuotations(quotations.filter((q) => q.id !== id));
  };

  const handleView = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setCurrentView("detail");
  };

  const handleEdit = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setCurrentView("edit");
  };

  const handleConvertToSO = (quotation: Quotation) => {
    // Update quotation status to converted
    const updatedQuotation = {
      ...quotation,
      status: "Converted" as const,
      convertedToSO: `SO-2024-${String(quotations.length + 1).padStart(3, "0")}`,
    };
    setQuotations(quotations.map((q) => (q.id === quotation.id ? updatedQuotation : q)));
    setCurrentView("list");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
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
          onSave={handleCreate}
          onCancel={() => setCurrentView("list")}
        />
      )}
      {currentView === "edit" && selectedQuotation && (
        <QuotationForm
          quotation={selectedQuotation}
          onSave={handleUpdate}
          onCancel={() => setCurrentView("list")}
        />
      )}
      {currentView === "detail" && selectedQuotation && (
        <QuotationDetail
          quotation={selectedQuotation}
          onBack={() => setCurrentView("list")}
          onEdit={() => setCurrentView("edit")}
          onConvertToSO={handleConvertToSO}
        />
      )}
    </div>
  );
}
