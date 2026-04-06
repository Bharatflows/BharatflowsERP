import React, { useState, useEffect } from 'react';
import { auditService } from '../../services/modules.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '../ui/collapsible';
import { ChevronDown, ChevronUp, History, Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Eye, ArrowRight } from 'lucide-react';

interface AuditLogViewerProps {
    entityType?: string;
    entityId?: string;
    showGlobal?: boolean;
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ entityType, entityId, showGlobal = false }) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchLogs();
    }, [entityType, entityId]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let response;
            if (showGlobal) {
                response = await auditService.getGlobalLogs();
                setLogs(response.data.logs || response.data || []);
            } else if (entityType && entityId) {
                response = await auditService.getEntityLogs(entityType, entityId);
                setLogs(response.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const verifyChain = async () => {
        setVerifying(true);
        try {
            const response = await auditService.verifyIntegrity();
            if (response && response.data?.success) {
                setVerificationResult({ success: true, message: 'Blockchain Integrity Verified: All logs are tamper-evident and valid.' });
            } else {
                setVerificationResult({ success: false, message: 'Verification Failed: Tampering detected!' });
            }
        } catch (error: any) {
            setVerificationResult({ success: false, message: error.response?.data?.message || 'Verification Failed' });
        } finally {
            setVerifying(false);
        }
    };

    const toggleRow = (id: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const getObjectDiff = (oldObj: any, newObj: any) => {
        const diff: any = {};
        if (!oldObj || typeof oldObj !== 'object') return newObj;
        if (!newObj || typeof newObj !== 'object') return {};

        const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
        allKeys.forEach(key => {
            if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
                diff[key] = {
                    old: oldObj[key],
                    new: newObj[key]
                };
            }
        });
        return diff;
    };

    return (
        <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    <CardTitle>Audit Trail</CardTitle>
                </div>
                <Button
                    variant="outline"
                    onClick={verifyChain}
                    disabled={verifying}
                    className={cn(
                        verificationResult?.success && "border-green-500 text-green-600",
                        verificationResult && !verificationResult.success && "border-red-500 text-red-600"
                    )}
                >
                    {verifying ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        <>
                            <Shield className="mr-2 h-4 w-4" />
                            Verify Integrity
                        </>
                    )}
                </Button>
            </CardHeader>
            <CardContent>
                {verificationResult && (
                    <div className={cn(
                        "mb-4 p-3 rounded-lg border",
                        verificationResult.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
                    )}>
                        <div className="flex items-center gap-2">
                            {verificationResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            <span>{verificationResult.message}</span>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Group</TableHead>
                                    <TableHead className="text-right">Hash</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length > 0 ? (
                                    logs.map((row) => (
                                        <React.Fragment key={row.id}>
                                            <TableRow>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleRow(row.id)}
                                                    >
                                                        {expandedRows.has(row.id) ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    {row.changedAt ? format(new Date(row.changedAt), 'PPpp') : '-'}
                                                </TableCell>
                                                <TableCell>{row.action}</TableCell>
                                                <TableCell>{row.changedBy}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{row.resourceGroup || 'General'}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-mono text-xs text-muted-foreground" title={row.hash}>
                                                        {row.hash?.substring(0, 10)}...
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                            {expandedRows.has(row.id) && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="bg-muted/50 dark:bg-card p-6 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        <div className="space-y-6">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="font-bold text-foreground dark:text-white flex items-center gap-2">
                                                                    <Eye className="size-4 text-primary" />
                                                                    Version Comparison
                                                                </h4>
                                                                <Badge variant="secondary" className="font-mono text-2xs">ID: {row.id}</Badge>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                {/* Formatted Diff Cards */}
                                                                <div className="space-y-3">
                                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Changed Fields</p>
                                                                    <div className="space-y-2">
                                                                        {Object.entries(getObjectDiff(row.oldValue, row.newValue)).map(([key, value]: [string, any]) => (
                                                                            <div key={key} className="bg-white dark:bg-card p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-md uppercase">{key}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="flex-1 min-w-0 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                                                                                        <p className="text-2xs font-bold text-red-600 mb-1 uppercase">Old</p>
                                                                                        <p className="text-xs truncate text-red-700 dark:text-red-400 font-mono">
                                                                                            {typeof value.old === 'object' ? JSON.stringify(value.old) : String(value.old || 'N/A')}
                                                                                        </p>
                                                                                    </div>
                                                                                    <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                                                                                    <div className="flex-1 min-w-0 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/30">
                                                                                        <p className="text-2xs font-bold text-green-600 mb-1 uppercase">New</p>
                                                                                        <p className="text-xs truncate text-green-700 dark:text-green-400 font-bold font-mono">
                                                                                            {typeof value.new === 'object' ? JSON.stringify(value.new) : String(value.new || 'N/A')}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        {Object.keys(getObjectDiff(row.oldValue, row.newValue)).length === 0 && (
                                                                            <p className="text-xs text-muted-foreground italic p-4 text-center bg-muted rounded-lg border border-dashed border-border dark:border-slate-700">
                                                                                No specific data changes found in payload.
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Raw Meta Data */}
                                                                <div className="space-y-3">
                                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Audit Metadata</p>
                                                                    <div className="bg-white dark:bg-card p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm">
                                                                        <div>
                                                                            <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Entity Reference</p>
                                                                            <p className="text-xs font-mono break-all text-foreground dark:text-muted-foreground">
                                                                                {row.entityType}: {row.entityId}
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Digital Signature (Hash)</p>
                                                                            <p className="text-2xs font-mono break-all text-primary bg-primary/5 p-2 rounded-lg border border-primary/10">
                                                                                {row.hash}
                                                                            </p>
                                                                        </div>
                                                                        <div className="flex gap-4">
                                                                            <div className="flex-1">
                                                                                <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Source IP</p>
                                                                                <p className="text-xs font-mono">{row.userIp || '127.0.0.1'}</p>
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <p className="text-2xs font-bold text-muted-foreground uppercase mb-1">Environment</p>
                                                                                <p className="text-xs truncate" title={row.userAgent}>{row.userAgent?.split(' ')[0] || 'Web API'}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No audit logs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AuditLogViewer;
