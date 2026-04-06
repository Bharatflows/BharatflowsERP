import { ArrowLeft, Edit, FileText, RefreshCw, Download, Send } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import type { Quotation } from "../../types";

interface QuotationDetailProps {
  quotation: Quotation;
  onBack: () => void;
  onEdit: () => void;
  onConvertToSO: (id: string) => void;
}

export function QuotationDetail({
  quotation,
  onBack,
  onEdit,
  onConvertToSO,
}: QuotationDetailProps) {
  const getStatusColor = (status: Quotation["status"]) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Sent":
        return "bg-blue-100 text-blue-800";
      case "Viewed":
        return "bg-purple-100 text-purple-800";
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Converted":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} size="sm">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-foreground">Quotation Details</h1>
            <p className="text-muted-foreground">{quotation.quotationNumber}</p>
          </div>
          <Badge className={getStatusColor(quotation.status)}>
            {quotation.status}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
            disabled={quotation.status === "Converted"}
            className="flex-1 sm:flex-initial"
          >
            <Edit className="size-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
            <Send className="size-4 mr-2" />
            Send
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
            <Download className="size-4 mr-2" />
            PDF
          </Button>
          {(quotation.status === "Accepted" || quotation.status === "Sent") && (
            <Button
              onClick={() => onConvertToSO(quotation.id)}
              className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-initial"
              size="sm"
            >
              <RefreshCw className="size-4 mr-2" />
              Convert to SO
            </Button>
          )}
        </div>
      </div>

      {/* Quotation Preview */}
      <div className="card-base overflow-hidden">
        {/* Header Section */}
        <div className="bg-primary text-white p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2 className="mb-2">QUOTATION</h2>
              <p className="opacity-90">{quotation.quotationNumber}</p>
            </div>
            <div className="text-right">
              <p className="mb-1">Your Company Name</p>
              <p className="opacity-90">GSTIN: 27XXXXX1234X1ZX</p>
              <p className="opacity-90">123 Business Street, Mumbai</p>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-6 space-y-6">
          {/* Date and Party Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-foreground mb-3">Bill To:</h3>
              <p className="text-foreground mb-1">{quotation.customer?.name || "N/A"}</p>
              <p className="text-muted-foreground mb-1">
                GSTIN: {quotation.customer?.gstin || "No GSTIN"}
              </p>
              <p className="text-muted-foreground">
                {quotation.customer?.billingAddress ?
                  `${quotation.customer.billingAddress.address || ""}, ${quotation.customer.billingAddress.city || ""}, ${quotation.customer.billingAddress.state || ""} - ${quotation.customer.billingAddress.pincode || ""}`
                  : "No address provided"}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <p className="text-muted-foreground">Date:</p>
                <p className="text-foreground">
                  {new Date(quotation.date).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <p className="text-muted-foreground">Valid Until:</p>
                <p className="text-foreground">
                  {new Date(quotation.validUntil).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <p className="text-muted-foreground">Status:</p>
                <Badge className={getStatusColor(quotation.status)}>
                  {quotation.status}
                </Badge>
              </div>
              {quotation.convertedToSO && (
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <p className="text-muted-foreground">Converted to:</p>
                  <p className="text-emerald-600">{quotation.convertedToSO}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items Table - Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-y border-border">
                <tr>
                  <th className="text-left p-3 text-muted-foreground">#</th>
                  <th className="text-left p-3 text-muted-foreground">Product/Service</th>
                  <th className="text-left p-3 text-muted-foreground">HSN</th>
                  <th className="text-right p-3 text-muted-foreground">Qty</th>
                  <th className="text-right p-3 text-muted-foreground">Rate</th>
                  <th className="text-right p-3 text-muted-foreground">Disc%</th>
                  <th className="text-right p-3 text-muted-foreground">Tax%</th>
                  <th className="text-right p-3 text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item, index) => (
                  <tr key={item.id} className="border-b border-border">
                    <td className="p-3 text-muted-foreground">{index + 1}</td>
                    <td className="p-3 text-foreground">{item.productName}</td>
                    <td className="p-3 text-muted-foreground">{item.hsn}</td>
                    <td className="p-3 text-right text-foreground">
                      {item.quantity} {item.product?.unit || item.unit || ""}
                    </td>
                    <td className="p-3 text-right text-foreground">
                      ₹{Number(item.rate).toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-foreground">{item.discount || 0}%</td>
                    <td className="p-3 text-right text-foreground">{Number(item.taxRate).toFixed(0)}%</td>
                    <td className="p-3 text-right text-foreground">
                      ₹{Number(item.total || item.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Items Cards - Mobile */}
          <div className="md:hidden space-y-3">
            {quotation.items.map((item, index) => (
              <div key={item.id} className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-foreground mb-1">
                      {index + 1}. {item.productName}
                    </p>
                    <p className="text-muted-foreground">HSN: {item.hsn}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Quantity</p>
                    <p className="text-foreground">
                      {item.quantity} {item.product?.unit || item.unit || ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rate</p>
                    <p className="text-foreground">₹{Number(item.rate).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Discount</p>
                    <p className="text-foreground">{item.discount || 0}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tax</p>
                    <p className="text-foreground">{Number(item.taxRate).toFixed(0)}%</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-border flex justify-between">
                  <p className="text-muted-foreground">Amount:</p>
                  <p className="text-foreground">₹{Number(item.total || item.amount).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-80 space-y-2 bg-background p-4 rounded-lg">
              <div className="flex justify-between">
                <p className="text-muted-foreground">Subtotal:</p>
                <p className="text-foreground">₹{Number(quotation.subtotal).toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Total Tax:</p>
                <p className="text-foreground">₹{Number(quotation.totalTax).toFixed(2)}</p>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <p className="text-foreground font-semibold">Total Amount:</p>
                <p className="text-foreground font-semibold">₹{Number(quotation.totalAmount).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Terms and Notes */}
          {quotation.terms && (
            <div>
              <h3 className="text-foreground mb-2">Terms & Conditions</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {quotation.terms}
              </p>
            </div>
          )}

          {quotation.notes && (
            <div>
              <h3 className="text-foreground mb-2">Notes</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {quotation.notes}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 border-t border-border text-center">
            <p className="text-muted-foreground">
              This is a computer generated quotation and does not require a signature.
            </p>
            <p className="text-muted-foreground mt-2">
              Created by: {quotation.createdBy}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
