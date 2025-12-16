import { useState } from "react";
import { CustomerList } from "./CustomerList";
import { SupplierList } from "./SupplierList";
import { AddEditCustomer } from "./AddEditCustomer";
import { AddEditSupplier } from "./AddEditSupplier";
import { PartyLedger } from "./PartyLedger";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Users, Building2, Plus, Search, Filter, Download } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ModuleHeader } from "../ui/module-header";

type View = "list" | "create" | "edit" | "ledger";
type Tab = "customers" | "suppliers";
type PartyType = "customer" | "supplier";

interface PartiesModuleProps {
  onBack?: () => void;
}

export function PartiesModule({ onBack }: PartiesModuleProps) {
  const [activeTab, setActiveTab] = useState<Tab>("customers");
  const [customerView, setCustomerView] = useState<View>("list");
  const [supplierView, setSupplierView] = useState<View>("list");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [ledgerParty, setLedgerParty] = useState<{ id: string; name: string; type: PartyType } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  return (
    <div className="p-6 space-y-6 min-h-full bg-background">
      <ModuleHeader
        title="Parties Management"
        description="Manage your customers and suppliers"
        showBackButton={false}
        icon={<Users className="size-5 text-primary" />}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Export
            </Button>
            {activeTab === "suppliers" && (
              <Button size="sm" onClick={handleCreateSupplier}>
                <Building2 className="size-4 mr-2" />
                New Supplier
              </Button>
            )}
            {activeTab === "customers" && (
              <Button size="sm" onClick={handleCreateCustomer}>
                <Plus className="size-4 mr-2" />
                New Customer
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
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

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
          <TabsList>
            <TabsTrigger value="customers">
              <Users className="size-4 mr-2" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="suppliers">
              <Building2 className="size-4 mr-2" />
              Suppliers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            {customerView === "list" && (
              <CustomerList
                onCreateNew={handleCreateCustomer}
                onEditCustomer={(id) => {
                  setSelectedCustomerId(id);
                  setCustomerView("edit");
                }}
                onViewLedger={(id, name) => handleViewLedger(id, name, "customer")}
              />
            )}
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
          </TabsContent>

          <TabsContent value="suppliers">
            {supplierView === "list" && (
              <SupplierList
                onCreateNew={handleCreateSupplier}
                onEditSupplier={(id) => {
                  setSelectedSupplierId(id);
                  setSupplierView("edit");
                }}
                onViewLedger={(id, name) => handleViewLedger(id, name, "supplier")}
              />
            )}
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

