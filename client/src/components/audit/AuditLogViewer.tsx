import React, { useState, useEffect } from 'react';
import { auditService } from '../../services/modules.service';
import {
    Box,
    Card,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Collapse,
    Button,
    Alert,
    Tooltip,
    CircularProgress
} from '@mui/material';
import {
    KeyboardArrowDown,
    KeyboardArrowUp,
    History,
    Security,
    VerifiedUser,
    GppBad
} from '@mui/icons-material';
import { format } from 'date-fns';

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

    useEffect(() => {
        fetchLogs();
    }, [entityType, entityId]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let response;
            if (showGlobal) {
                response = await auditService.getGlobalLogs();
                setLogs(response.data.logs || response.data); // Handle paginated or rough response
            } else if (entityType && entityId) {
                response = await auditService.getEntityLogs(entityType, entityId);
                setLogs(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    const verifyChain = async () => {
        setVerifying(true);
        try {
            const response = await auditService.verifyIntegrity(); // This might fail if API not fully ready or route issues
            if (response && response.success) {
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

    const Row = ({ row }: { row: any }) => {
        const [open, setOpen] = useState(false);

        return (
            <React.Fragment>
                <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                    <TableCell>
                        <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => setOpen(!open)}
                        >
                            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                    </TableCell>
                    <TableCell component="th" scope="row">
                        {format(new Date(row.changedAt), 'PPpp')}
                    </TableCell>
                    <TableCell>{row.action}</TableCell>
                    <TableCell>{row.changedBy}</TableCell>
                    <TableCell>
                        <Chip label={row.resourceGroup || 'General'} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                        <Tooltip title="SHA-256 Hash">
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {row.hash?.substring(0, 10)}...
                            </Typography>
                        </Tooltip>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 1 }}>
                                <Typography variant="h6" gutterBottom component="div">
                                    Change Details
                                </Typography>

                                {/* Simple Diff View for mvp */}
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ flex: 1, padding: '10px', backgroundColor: '#fee', borderRadius: '4px' }}>
                                        <Typography variant="subtitle2" color="error">Old Value</Typography>
                                        <pre style={{ overflow: 'auto', fontSize: '12px' }}>
                                            {JSON.stringify(row.oldValue, null, 2)}
                                        </pre>
                                    </div>
                                    <div style={{ flex: 1, padding: '10px', backgroundColor: '#eef', borderRadius: '4px' }}>
                                        <Typography variant="subtitle2" color="primary">New Value</Typography>
                                        <pre style={{ overflow: 'auto', fontSize: '12px' }}>
                                            {JSON.stringify(row.newValue, null, 2)}
                                        </pre>
                                    </div>
                                </div>

                                <Box mt={2}>
                                    <Typography variant="caption" display="block">
                                        <strong>Hash:</strong> {row.hash}
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                        <strong>Previous Hash:</strong> {row.previousHash || 'GENESIS'}
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                        <strong>IP:</strong> {row.userIp} | <strong>Agent:</strong> {row.userAgent}
                                    </Typography>
                                </Box>
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            </React.Fragment>
        );
    };

    return (
        <Card sx={{ p: 3, mt: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                    <History />
                    <Typography variant="h5">Audit Trail</Typography>
                </Box>
                <Button
                    variant="outlined"
                    color={verificationResult?.success ? "success" : "warning"}
                    startIcon={verifying ? <CircularProgress size={20} /> : (verificationResult?.success ? <VerifiedUser /> : <Security />)}
                    onClick={verifyChain}
                    disabled={verifying}
                >
                    {verifying ? 'Verifying Chain...' : 'Verify Integrity'}
                </Button>
            </Box>

            {verificationResult && (
                <Alert severity={verificationResult.success ? "success" : "error"} sx={{ mb: 2 }}>
                    {verificationResult.message}
                </Alert>
            )}

            {loading ? (
                <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper} variant="outlined">
                    <Table aria-label="audit logs table">
                        <TableHead>
                            <TableRow>
                                <TableCell />
                                <TableCell>Date & Time</TableCell>
                                <TableCell>Action</TableCell>
                                <TableCell>User</TableCell>
                                <TableCell>Group</TableCell>
                                <TableCell align="right">Hash</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {logs.length > 0 ? (
                                logs.map((row) => (
                                    <Row key={row.id} row={row} />
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">No audit logs found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Card>
    );
};

export default AuditLogViewer;
