import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Edit, Printer, Send, MessageCircle, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { salesService, gstService } from "../../services/modules.service";
import { authService } from "../../services/auth.service";
import { Company } from "../../types";
import { ModernTemplate, ClassicTemplate, MinimalTemplate } from "./InvoiceTemplates";
import { shareViaWhatsApp, generateInvoiceShareMessage } from "../../utils/whatsappShare";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function ViewInvoice() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<any>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [template, setTemplate] = useState<"modern" | "classic" | "minimal">("modern");
    const [generatingEInvoice, setGeneratingEInvoice] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            console.log("ViewInvoice fetching data for ID:", id);
            if (!id) return;
            setLoading(true);
            try {
                const [invoiceRes, userRes] = await Promise.all([
                    salesService.getInvoice(id),
                    authService.getCurrentUser()
                ]);
                // salesService.getInvoice returns the raw API response: { success, data: { invoice } }
                const invoiceData = (invoiceRes as any)?.data?.invoice || (invoiceRes as any)?.data || invoiceRes;
                setInvoice(invoiceData);
                if (userRes && userRes.company) {
                    setCompany(userRes.company);
                }
            } catch (error) {
                console.error("Failed to load data:", error);
                toast.error("Failed to load invoice details");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleDownload = async () => {
        const element = document.querySelector('.print-content') as HTMLElement;
        if (!element) {
            console.error("Print content element not found");
            toast.error("Could not find invoice content");
            return;
        }

        toast.info("Generating PDF...");

        // Helper to recursively copy computed styles to inline styles
        const copyComputedStyles = (source: HTMLElement, target: HTMLElement) => {
            const computed = window.getComputedStyle(source);
            const style = target.style;

            // Copy all relevant properties
            for (const prop of computed) {
                if (prop.startsWith('-webkit-') || prop === 'cursor') continue;
                style.setProperty(prop, computed.getPropertyValue(prop), computed.getPropertyPriority(prop));
            }

            // Recursively process children
            for (let i = 0; i < source.children.length; i++) {
                if (target.children[i]) {
                    copyComputedStyles(source.children[i] as HTMLElement, target.children[i] as HTMLElement);
                }
            }
        };

        try {
            // 1. Create a deep clone of the element
            const clone = element.cloneNode(true) as HTMLElement;

            // 2. Inline all computed styles to the clone
            copyComputedStyles(element, clone);

            // 3. Position the clone off-screen but in the DOM
            clone.style.position = 'absolute';
            clone.style.left = '-9999px';
            clone.style.top = '0';
            clone.style.width = `${element.offsetWidth}px`;
            document.body.appendChild(clone);

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    // 4. Remove all stylesheets from the cloned document
                    const styles = clonedDoc.querySelectorAll('link[rel="stylesheet"], style');
                    styles.forEach(s => s.remove());
                }
            });

            // Clean up the clone
            document.body.removeChild(clone);

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Calculate height based on width ratio to fit page width
            const imgProps = pdf.getImageProperties(imgData);
            const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfImgHeight);
            pdf.save(`${invoice.invoiceNumber}.pdf`);

            toast.success("Invoice downloaded successfully");
        } catch (error) {
            console.error("PDF generation failed:", error);
            toast.error("Failed to generate PDF. Please try printing to PDF instead.");
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSend = () => {
        toast.success("Sending invoice to customer...");
    };

    const handleWhatsAppShare = () => {
        if (!invoice) return;

        const message = generateInvoiceShareMessage({
            invoiceNumber: invoice.invoiceNumber,
            partyName: invoice.party?.name || invoice.partyName || 'Customer',
            totalAmount: Number(invoice.totalAmount) || 0,
            dueDate: invoice.dueDate,
            viewUrl: window.location.href,
        });

        // If party has phone, use it
        const phone = invoice.party?.phone || invoice.partyPhone;

        shareViaWhatsApp({ phone, text: message });
        toast.success("Opening WhatsApp...");
    };

    const handleGenerateEInvoice = async () => {
        if (!invoice || !id) return;
        try {
            setGeneratingEInvoice(true);
            const response = await gstService.generateLiveEInvoice(id);
            if (response.success) {
                toast.success("E-Invoice generated successfully!");
                // Refresh invoice data
                const updatedRes = await salesService.getInvoice(id);
                const updatedInvoice = (updatedRes as any)?.data?.invoice || (updatedRes as any)?.data || updatedRes;
                setInvoice(updatedInvoice);
            }
        } catch (error: any) {
            console.error("Failed to generate E-Invoice:", error);
            toast.error(error.response?.data?.message || "Failed to generate E-Invoice");
        } finally {
            setGeneratingEInvoice(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-muted-foreground">Invoice not found</p>
                <Button onClick={() => navigate('/sales')}>Back to Sales</Button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-content { display: block !important; }
                    body { background: white; }
                    @page { margin: 0; size: auto; }
                    /* Hide sidebar and header if they are outside this component */
                    nav, header, aside { display: none !important; }
                }

                /* Override variables for html2canvas compatibility */
                .print-content {
                    --foreground: #020817;
                    --background: #ffffff;
                    --card: #ffffff;
                    --card-foreground: #020817;
                    --popover: #ffffff;
                    --popover-foreground: #020817;
                    --primary: #2563eb;
                    --primary-foreground: #ffffff;
                    --secondary: #f1f5f9;
                    --secondary-foreground: #0f172a;
                    --muted: #f1f5f9;
                    --muted-foreground: #64748b;
                    --accent: #f1f5f9;
                    --accent-foreground: #0f172a;
                    --destructive: #ef4444;
                    --destructive-foreground: #ffffff;
                    --border: #e2e8f0;
                    --input: #e2e8f0;
                    --ring: #2563eb;
                    background-color: #ffffff;
                    color: #020817;
                }
            `}</style>

            {/* Header - Hidden in Print */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/sales')}>
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {invoice.invoiceNumber}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="capitalize">
                                {invoice.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                Created on {new Date(invoice.date || invoice.invoiceDate).toLocaleDateString('en-IN')}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={template} onValueChange={(v: any) => setTemplate(v)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Template" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="modern">Modern Template</SelectItem>
                            <SelectItem value="classic">Classic Template</SelectItem>
                            <SelectItem value="minimal">Minimal Template</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                        <Printer className="size-4 mr-2" />
                        Print
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="size-4 mr-2" />
                        Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/sales/invoices/${id}/edit`)}>
                        <Edit className="size-4 mr-2" />
                        Edit
                    </Button>
                    <Button size="sm" onClick={handleSend}>
                        <Send className="size-4 mr-2" />
                        Send
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleWhatsAppShare} className="bg-success hover:bg-success/90 text-white">
                        <MessageCircle className="size-4 mr-2" />
                        WhatsApp
                    </Button>

                    {invoice.customer?.gstin && !invoice.eInvoice && (
                        <Button
                            size="sm"
                            variant="default"
                            onClick={handleGenerateEInvoice}
                            disabled={generatingEInvoice}
                            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                        >
                            {generatingEInvoice ? <Zap className="size-4 mr-2 animate-pulse text-amber-300" /> : <Zap className="size-4 mr-2 text-amber-300 fill-amber-300" />}
                            Generate E-Invoice
                        </Button>
                    )}
                </div>
            </div>

            {/* Compliance Info Banner */}
            {invoice.eInvoice && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 no-print flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500 p-2 rounded-lg">
                            <CheckCircle2 className="size-5 text-white" />
                        </div>
                        <div>
                            <p className="text-emerald-900 font-bold text-sm">E-Invoice Authenticated</p>
                            <p className="text-emerald-700 text-xs">IRN: {invoice.eInvoice.irn}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-emerald-700 font-medium">Ack No: {invoice.eInvoice.ackNumber}</p>
                        <p className="text-2xs text-emerald-600">Dated: {new Date(invoice.eInvoice.ackDate).toLocaleDateString('en-IN')}</p>
                    </div>
                </div>
            )}

            {/* Invoice Content */}
            <div className="print-content border rounded-lg overflow-hidden shadow-sm">
                {template === 'modern' && <ModernTemplate invoice={invoice} company={company} />}
                {template === 'classic' && <ClassicTemplate invoice={invoice} company={company} />}
                {template === 'minimal' && <MinimalTemplate invoice={invoice} company={company} />}
            </div>
        </div>
    );
}
