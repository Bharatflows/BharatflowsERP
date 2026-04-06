import { useState } from "react";
import { CustomerList } from "./CustomerList";
import { SupplierList } from "./SupplierList";
import { AddEditCustomer } from "./AddEditCustomer";
import { AddEditSupplier } from "./AddEditSupplier";
import { PartyLedger } from "./PartyLedger";
import { PartiesOverview } from "./PartiesOverview";
import { useCustomers, useSuppliers } from "../../hooks/useParties";
import { toast } from "sonner";

type View = "list" | "create" | "edit" | "ledger";
type Tab = "customers" | "suppliers";
type PartyType = "customer" | "supplier";

interface PartiesModuleProps {
  onBack?: () => void;
}

export function PartiesModule({ onBack }: PartiesModuleProps) {
  const [activeTab, setActiveTab] = useState<string>("customers");
  const [customerView, setCustomerView] = useState<View>("list");
  const [supplierView, setSupplierView] = useState<View>("list");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [ledgerParty, setLedgerParty] = useState<{ id: string; name: string; type: PartyType } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Data fetching
  const { data: customersData, isLoading: customersLoading } = useCustomers();
  const { data: suppliersData, isLoading: suppliersLoading } = useSuppliers();

  // Extract data
  const customersResult = customersData?.data as any;
  const customers = Array.isArray(customersResult?.parties) ? customersResult.parties : (Array.isArray(customersResult) ? customersResult : []);

  const suppliersResult = suppliersData?.data as any;
  const suppliers = Array.isArray(suppliersResult?.parties) ? suppliersResult.parties : (Array.isArray(suppliersResult) ? suppliersResult : []);

  // Calculate stats (mock calculation for now, ideally from API)
  const totalReceivable = customers.reduce((sum: number, c: any) => sum + Number(c.balance || 0), 0);
  const totalPayable = suppliers.reduce((sum: number, s: any) => sum + Number(s.balance || 0), 0);

  const handleCreateCustomer = () => {
    setCustomerView("create");
    setSelectedCustomerId(null);
  };

  const handleCreateSupplier = () => {
    setSupplierView("create");
    setSelectedSupplierId(null);
  };

  const handleCustomerSaved = () => {
    setCustomerView("list");
  };

  const handleSupplierSaved = () => {
    setSupplierView("list");
  };

  const handleBackToList = () => {
    if (activeTab === "customers") {
      setCustomerView("list");
      setLedgerParty(null);
    } else {
      setSupplierView("list");
      setLedgerParty(null);
    }
  };

  const handleViewLedger = (id: string, name: string, type: PartyType) => {
    setLedgerParty({ id, name, type });
    if (type === "customer") {
      setCustomerView("ledger");
    } else {
      setSupplierView("ledger");
    }
  };

  const handleExport = () => {
    toast.info("Exporting parties data...");
  };

  return (
    <div className="min-h-full">
      {(activeTab === "customers" && customerView === "list") || (activeTab === "suppliers" && supplierView === "list") ? (
        <PartiesOverview
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          customers={customers}
          customersLoading={customersLoading}
          suppliers={suppliers}
          suppliersLoading={suppliersLoading}
          totalReceivable={totalReceivable}
          totalPayable={totalPayable}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onCreateCustomer={handleCreateCustomer}
          onCreateSupplier={handleCreateSupplier}
          onEditCustomer={(id) => {
            setSelectedCustomerId(id);
            setCustomerView("edit");
          }}
          onEditSupplier={(id) => {
            setSelectedSupplierId(id);
            setSupplierView("edit");
          }}
          onViewLedger={handleViewLedger}
          onExport={handleExport}
        />
      ) : (
        <div className="p-6">
          {activeTab === "customers" && (
            <>
              {(customerView === "create" || customerView === "edit") && (
                <AddEditCustomer
                  customerId={selectedCustomerId}
                  onSave={handleCustomerSaved}
                  onCancel={handleBackToList}
                />
              )}
              {customerView === "ledger" && ledgerParty && (
                <PartyLedger
                  partyId={ledgerParty.id}
                  partyName={ledgerParty.name}
                  partyType={ledgerParty.type}
                  onBack={handleBackToList}
                />
              )}
            </>
          )}

          {activeTab === "suppliers" && (
            <>
              {(supplierView === "create" || supplierView === "edit") && (
                <AddEditSupplier
                  supplierId={selectedSupplierId}
                  onSave={handleSupplierSaved}
                  onCancel={handleBackToList}
                />
              )}
              {supplierView === "ledger" && ledgerParty && (
                <PartyLedger
                  partyId={ledgerParty.id}
                  partyName={ledgerParty.name}
                  partyType={ledgerParty.type}
                  onBack={handleBackToList}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

