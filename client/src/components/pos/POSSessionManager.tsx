import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { posService } from '../../services/modules.service';

const POSSessionManager = () => {
    const [openingCash, setOpeningCash] = useState('');
    const [session, setSession] = useState<any>(null);

    const handleOpenSession = async () => {
        try {
            const res = await posService.openSession(Number(openingCash));
            if (res.success) {
                setSession(res.data);
                alert('Session Opened!');
            }
        } catch (error: any) {
            alert('Error: ' + error.message);
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
                alert('Session Closed!');
            }
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto mt-10">
            <CardHeader>
                <CardTitle>POS Session</CardTitle>
            </CardHeader>
            <CardContent>
                {!session ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Opening Cash</label>
                            <Input
                                type="number"
                                value={openingCash}
                                onChange={(e) => setOpeningCash(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <Button className="w-full" onClick={handleOpenSession}>Open Session</Button>
                    </div>
                ) : (
                    <div className="space-y-4 text-center">
                        <div className="p-4 bg-green-50 text-green-700 rounded-md">
                            Session is ACTIVE
                        </div>
                        <p>Session ID: {session.id}</p>
                        <p>Started: {new Date(session.startTime).toLocaleString()}</p>
                        <Button variant="destructive" className="w-full" onClick={handleCloseSession}>
                            Close Session
                        </Button>
                        <Button variant="outline" className="w-full mt-2" onClick={() => window.location.href = '/pos/terminal'}>
                            Go to Terminal
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default POSSessionManager;
