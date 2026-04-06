import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { AccountingOverview } from "./AccountingOverview";
import { TrialBalance } from "./TrialBalance";
import { ProfitLoss } from "./ProfitLoss";
import { BalanceSheet } from "./BalanceSheet";
import { LedgerView } from "./LedgerView";
import { JournalEntry } from "./JournalEntry";
import { CostCenterManagement } from "./CostCenterManagement";
import { toast } from "sonner";

export function AccountingModule() {
    const [activeTab, setActiveTab] = useState<string>("dashboard");
    const [searchTerm, setSearchTerm] = useState("");

    const handleCreateVoucher = () => {
        toast.info("Opening journal entry form...");
    };

    const handleExport = () => {
        toast.info("Exporting accounting data...");
    };

    return (
        <div className="min-h-full">
            <Routes>
                {/* Sub-routes for financial statements */}
                <Route path="trial-balance" element={<TrialBalance />} />
                <Route path="profit-loss" element={<ProfitLoss />} />
                <Route path="balance-sheet" element={<BalanceSheet />} />
                <Route path="ledger/:id" element={<LedgerView />} />
                <Route path="journal-entry" element={<JournalEntry />} />
                <Route path="journal-entry/:id" element={<JournalEntry />} />
                <Route path="cost-centers" element={<CostCenterManagement />} />

                {/* Default: Overview */}
                <Route
                    path="*"
                    element={
                        <AccountingOverview
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            onCreateVoucher={handleCreateVoucher}
                            onExport={handleExport}
                        />
                    }
                />
            </Routes>
        </div>
    );
}
