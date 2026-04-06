import React, { useState } from 'react';
import { PageLayout } from '../system/PageLayout';
import FormSection from '../system/FormSection';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Banknote } from "lucide-react";
import { posService } from '../../services/modules.service';
import { toast } from "sonner";

const POSSessionManager = () => {
    const [openingCash, setOpeningCash] = useState('');
    const [session, setSession] = useState<any>(null);

    const handleOpenSession = async () => {
        try {
            const res = await posService.openSession(Number(openingCash));
            if (res.success) {
                setSession(res.data);
                toast.success('Session Opened!');
            }
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        }
    };

    const handleCloseSession = async () => {
        if (!session) return;
        const closingCash = prompt("Enter Closing Cash Amount:");
        if (!closingCash) return;

        try {
            const res = await posService.closeSession(session.id, Number(closingCash));
            if (res.success) {
                setSession(null);
                toast.success('Session Closed!');
            }
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        }
    };

    return (
        <PageLayout
            title="POS Session"
            description="Manage your Point of Sale sessions"
        >
            <div className="max-w-md mx-auto">
                {!session ? (
                    <FormSection
                        icon={Banknote}
                        title="Open New Session"
                        description="Enter opening cash amount to start selling"
                    >
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Opening Cash</label>
                                <Input
                                    type="number"
                                    value={openingCash}
                                    onChange={(e) => setOpeningCash(e.target.value)}
                                    placeholder="Enter amount (e.g. 500)"
                                />
                            </div>
                            <Button onClick={handleOpenSession} className="w-full">
                                Open Session
                            </Button>
                        </div>
                    </FormSection>
                ) : (
                    <FormSection
                        icon={Banknote}
                        title="Active Session"
                        description={`Started at ${new Date(session.startTime).toLocaleTimeString()}`}
                        iconColor="text-green-600"
                        iconBg="bg-green-100"
                    >
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className="font-medium text-green-600">Active</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Opening Cash</span>
                                    <span className="font-medium">₹{session.openingCash}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Session ID</span>
                                    <span className="font-medium text-xs font-mono">{session.id}</span>
                                </div>
                            </div>
                            <Button variant="destructive" onClick={handleCloseSession} className="w-full">
                                Close Session
                            </Button>
                        </div>
                    </FormSection>
                )}
            </div>
        </PageLayout>
    );
};

export default POSSessionManager;
