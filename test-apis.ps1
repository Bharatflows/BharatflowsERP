// Quick API Test Script for PowerShell
// Save as test-apis.ps1 and run with: .\test-apis.ps1

# Configuration
$baseUrl = "http://localhost:5001/api/v1"
$token = "" # Get from browser localStorage after login

# Color output functions
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Test { param($msg) Write-Host "`n🧪 Testing: $msg" -ForegroundColor Yellow }

# HTTP Helper
function Invoke-API {
    param(
        [string]$Method = "GET",
        [string]$Endpoint,
        [object]$Body = $null
    )
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type"  = "application/json"
    }
    
    try {
        $params = @{
            Uri     = "$baseUrl$Endpoint"
            Method  = $Method
            Headers = $headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        Write-Error "API Error: $_"
        return $null
    }
}

##  INVENTORY TESTS ##
Write-Host "`n`n========================================" -ForegroundColor Magenta
Write-Host "  INVENTORY MODULE TESTS (11 endpoints)" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

# Test 1: Get Low Stock Products
Write-Test "Low Stock Alert"
$lowStock = Invoke-API -Endpoint "/inventory/low-stock"
if ($lowStock.success) {
    Write-Success "Found $($lowStock.data.Count) low stock products"
    $lowStock.data | Select-Object -First 3 | FormatTable name, currentStock, minStock
}
else {
    Write-Error "Low stock test failed"
}

# Test 2: Get Warehouses
Write-Test "List Warehouses"
$warehouses = Invoke-API -Endpoint "/inventory/warehouses"
if ($warehouses.success) {
    Write-Success "Found $($warehouses.data.Count) warehouses"
}
else {
    Write-Error "Warehouse list failed"
}

# Test 3: Get Inventory Valuation
Write-Test "Inventory Valuation"
$valuation = Invoke-API -Endpoint "/inventory/valuation"
if ($valuation.success) {
    Write-Success "Total Inventory Value: ₹$($valuation.data.totalValue)"
    Write-Info "Total Products: $($valuation.data.totalProducts)"
    Write-Info "Total Stock: $($valuation.data.totalStock)"
}
else {
    Write-Error "Valuation test failed"
}

# Test 4: Get Stock Movements
Write-Test "Stock Movements (last 10)"
$movements = Invoke-API -Endpoint "/inventory/stock-movements?limit=10"
if ($movements.success) {
    Write-Success "Retrieved $($movements.data.Count) movements"
}
else {
    Write-Error "Stock movements failed"
}

## GST TESTS ##
Write-Host "`n`n========================================" -ForegroundColor Magenta
Write-Host "  GST COMPLIANCE TESTS (6 endpoints)" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

# Test 5: Generate GSTR1
Write-Test "GSTR1 Report (November 2024)"
$gstr1 = Invoke-API -Endpoint "/gst/gstr1?month=11&year=2024"
if ($gstr1.success) {
    Write-Success "GSTR1 generated successfully"
    Write-Info "Total Invoices: $($gstr1.data.summary.totalInvoices)"
    Write-Info "Total Tax: ₹$($gstr1.data.summary.totalTax)"
}
else {
    Write-Error "GSTR1 generation failed"
}

# Test 6: Generate GSTR3B
Write-Test "GSTR3B Report (November 2024)"
$gstr3b = Invoke-API -Endpoint "/gst/gstr3b?month=11&year=2024"
if ($gstr3b.success) {
    Write-Success "GSTR3B generated successfully"
    Write-Info "Tax Payable CGST: ₹$($gstr3b.data.taxPayable.cgst)"
    Write-Info "Tax Payable SGST: ₹$($gstr3b.data.taxPayable.sgst)"
}
else {
    Write-Error "GSTR3B generation failed"
}

# Test 7: HSN Summary
Write-Test "HSN Summary"
$hsn = Invoke-API -Endpoint "/gst/hsn-summary?startDate=2024-01-01&endDate=2024-12-31"
if ($hsn.success) {
    Write-Success "HSN summary generated - $($hsn.data.Count) HSN codes"
}
else {
    Write-Error "HSN summary failed"
}

# Test 8: ITC Ledger
Write-Test "ITC Ledger"
$itc = Invoke-API -Endpoint "/gst/itc-ledger?startDate=2024-01-01&endDate=2024-12-31"
if ($itc.success) {
    Write-Success "ITC ledger generated"
    Write-Info "Total ITC: ₹$($itc.data.summary.totalITC)"
}
else {
    Write-Error "ITC ledger failed"
}

## REPORTS TESTS ##
Write-Host "`n`n========================================" -ForegroundColor Magenta
Write-Host "  REPORTS MODULE TESTS (8 endpoints)" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

# Test 9: Profit & Loss
Write-Test "Profit & Loss Statement"
$pl = Invoke-API -Endpoint "/reports/profit-loss?startDate=2024-01-01&endDate=2024-12-31"
if ($pl.success) {
    Write-Success "P&L generated successfully"
    Write-Info "Revenue: ₹$($pl.data.revenue.totalSales)"
    Write-Info "Gross Profit: ₹$($pl.data.grossProfit)"
    Write-Info "Net Profit: ₹$($pl.data.netProfit)"
    Write-Info "Profit Margin: $([math]::Round($pl.data.profitMargin, 2))%"
}
else {
    Write-Error "P&L generation failed"
}

# Test 10: Balance Sheet
Write-Test "Balance Sheet"
$bs = Invoke-API -Endpoint "/reports/balance-sheet?asOfDate=2024-12-31"
if ($bs.success) {
    Write-Success "Balance sheet generated"
    Write-Info "Total Assets: ₹$($bs.data.assets.totalAssets)"
    Write-Info "Total Liabilities: ₹$($bs.data.liabilities.totalLiabilities)"
    Write-Info "Equity: ₹$($bs.data.equity.total)"
    if ($bs.data.verification) {
        Write-Success "Balance Sheet balances correctly!"
    }
    else {
        Write-Error "Balance Sheet does NOT balance!"
    }
}
else {
    Write-Error "Balance sheet failed"
}

# Test 11: Aging Receivables
Write-Test "Aging Receivables"
$agingR = Invoke-API -Endpoint "/reports/aging-receivables"
if ($agingR.success) {
    Write-Success "Aging receivables generated"
    Write-Info "Total Receivables: ₹$($agingR.data.totalReceivables)"
    Write-Info "Current (0-30): ₹$($agingR.data.summary.current)"
    Write-Info "Over 90 days: ₹$($agingR.data.summary.over90)"
}
else {
    Write-Error "Aging receivables failed"
}

# Test 12: Aging Payables
Write-Test "Aging Payables"
$agingP = Invoke-API -Endpoint "/reports/aging-payables"
if ($agingP.success) {
    Write-Success "Aging payables generated"
    Write-Info "Total Payables: ₹$($agingP.data.totalPayables)"
}
else {
    Write-Error "Aging payables failed"
}

# Test 13: Sales Report
Write-Test "Sales Report"
$sales = Invoke-API -Endpoint "/reports/sales?startDate=2024-01-01&endDate=2024-12-31"
if ($sales.success) {
    Write-Success "Sales report generated"
    Write-Info "Total Sales: ₹$($sales.data.summary.totalSales)"
    Write-Info "Total Invoices: $($sales.data.summary.totalInvoices)"
    Write-Info "Average Order: ₹$([math]::Round($sales.data.summary.averageOrderValue, 2))"
    Write-Info "Top Customers: $($sales.data.topCustomers.Count)"
}
else {
    Write-Error "Sales report failed"
}

# Test 14: Purchase Report
Write-Test "Purchase Report"
$purchase = Invoke-API -Endpoint "/reports/purchase?startDate=2024-01-01&endDate=2024-12-31"
if ($purchase.success) {
    Write-Success "Purchase report generated"
    Write-Info "Total Purchases: ₹$($purchase.data.summary.totalPurchases)"
    Write-Info "Total Orders: $($purchase.data.summary.totalOrders)"
}
else {
    Write-Error "Purchase report failed"
}

# Test 15: Inventory Report
Write-Test "Inventory Report"
$invReport = Invoke-API -Endpoint "/reports/inventory"
if ($invReport.success) {
    Write-Success "Inventory report generated"
    Write-Info "Total Products: $($invReport.data.summary.totalProducts)"
    Write-Info "Total Value: ₹$($invReport.data.summary.totalValue)"
    Write-Info "Low Stock Items: $($invReport.data.summary.lowStockCount)"
    Write-Info "Out of Stock: $($invReport.data.summary.outOfStockCount)"
}
else {
    Write-Error "Inventory report failed"
}

## SUMMARY ##
Write-Host "`n`n========================================" -ForegroundColor Magenta
Write-Host "  TEST SUMMARY" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

Write-Host "Total Tests: 15"
Write-Host "Inventory: 4/11 endpoints tested"
Write-Host "GST: 4/6 endpoints tested"
Write-Host "Reports: 7/8 endpoints tested"
Write-Host "`nNote: Create/Update/Delete operations not tested in this script"
Write-Host "Test those manually through the UI or with specific test data`n"
