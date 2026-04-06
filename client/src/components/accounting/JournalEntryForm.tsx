import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageLayout } from "@/components/system";
import { accountingService } from '../../services/modules.service';
import { toast } from "sonner";
import { FileText, Plus } from 'lucide-react';

const JournalEntryForm = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [entries, setEntries] = useState([{ accountId: '', debit: '', credit: '' }]);
    const [accounts, setAccounts] = useState<any[]>([]);

    useEffect(() => {
        accountingService.getLedgers().then(res => {
            if (res.success && res.data) setAccounts(res.data);
        });
    }, []);

    const addLine = () => {
        setEntries([...entries, { accountId: '', debit: '', credit: '' }]);
    };

    const handleEntryChange = (index: number, field: string, value: string) => {
        const newEntries = [...entries];
        (newEntries[index] as any)[field] = value;
        setEntries(newEntries);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await accountingService.createVoucher({
                date,
                type: 'JOURNAL',
                narration: description,
                postings: entries.map(e => ({
                    ledgerId: e.accountId,
                    amount: parseFloat(e.debit || e.credit || '0'),
                    type: e.debit ? 'DEBIT' : 'CREDIT',
                    narration: description
                }))
            });
            toast.success('Journal Entry Posted!');
            // Reset form
            setDescription('');
            setEntries([{ accountId: '', debit: '', credit: '' }]);
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        }
    };

    return (
        <PageLayout
            title="New Journal Entry"
            description="Post a manual journal voucher to the ledger"
            icon={<FileText className="size-5" />}
            breadcrumbs={[
                { label: "Accounting", href: "/accounting" },
                { label: "Vouchers", href: "/accounting/vouchers" },
                { label: "New Journal Entry" }
            ]}
        >

            <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/50">
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Date</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    required
                                    className="bg-background/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Description / Narration</Label>
                                <Input
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="e.g. Opening Balance or Office Rent"
                                    required
                                    className="bg-background/50"
                                />
                            </div>
                        </div>

                        <div className="border rounded-xl overflow-hidden bg-background/50">
                            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted font-medium text-sm text-muted-foreground border-b">
                                <div className="col-span-6">Account</div>
                                <div className="col-span-3 text-right">Debit</div>
                                <div className="col-span-3 text-right">Credit</div>
                            </div>
                            <div className="p-2 space-y-2">
                                {entries.map((entry, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-4 group">
                                        <div className="col-span-6">
                                            <Select
                                                value={entry.accountId}
                                                onValueChange={(val) => handleEntryChange(index, 'accountId', val)}
                                            >
                                                <SelectTrigger className="bg-background border-none shadow-none hover:bg-muted transition-colors">
                                                    <SelectValue placeholder="Select Account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {accounts.map(acc => (
                                                        <SelectItem key={acc.id} value={acc.id}>
                                                            {acc.code ? `${acc.code} - ` : ''}{acc.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-3">
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={entry.debit}
                                                onChange={e => handleEntryChange(index, 'debit', e.target.value)}
                                                disabled={!!entry.credit}
                                                className="text-right font-mono bg-background border-none shadow-none hover:bg-muted transition-colors focus-visible:ring-1 focus-visible:ring-primary"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={entry.credit}
                                                onChange={e => handleEntryChange(index, 'credit', e.target.value)}
                                                disabled={!!entry.debit}
                                                className="text-right font-mono bg-background border-none shadow-none hover:bg-muted transition-colors focus-visible:ring-1 focus-visible:ring-destructive"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 bg-muted/20 border-t flex justify-between items-center">
                                <Button type="button" variant="ghost" size="sm" onClick={addLine} className="text-primary hover:bg-primary/10">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Line
                                </Button>
                                <div className="flex gap-4 text-sm font-mono text-muted-foreground">
                                    <span>Total:</span>
                                    <span className="text-primary">Dr {entries.reduce((sum, e) => sum + (parseFloat(e.debit) || 0), 0).toFixed(2)}</span>
                                    <span className="text-destructive">Cr {entries.reduce((sum, e) => sum + (parseFloat(e.credit) || 0), 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" className="px-8 shadow-lg hover:shadow-primary/20 transition-all">
                                Post Journal
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </PageLayout>
    );
};

export default JournalEntryForm;
