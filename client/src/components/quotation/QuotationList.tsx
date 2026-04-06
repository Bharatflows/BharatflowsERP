import { Plus, Eye, Edit, Trash2, FileText, TrendingUp } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ModuleHeader } from "../ui/module-header";
import type { Quotation } from "../../types";

interface QuotationListProps {
  quotations: Quotation[];
  onCreateNew: () => void;
  onView: (quotation: Quotation) => void;
  onEdit: (quotation: Quotation) => void;
  onDelete: (id: string) => void;
}

export function QuotationList({
  quotations,
  onCreateNew,
  onView,
  onEdit,
  onDelete,
}: QuotationListProps) {
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

  // Calculate statistics
  const stats = {
    total: quotations.length,
    accepted: quotations.filter((q) => q.status === "Accepted").length,
    converted: quotations.filter((q) => q.status === "Converted").length,
    pending: quotations.filter((q) => q.status === "Sent" || q.status === "Viewed").length,
    totalValue: quotations.reduce((sum, q) => sum + (Number(q.totalAmount) || 0), 0),
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <ModuleHeader
        title="Quotations"
        description="Create and manage sales quotations"
        showBackButton={true}
        backTo="/dashboard"
        icon={<FileText className="size-5 text-primary" />}
        actions={
          <Button onClick={onCreateNew} className="bg-primary hover:bg-primary/90">
            <Plus className="size-4 mr-2" />
            New Quotation
          </Button>
        }
      />

      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <div className="card-base p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="size-4 text-primary" />
            <p className="text-muted-foreground">Total</p>
          </div>
          <p className="text-foreground">{stats.total}</p>
        </div>
        <div className="card-base p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="size-4 text-success" />
            <p className="text-muted-foreground">Accepted</p>
          </div>
          <p className="text-foreground">{stats.accepted}</p>
        </div>
        <div className="card-base p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="size-4 text-success" />
            <p className="text-muted-foreground">Converted</p>
          </div>
          <p className="text-foreground">{stats.converted}</p>
        </div>
        <div className="card-base p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="size-4 text-warning" />
            <p className="text-muted-foreground">Pending</p>
          </div>
          <p className="text-foreground">{stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-border col-span-2 lg:col-span-1">
          <p className="text-muted-foreground mb-2">Total Value</p>
          <p className="text-foreground">
            ₹{stats.totalValue.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Quotations List - Mobile Optimized */}
      <div className="card-base overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-left p-4 text-muted-foreground">Quotation #</th>
                <th className="text-left p-4 text-muted-foreground">Date</th>
                <th className="text-left p-4 text-muted-foreground">Party</th>
                <th className="text-left p-4 text-muted-foreground">Valid Until</th>
                <th className="text-right p-4 text-muted-foreground">Amount</th>
                <th className="text-left p-4 text-muted-foreground">Status</th>
                <th className="text-center p-4 text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((quotation) => (
                <tr key={quotation.id} className="border-b border-border hover:bg-background">
                  <td className="p-4">
                    <p className="text-foreground">{quotation.quotationNumber}</p>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(quotation.date).toLocaleDateString("en-IN")}
                  </td>
                  <td className="p-4">
                    <p className="text-foreground">{quotation.customer?.name || "N/A"}</p>
                    <p className="text-muted-foreground">{quotation.customer?.gstin || "No GSTIN"}</p>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(quotation.validUntil).toLocaleDateString("en-IN")}
                  </td>
                  <td className="p-4 text-right text-foreground">
                    ₹{Number(quotation.totalAmount).toLocaleString("en-IN")}
                  </td>
                  <td className="p-4">
                    <Badge className={getStatusColor(quotation.status)}>
                      {quotation.status}
                    </Badge>
                    {quotation.convertedToSO && (
                      <p className="text-muted-foreground mt-1">
                        SO: {quotation.convertedToSO}
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(quotation)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(quotation)}
                        disabled={quotation.status === "Converted"}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(quotation.id)}
                        disabled={quotation.status === "Converted"}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-border">
          {quotations.map((quotation) => (
            <div key={quotation.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-foreground">{quotation.quotationNumber}</p>
                  <p className="text-muted-foreground">
                    {new Date(quotation.date).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <Badge className={getStatusColor(quotation.status)}>
                  {quotation.status}
                </Badge>
              </div>
              <div>
                <p className="text-foreground">{quotation.customer?.name || "N/A"}</p>
                <p className="text-muted-foreground">{quotation.customer?.gstin || "No GSTIN"}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">Valid Until</p>
                  <p className="text-foreground">
                    {new Date(quotation.validUntil).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Amount</p>
                  <p className="text-foreground">
                    ₹{Number(quotation.totalAmount).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              {quotation.convertedToSO && (
                <p className="text-muted-foreground">
                  Converted to: {quotation.convertedToSO}
                </p>
              )}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(quotation)}
                  className="flex-1"
                >
                  <Eye className="size-4 mr-2" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(quotation)}
                  disabled={quotation.status === "Converted"}
                  className="flex-1"
                >
                  <Edit className="size-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(quotation.id)}
                  disabled={quotation.status === "Converted"}
                >
                  <Trash2 className="size-4 text-error" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {quotations.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="size-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground mb-2">No quotations yet</p>
            <p className="text-muted-foreground mb-4">
              Create your first quotation to get started
            </p>
            <Button onClick={onCreateNew} className="bg-primary hover:bg-primary/90">
              <Plus className="size-4 mr-2" />
              Create Quotation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
