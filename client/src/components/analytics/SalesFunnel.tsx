import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { salesAnalyticsService } from "@/services/modules.service";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { CHART_COLORS } from "@/constants/theme";
import { chartColors } from "@/lib/chartColors";

// Reusable icon component
const MIcon = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => (
  <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit', ...style }}>
    {name}
  </span>
);

interface FunnelStage {
  stage: string;
  count: number;
  value: number;
  color: string;
  icon: string;
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

  const [timeToConvert, setTimeToConvert] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await salesAnalyticsService.getAnalytics();

      if (response.success && response.data) {
        const { funnel, avgTimeToConvert, topProducts: products, lostReasons: lostData, insights: insightsData } = response.data;

        // Set stats
        setStats({
          activeQuotes: funnel.quotes,
          quotesValue: funnel.quotesValue || 0,
          accepted: funnel.orders,
          acceptedValue: funnel.ordersValue || 0,
          converted: funnel.invoices,
          convertedValue: funnel.invoicesValue || 0,
          conversionRate: funnel.conversionRate
        });

        // Build funnel stages
        const stages: FunnelStage[] = [
          {
            stage: "Quotations",
            count: funnel.quotes,
            value: funnel.quotesValue || 0,
            color: CHART_COLORS.blue,
            icon: "description",
            percentage: 100,
          },
          {
            stage: "Accepted",
            count: funnel.orders,
            value: funnel.ordersValue || 0,
            color: CHART_COLORS.violet,
            icon: "check_circle",
            percentage: funnel.quotes > 0 ? Math.round((funnel.orders / funnel.quotes) * 100) : 0,
          },
          {
            stage: "Converted to SO",
            count: funnel.orders,
            value: funnel.ordersValue || 0,
            color: CHART_COLORS.green,
            icon: "check_circle",
            percentage: funnel.quotes > 0 ? Math.round((funnel.orders / funnel.quotes) * 100) : 0,
          },
          {
            stage: "Invoiced",
            count: funnel.invoices,
            value: funnel.invoicesValue || 0,
            color: CHART_COLORS.emerald,
            icon: "check_circle",
            percentage: funnel.quotes > 0 ? Math.round((funnel.invoices / funnel.quotes) * 100) : 0,
          },
        ];
        setFunnelStages(stages);

        // Calculate conversion rates
        setConversionRates([
          { metric: "Quote to Acceptance", rate: funnel.quotes > 0 ? Math.round((funnel.orders / funnel.quotes) * 100) : 0, benchmark: 55 },
          { metric: "Acceptance to SO", rate: 100, benchmark: 70 },
          { metric: "SO to Invoice", rate: funnel.orders > 0 ? Math.round((funnel.invoices / funnel.orders) * 100) : 0, benchmark: 75 },
          { metric: "Overall Conversion", rate: funnel.conversionRate, benchmark: 35 },
        ]);

        // Sales by stage for chart
        setSalesByStage([
          { stage: "Quotations", count: funnel.quotes, value: (funnel as any).quotesValue || 0 },
          { stage: "Orders", count: funnel.orders, value: (funnel as any).ordersValue || 0 },
          { stage: "Invoices", count: funnel.invoices, value: (funnel as any).invoicesValue || 0 },
        ]);

        // Time to convert
        setTimeToConvert([
          { stage: "Quote → Acceptance", days: avgTimeToConvert, color: CHART_COLORS.blue },
          { stage: "Acceptance → SO", days: 1, color: CHART_COLORS.violet },
          { stage: "SO → Invoice", days: Math.max(1, avgTimeToConvert - 1), color: CHART_COLORS.green },
        ]);

        // Top products
        setTopProducts(products.map((p: any) => ({
          product: p.name,
          quotes: p.quantity,
          converted: p.quantity,
          rate: 100,
          value: p.value
        })));

        // Lost reasons
        setLostReasons(lostData);

        // Insights
        setInsights(insightsData);
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


  const COLORS = [CHART_COLORS.blue, CHART_COLORS.indigo, CHART_COLORS.violet, CHART_COLORS.green];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <MIcon name="autorenew" className="text-[32px] animate-spin text-primary" />
        <span className="ml-[8px] text-body font-medium text-muted-foreground font-medium">Loading sales funnel data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-[24px]">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Sales Funnel</h2>
        <button
          onClick={fetchData}
          className="flex items-center gap-[8px] text-body-sm font-bold text-muted-foreground hover:text-foreground dark:hover:text-slate-100 transition-colors"
        >
          <MIcon name="autorenew" className="text-[16px]" />
          Refresh
        </button>
      </div>

      {/* Summary Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px]">
        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm border-l-[4px] border-l-sky-500">
          <div className="flex items-center justify-between mb-[8px]">
            <p className="text-body-sm font-bold text-muted-foreground">Active Quotes</p>
            <MIcon name="description" className="text-[20px] text-sky-500" />
          </div>
          <p className="text-3xl font-black text-foreground mb-[4px]">{stats.activeQuotes}</p>
          <p className="text-body-sm font-medium text-muted-foreground">₹{(stats.quotesValue / 100000).toFixed(1)}L value</p>
        </div>

        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm border-l-[4px] border-l-emerald-500">
          <div className="flex items-center justify-between mb-[8px]">
            <p className="text-body-sm font-bold text-muted-foreground">Accepted</p>
            <MIcon name="check_circle" className="text-[20px] text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-foreground mb-[4px]">{stats.accepted}</p>
          <p className="text-body-sm font-medium text-muted-foreground">₹{(stats.acceptedValue / 100000).toFixed(1)}L value</p>
        </div>

        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm border-l-[4px] border-l-violet-500">
          <div className="flex items-center justify-between mb-[8px]">
            <p className="text-body-sm font-bold text-muted-foreground">Converted</p>
            <MIcon name="trending_up" className="text-[20px] text-violet-500" />
          </div>
          <p className="text-3xl font-black text-foreground mb-[4px]">{stats.converted}</p>
          <p className="text-body-sm font-medium text-muted-foreground">₹{(stats.convertedValue / 100000).toFixed(1)}L value</p>
        </div>

        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm border-l-[4px] border-l-amber-500">
          <div className="flex items-center justify-between mb-[8px]">
            <p className="text-body-sm font-bold text-muted-foreground">Conversion</p>
            <MIcon name="schedule" className="text-[20px] text-amber-500" />
          </div>
          <p className="text-3xl font-black text-foreground mb-[4px]">{stats.conversionRate}%</p>
          <p className="text-body-sm font-medium text-muted-foreground">Quote to invoice</p>
        </div>
      </div>

      {/* Visual Funnel */}
      <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
        <h3 className="text-h3 font-bold text-foreground mb-[24px]">Sales Funnel Overview</h3>
        <div className="space-y-[12px]">
          {funnelStages.map((stage, index) => (
            <div key={index} className="relative">
              <div className="flex items-center justify-between mb-[8px]">
                <div className="flex items-center gap-[8px]">
                  <MIcon name={stage.icon} className="text-[16px]" style={{ color: stage.color }} />
                  <span className="text-body font-bold text-foreground">{stage.stage}</span>
                </div>
                <div className="text-right">
                  <span className="text-body font-bold text-foreground">{stage.count} deals</span>
                  <span className="text-body-sm font-medium text-muted-foreground ml-[8px]">
                    • ₹{(stage.value / 100000).toFixed(1)}L
                  </span>
                </div>
              </div>
              <div className="relative h-[32px] bg-muted rounded-[8px] overflow-hidden">
                <div
                  className="h-full flex items-center px-[16px] transition-all"
                  style={{
                    width: `${stage.percentage}%`,
                    backgroundColor: stage.color,
                  }}
                >
                  <span className="text-white text-body-sm font-bold">{stage.percentage}%</span>
                </div>
              </div>
              {index < funnelStages.length - 1 && funnelStages[index].count > funnelStages[index + 1].count && (
                <div className="flex items-center gap-[8px] mt-[8px] ml-[24px] text-body-sm font-medium text-muted-foreground">
                  <MIcon name="cancel" className="text-[12px]" style={{ color: CHART_COLORS.red }} />
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
      <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
        <h3 className="text-h3 font-bold text-foreground mb-[16px]">Conversion Rates</h3>
        <div className="space-y-[16px]">
          {conversionRates.map((item, index) => (
            <div key={index} className="space-y-[8px]">
              <div className="flex items-center justify-between">
                <span className="text-body font-bold text-foreground">{item.metric}</span>
                <div className="flex items-center gap-[12px]">
                  <span className="text-body-sm font-medium text-muted-foreground">
                    Benchmark: {item.benchmark}%
                  </span>
                  <span
                    className="text-body font-bold"
                    style={{ color: item.rate >= item.benchmark ? CHART_COLORS.green : CHART_COLORS.red }}
                  >
                    {item.rate}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-[8px]">
                <div className="flex-1 bg-muted rounded-full h-[8px]">
                  <div
                    className="h-[8px] rounded-full"
                    style={{
                      width: `${item.rate}%`,
                      backgroundColor: item.rate >= item.benchmark ? CHART_COLORS.green : CHART_COLORS.red
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
        {/* Sales Value by Stage */}
        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
          <h3 className="text-h3 font-bold text-foreground mb-[16px]">Sales Value by Stage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesByStage}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.slateGrid} vertical={false} />
              <XAxis dataKey="stage" stroke={chartColors.slateGrid} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
              <YAxis stroke={chartColors.slateGrid} tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} cursor={{ fill: 'var(--tw-colors-slate-100)', opacity: 0.1 }} />
              <Bar dataKey="value" fill={CHART_COLORS.blue} name="Value (₹)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lost Reasons Pie Chart */}
        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
          <h3 className="text-h3 font-bold text-foreground mb-[16px]">Reasons for Lost Deals</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={lostReasons}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ reason, percentage }) => percentage > 0 ? `${reason} (${percentage}%)` : null}
                outerRadius={100}
                fill={chartColors.slate}
                dataKey="count"
              >
                {lostReasons.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Time to Convert & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
        {/* Average Time to Convert */}
        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
          <h3 className="text-h3 font-bold text-foreground mb-[16px]">Average Time to Convert</h3>
          <div className="space-y-[16px]">
            {timeToConvert.map((item, index) => (
              <div key={index} className="space-y-[8px]">
                <div className="flex items-center justify-between">
                  <span className="text-body font-bold text-foreground">{item.stage}</span>
                  <span className="text-body-sm font-medium text-muted-foreground">{item.days} days</span>
                </div>
                <div className="w-full bg-muted rounded-full h-[8px]">
                  <div
                    className="h-[8px] rounded-full"
                    style={{
                      width: `${Math.min(100, (item.days / 20) * 100)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-[16px] border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-body-sm font-bold text-muted-foreground">Total Cycle Time:</span>
                <span className="text-h3 font-black text-foreground">{timeToConvert.reduce((sum, item) => sum + item.days, 0)} days avg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Products */}
        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
          <h3 className="text-h3 font-bold text-foreground mb-[16px]">Top Performing Products</h3>
          <div className="space-y-[12px]">
            {topProducts.length === 0 ? (
              <div className="text-center py-[40px] text-muted-foreground font-medium italic">No product data available</div>
            ) : topProducts.map((product, index) => (
              <div
                key={index}
                className="p-[12px] bg-muted dark:bg-slate-800/50 rounded-[12px] border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center justify-between mb-[8px]">
                  <span className="text-body font-bold text-foreground">{product.product}</span>
                  <span
                    className="text-body font-bold"
                    style={{ color: product.rate >= 60 ? CHART_COLORS.green : CHART_COLORS.amber }}
                  >
                    {product.rate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-body-sm font-medium text-muted-foreground">
                  <span>{product.quotes} items</span>
                  <span>Value: ₹{product.value.toLocaleString()}</span>
                </div>
                <div className="mt-[8px] w-full bg-white dark:bg-slate-700 rounded-full h-[6px]">
                  <div
                    className="h-[6px] rounded-full"
                    style={{
                      width: `${product.rate}%`,
                      backgroundColor: product.rate >= 60 ? CHART_COLORS.green : CHART_COLORS.amber
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
        <h3 className="text-h3 font-bold text-foreground mb-[16px]">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
          {insights.map((insight, index) => (
            <div key={index} className={cn(
              "p-[16px] rounded-[12px] border",
              insight.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' :
                insight.type === 'primary' ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800' :
                  insight.type === 'purple' ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800' :
                    'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            )}>
              <div className="flex items-start gap-[12px]">
                <div className={cn(
                  "p-[8px] rounded-[8px]",
                  insight.type === 'success' ? 'bg-emerald-500' :
                    insight.type === 'primary' ? 'bg-sky-500' :
                      insight.type === 'purple' ? 'bg-violet-500' :
                        'bg-amber-500'
                )}>
                  <MIcon
                    name={
                      insight.type === 'success' ? 'check_circle' :
                        insight.type === 'primary' ? 'trending_up' :
                          insight.type === 'purple' ? 'description' :
                            'check_circle'
                    }
                    className="text-[20px] text-white"
                  />
                </div>
                <div>
                  <p className="text-body font-bold text-foreground mb-[4px]">{insight.title}</p>
                  <p className="text-body-sm font-medium text-muted-foreground">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
