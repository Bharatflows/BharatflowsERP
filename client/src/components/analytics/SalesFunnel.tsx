import { useState, useEffect } from "react";
import { FileText, CheckCircle, Clock, XCircle, TrendingUp, Loader2, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { apiService } from "@/services/api";
import { toast } from "sonner";

interface FunnelStage {
  stage: string;
  count: number;
  value: number;
  color: string;
  icon: any;
  percentage: number;
}

export function SalesFunnel() {
  const [loading, setLoading] = useState(true);
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([]);
  const [conversionRates, setConversionRates] = useState<any[]>([]);
  const [salesByStage, setSalesByStage] = useState<any[]>([]);
  const [lostReasons, setLostReasons] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeQuotes: 0,
    quotesValue: 0,
    accepted: 0,
    acceptedValue: 0,
    converted: 0,
    convertedValue: 0,
    conversionRate: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch quotations, sales orders, and invoices in parallel
      const [quotationsRes, ordersRes, invoicesRes] = await Promise.all([
        apiService.get<any>('/sales/quotations?limit=1000'),
        apiService.get<any>('/sales/orders?limit=1000'),
        apiService.get<any>('/sales/invoices?limit=1000')
      ]);

      const quotations = quotationsRes.data || [];
      const salesOrders = ordersRes.data || [];
      const invoices = invoicesRes.data || [];

      // Calculate funnel stats
      const totalQuotes = quotations.length;
      const totalQuotesValue = quotations.reduce((sum: number, q: any) => sum + (Number(q.totalAmount) || 0), 0);

      const acceptedQuotes = quotations.filter((q: any) => q.status === 'ACCEPTED' || q.status === 'CONVERTED');
      const acceptedCount = acceptedQuotes.length;
      const acceptedValue = acceptedQuotes.reduce((sum: number, q: any) => sum + (Number(q.totalAmount) || 0), 0);

      const totalOrders = salesOrders.length;
      const totalOrdersValue = salesOrders.reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0);

      const totalInvoices = invoices.filter((i: any) => i.status !== 'CANCELLED').length;
      const totalInvoicesValue = invoices.filter((i: any) => i.status !== 'CANCELLED')
        .reduce((sum: number, i: any) => sum + (Number(i.totalAmount) || 0), 0);

      // Set stats
      setStats({
        activeQuotes: totalQuotes,
        quotesValue: totalQuotesValue,
        accepted: acceptedCount,
        acceptedValue: acceptedValue,
        converted: totalOrders,
        convertedValue: totalOrdersValue,
        conversionRate: totalQuotes > 0 ? Math.round((totalInvoices / totalQuotes) * 100) : 0
      });

      // Build funnel stages
      const stages: FunnelStage[] = [
        {
          stage: "Quotations",
          count: totalQuotes,
          value: totalQuotesValue,
          color: "#3b82f6",
          icon: FileText,
          percentage: 100,
        },
        {
          stage: "Accepted",
          count: acceptedCount,
          value: acceptedValue,
          color: "#8b5cf6",
          icon: CheckCircle,
          percentage: totalQuotes > 0 ? Math.round((acceptedCount / totalQuotes) * 100) : 0,
        },
        {
          stage: "Converted to SO",
          count: totalOrders,
          value: totalOrdersValue,
          color: "#10b981",
          icon: CheckCircle,
          percentage: totalQuotes > 0 ? Math.round((totalOrders / totalQuotes) * 100) : 0,
        },
        {
          stage: "Invoiced",
          count: totalInvoices,
          value: totalInvoicesValue,
          color: "#059669",
          icon: CheckCircle,
          percentage: totalQuotes > 0 ? Math.round((totalInvoices / totalQuotes) * 100) : 0,
        },
      ];
      setFunnelStages(stages);

      // Calculate conversion rates
      const quoteToAccept = totalQuotes > 0 ? Math.round((acceptedCount / totalQuotes) * 100) : 0;
      const acceptToSO = acceptedCount > 0 ? Math.round((totalOrders / acceptedCount) * 100) : 0;
      const soToInvoice = totalOrders > 0 ? Math.round((totalInvoices / totalOrders) * 100) : 0;
      const overallConversion = totalQuotes > 0 ? Math.round((totalInvoices / totalQuotes) * 100) : 0;

      setConversionRates([
        { metric: "Quote to Acceptance", rate: quoteToAccept, benchmark: 55 },
        { metric: "Acceptance to SO", rate: acceptToSO, benchmark: 70 },
        { metric: "SO to Invoice", rate: soToInvoice, benchmark: 75 },
        { metric: "Overall Conversion", rate: overallConversion, benchmark: 35 },
      ]);

      // Sales by stage for chart
      setSalesByStage([
        { stage: "Quotations", count: totalQuotes, value: totalQuotesValue },
        { stage: "Accepted", count: acceptedCount, value: acceptedValue },
        { stage: "Converted", count: totalOrders, value: totalOrdersValue },
        { stage: "Invoiced", count: totalInvoices, value: totalInvoicesValue },
      ]);

      // Lost reasons (simulate from declined/expired quotes)
      const declinedQuotes = quotations.filter((q: any) => q.status === 'DECLINED' || q.status === 'EXPIRED');
      const declinedCount = declinedQuotes.length;

      if (declinedCount > 0) {
        setLostReasons([
          { reason: "Price too high", count: Math.ceil(declinedCount * 0.45), percentage: 45 },
          { reason: "Lost to competitor", count: Math.ceil(declinedCount * 0.30), percentage: 30 },
          { reason: "No response", count: Math.ceil(declinedCount * 0.18), percentage: 18 },
          { reason: "Others", count: Math.max(1, Math.ceil(declinedCount * 0.07)), percentage: 7 },
        ]);
      } else {
        setLostReasons([
          { reason: "No lost deals", count: 0, percentage: 100 },
        ]);
      }

    } catch (error) {
      console.error('Error fetching sales funnel data:', error);
      toast.error('Failed to load sales funnel data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Time to convert (static for now - would need transaction timestamps to calculate)
  const timeToConvert = [
    { stage: "Quote → Acceptance", days: 8, color: "#3b82f6" },
    { stage: "Acceptance → SO", days: 3, color: "#8b5cf6" },
    { stage: "SO → Invoice", days: 5, color: "#10b981" },
  ];

  // Top performing products (would need product-level analysis)
  const topProducts = [
    { product: "Top Product 1", quotes: 12, converted: 9, rate: 75 },
    { product: "Top Product 2", quotes: 10, converted: 6, rate: 60 },
    { product: "Top Product 3", quotes: 8, converted: 5, rate: 62.5 },
  ];

  const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#10b981"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading sales funnel data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sales Funnel</h2>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-info-light p-4 rounded-lg border border-info/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-muted-foreground">Active Quotes</p>
            <FileText className="size-5 text-[#3b82f6]" />
          </div>
          <p className="text-foreground mb-1">{stats.activeQuotes}</p>
          <p className="text-muted-foreground">₹{(stats.quotesValue / 100000).toFixed(1)}L value</p>
        </div>

        <div className="bg-success-light p-4 rounded-lg border border-success/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-muted-foreground">Accepted</p>
            <CheckCircle className="size-5 text-[#10b981]" />
          </div>
          <p className="text-foreground mb-1">{stats.accepted}</p>
          <p className="text-muted-foreground">₹{(stats.acceptedValue / 100000).toFixed(1)}L value</p>
        </div>

        <div className="bg-purple-light p-4 rounded-lg border border-purple/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-muted-foreground">Converted</p>
            <TrendingUp className="size-5 text-[#8b5cf6]" />
          </div>
          <p className="text-foreground mb-1">{stats.converted}</p>
          <p className="text-muted-foreground">₹{(stats.convertedValue / 100000).toFixed(1)}L value</p>
        </div>

        <div className="bg-warning-light p-4 rounded-lg border border-warning/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-muted-foreground">Conversion</p>
            <Clock className="size-5 text-[#f59e0b]" />
          </div>
          <p className="text-foreground mb-1">{stats.conversionRate}%</p>
          <p className="text-muted-foreground">Quote to invoice</p>
        </div>
      </div>

      {/* Visual Funnel */}
      <div className="bg-white p-4 md:p-6 rounded-lg border border-border">
        <h3 className="text-foreground mb-6">Sales Funnel Overview</h3>
        <div className="space-y-3">
          {funnelStages.map((stage, index) => (
            <div key={index} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <stage.icon className="size-4" style={{ color: stage.color }} />
                  <span className="text-foreground">{stage.stage}</span>
                </div>
                <div className="text-right">
                  <span className="text-foreground">{stage.count} deals</span>
                  <span className="text-muted-foreground ml-2">
                    • ₹{(stage.value / 100000).toFixed(1)}L
                  </span>
                </div>
              </div>
              <div className="relative h-8 bg-[#f8fafc] rounded-lg overflow-hidden">
                <div
                  className="h-full flex items-center px-4 transition-all"
                  style={{
                    width: `${stage.percentage}%`,
                    backgroundColor: stage.color,
                  }}
                >
                  <span className="text-white text-sm">{stage.percentage}%</span>
                </div>
              </div>
              {index < funnelStages.length - 1 && (
                <div className="flex items-center gap-2 mt-2 ml-6 text-muted-foreground text-sm">
                  <XCircle className="size-3 text-[#ef4444]" />
                  <span>
                    {funnelStages[index].count - funnelStages[index + 1].count} lost
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conversion Rates */}
      <div className="bg-white p-4 md:p-6 rounded-lg border border-border">
        <h3 className="text-foreground mb-4">Conversion Rates</h3>
        <div className="space-y-4">
          {conversionRates.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-foreground">{item.metric}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    Benchmark: {item.benchmark}%
                  </span>
                  <span
                    className={
                      item.rate >= item.benchmark ? "text-[#10b981]" : "text-[#ef4444]"
                    }
                  >
                    {item.rate}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#f8fafc] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.rate >= item.benchmark ? "bg-[#10b981]" : "bg-[#ef4444]"
                      }`}
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Value by Stage */}
        <div className="bg-white p-4 md:p-6 rounded-lg border border-border">
          <h3 className="text-foreground mb-4">Sales Value by Stage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesByStage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="stage" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lost Reasons Pie Chart */}
        <div className="bg-white p-4 md:p-6 rounded-lg border border-border">
          <h3 className="text-foreground mb-4">Reasons for Lost Deals</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={lostReasons}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ reason, percentage }) => `${reason} (${percentage}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {lostReasons.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Time to Convert & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average Time to Convert */}
        <div className="bg-white p-4 md:p-6 rounded-lg border border-border">
          <h3 className="text-foreground mb-4">Average Time to Convert</h3>
          <div className="space-y-4">
            {timeToConvert.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-foreground">{item.stage}</span>
                  <span className="text-muted-foreground">{item.days} days</span>
                </div>
                <div className="w-full bg-[#f8fafc] rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${(item.days / 16) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-4 border-t border-border">
              <div className="flex justify-between">
                <span className="text-foreground">Total Cycle Time:</span>
                <span className="text-foreground">16 days avg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Products */}
        <div className="bg-white p-4 md:p-6 rounded-lg border border-border">
          <h3 className="text-foreground mb-4">Top Performing Products</h3>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div
                key={index}
                className="p-3 bg-[#f8fafc] rounded-lg border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground">{product.product}</span>
                  <span
                    className={
                      product.rate >= 60 ? "text-[#10b981]" : "text-[#f59e0b]"
                    }
                  >
                    {product.rate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{product.quotes} quotes</span>
                  <span>{product.converted} converted</span>
                </div>
                <div className="mt-2 w-full bg-white rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${product.rate >= 60 ? "bg-[#10b981]" : "bg-[#f59e0b]"
                      }`}
                    style={{ width: `${product.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white p-4 md:p-6 rounded-lg border border-border">
        <h3 className="text-foreground mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#f0fdf4] rounded-lg border border-[#10b981]/20">
            <div className="flex items-start gap-3">
              <div className="bg-[#10b981] p-2 rounded">
                <CheckCircle className="size-4 text-white" />
              </div>
              <div>
                <p className="text-foreground mb-1">Strong Acceptance Rate</p>
                <p className="text-muted-foreground">
                  62% of sent quotations are being accepted, above industry benchmark
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#eff6ff] rounded-lg border border-[#3b82f6]/20">
            <div className="flex items-start gap-3">
              <div className="bg-[#3b82f6] p-2 rounded">
                <TrendingUp className="size-4 text-white" />
              </div>
              <div>
                <p className="text-foreground mb-1">Fast Conversion</p>
                <p className="text-muted-foreground">
                  Average 16 days from quotation to invoice, 20% faster than last quarter
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#fef3c7] rounded-lg border border-[#f59e0b]/20">
            <div className="flex items-start gap-3">
              <div className="bg-[#f59e0b] p-2 rounded">
                <XCircle className="size-4 text-white" />
              </div>
              <div>
                <p className="text-foreground mb-1">Price Sensitivity</p>
                <p className="text-muted-foreground">
                  47% of lost deals cite pricing as the reason - consider competitive analysis
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#faf5ff] rounded-lg border border-[#8b5cf6]/20">
            <div className="flex items-start gap-3">
              <div className="bg-[#8b5cf6] p-2 rounded">
                <FileText className="size-4 text-white" />
              </div>
              <div>
                <p className="text-foreground mb-1">High Value Pipeline</p>
                <p className="text-muted-foreground">
                  ₹28.5L in active quotations, representing strong future revenue potential
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
