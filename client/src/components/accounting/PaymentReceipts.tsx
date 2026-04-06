import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService, partiesService, bankingService } from '../../services/modules.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, RefreshCw, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ModuleHeader } from "../ui/module-header";
import { Receipt } from 'lucide-react';

export const PaymentReceipts = () => {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        partyId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        mode: 'CASH',
        reference: '',
        notes: '',
        bankAccountId: ''
    });

    // Fetch Receipts
    const { data: receiptsResponse, isLoading, refetch } = useQuery({
        queryKey: ['receipts'],
        queryFn: () => accountingService.getReceipts()
    });

    // Fetch Parties for Dropdown
    const { data: partiesResponse } = useQuery({
        queryKey: ['parties-all'],
        queryFn: () => partiesService.getAll({ limit: 100 }) // Fetch top 100 or use search
    });

    const { data: accountsResponse } = useQuery({
        queryKey: ['bank-accounts'],
        queryFn: () => bankingService.getAll()
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => accountingService.createReceipt(data),
        onSuccess: () => {
            toast.success('Receipt created successfully');
            queryClient.invalidateQueries({ queryKey: ['receipts'] });
            setIsCreateOpen(false);
            setFormData({
                partyId: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                mode: 'CASH',
                reference: '',
                notes: '',
                bankAccountId: ''
            });
        },
        onError: (error: any) => {
            toast.error('Failed to create receipt: ' + error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.partyId || !formData.amount) {
            toast.error('Party and Amount are required');
            return;
        }
        createMutation.mutate({
            ...formData,
            amount: Number(formData.amount)
        });
    };

    const receipts = receiptsResponse?.data?.receipts || [];
    const parties = partiesResponse?.data || [];
    const accounts = accountsResponse?.data || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <ModuleHeader
                title="Payment Receipts"
                description="Manage and record incoming payments from parties"
                showBackButton={true}
                backTo="/accounting"
                icon={<Receipt className="size-5 text-primary" />}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="gap-2 shadow-lg hover:shadow-primary/20 transition-all">
                                    <Plus className="h-4 w-4" /> Create Receipt
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Create New Receipt</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="date">Date</Label>
                                            <Input
                                                id="date"
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="amount">Amount (₹)</Label>
                                            <Input
                                                id="amount"
                                                type="number"
                                                step="0.01"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="party">Received From</Label>
                                        <Select
                                            value={formData.partyId}
                                            onValueChange={(val) => setFormData({ ...formData, partyId: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Party" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {parties.map((party: any) => (
                                                    <SelectItem key={party.id} value={party.id}>
                                                        {party.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="mode">Payment Mode</Label>
                                            <Select
                                                value={formData.mode}
                                                onValueChange={(val) => setFormData({ ...formData, mode: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="CASH">Cash</SelectItem>
                                                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                                                    <SelectItem value="UPI">UPI</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {(formData.mode === 'BANK' || formData.mode === 'UPI') && (
                                            <div className="space-y-2">
                                                <Label htmlFor="bankAccount">Deposit To</Label>
                                                <Select
                                                    value={formData.bankAccountId}
                                                    onValueChange={(val) => setFormData({ ...formData, bankAccountId: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Account" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {accounts.map((acc: any) => (
                                                            <SelectItem key={acc.id} value={acc.id}>
                                                                {acc.name} ({acc.bankName})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label htmlFor="reference">Reference / Ref #</Label>
                                            <Input
                                                id="reference"
                                                value={formData.reference}
                                                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                                placeholder="Cheque No / Transaction ID"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Notes / Narration</Label>
                                        <Textarea
                                            id="notes"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Optional notes..."
                                        />
                                    </div>

                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={createMutation.isPending}>
                                            {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Create Receipt
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                }
            />

            <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/50">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Date</TableHead>
                                <TableHead>Receipt #</TableHead>
                                <TableHead>Party</TableHead>
                                <TableHead>Mode</TableHead>
                                <TableHead>Narration</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : receipts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                        No receipts found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                receipts.map((receipt: any) => (
                                    <TableRow key={receipt.id} className="group hover:bg-muted transition-colors">
                                        <TableCell>{format(new Date(receipt.date), 'dd MMM yyyy')}</TableCell>
                                        <TableCell className="font-mono text-xs">{receipt.voucherNumber}</TableCell>
                                        <TableCell className="font-medium">{receipt.partyName}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                {receipt.mode}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-muted-foreground">{receipt.narration}</TableCell>
                                        <TableCell className="text-right font-bold text-green-600">
                                            ₹{Number(receipt.amount).toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default PaymentReceipts;
