import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AccountingDashboard from './AccountingDashboard';
import ChartOfAccounts from './ChartOfAccounts';
import JournalEntryForm from './JournalEntryForm';
import TrialBalance from './TrialBalance';
import VoucherList from './VoucherList';
import LedgerView from './LedgerView';
import ProfitLoss from './ProfitLoss';
import BalanceSheet from './BalanceSheet';
import PaymentReceipts from './PaymentReceipts';

export const AccountingModule = () => {
    return (
        <Routes>
            <Route index element={<AccountingDashboard />} />
            <Route path="chart-of-accounts" element={<ChartOfAccounts />} />
            <Route path="vouchers" element={<VoucherList />} />
            <Route path="vouchers/new" element={<JournalEntryForm />} />
            <Route path="trial-balance" element={<TrialBalance />} />
            <Route path="ledger/:id" element={<LedgerView />} />
            <Route path="profit-loss" element={<ProfitLoss />} />
            <Route path="balance-sheet" element={<BalanceSheet />} />
            <Route path="receipts" element={<PaymentReceipts />} />
            <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
    );
};

