import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Assuming UI components exist, otherwise standard HTML
import { accountingService } from '../../services/modules.service';

const JournalEntryForm = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [entries, setEntries] = useState([{ accountId: '', debit: '', credit: '' }]);
    const [accounts, setAccounts] = useState<any[]>([]);

    useEffect(() => {
        accountingService.getAccounts().then(res => {
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
            await accountingService.createJournalEntry({
                date,
                description,
                entries
            });
            alert('Journal Entry Created!');
            // Reset form
            setDescription('');
            setEntries([{ accountId: '', debit: '', credit: '' }]);
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>New Journal Entry</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Opening Balance" required />
                        </div>
                    </div>

                    <div className="border rounded-md p-4">
                        <div className="grid grid-cols-12 gap-2 mb-2 font-medium">
                            <div className="col-span-6">Account</div>
                            <div className="col-span-3">Debit</div>
                            <div className="col-span-3">Credit</div>
                        </div>
                        {entries.map((entry, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                                <div className="col-span-6">
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={entry.accountId}
                                        onChange={(e) => handleEntryChange(index, 'accountId', e.target.value)}
                                        required
                                    >
                                        <option value="">Select Account</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-3">
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={entry.debit}
                                        onChange={e => handleEntryChange(index, 'debit', e.target.value)}
                                        disabled={!!entry.credit}
                                    />
                                </div>
                                <div className="col-span-3">
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={entry.credit}
                                        onChange={e => handleEntryChange(index, 'credit', e.target.value)}
                                        disabled={!!entry.debit}
                                    />
                                </div>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addLine} className="mt-2">
                            + Add Line
                        </Button>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit">Post Journal</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default JournalEntryForm;
