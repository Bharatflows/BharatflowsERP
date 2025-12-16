# MSME ERP Backend Test Script
# Tests: Stock Deduction, Stock Increase, Balance Updates

$baseUrl = "http://localhost:5001/api/v1"
$testResults = @()

function Log-Test {
    param($Name, $Status, $Details)
    $color = if ($Status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "[$Status] $Name" -ForegroundColor $color
    if ($Details) { Write-Host "   -> $Details" -ForegroundColor Gray }
    $script:testResults += @{Name = $Name; Status = $Status; Details = $Details }
}

try {
    # ====== STEP 1: LOGIN ======
    Write-Host "`n=== STEP 1: Authentication ===" -ForegroundColor Cyan
    
    $loginBody = @{email = "testuser@example.com"; password = "Test123!" } | ConvertTo-Json
    $loginResult = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $loginJson = $loginResult.Content | ConvertFrom-Json
    
    if ($loginJson.success -and $loginJson.data.token) {
        $token = $loginJson.data.token
        Log-Test "Login" "PASS" "Token obtained"
    }
    else {
        Log-Test "Login" "FAIL" "No token in response"
        exit 1
    }
    
    $headers = @{Authorization = "Bearer $token"; "Content-Type" = "application/json" }
    
    # ====== STEP 2: CREATE TEST PRODUCT ======
    Write-Host "`n=== STEP 2: Create Test Product ===" -ForegroundColor Cyan
    
    $productBody = @{
        name           = "Stock Test Product $(Get-Date -Format 'HHmmss')"
        code           = "STK-$(Get-Date -Format 'HHmmss')"
        unit           = "pcs"
        purchasePrice  = 50
        sellingPrice   = 100
        gstRate        = 18
        currentStock   = 100
        minStock       = 10
        trackInventory = $true
    } | ConvertTo-Json
    
    $productResult = Invoke-WebRequest -Uri "$baseUrl/inventory/products" -Method POST -Headers $headers -Body $productBody -UseBasicParsing
    $productJson = $productResult.Content | ConvertFrom-Json
    
    if ($productJson.success) {
        $productId = $productJson.data.id
        $initialStock = $productJson.data.currentStock
        Log-Test "Create Product" "PASS" "ID: $productId, Initial Stock: $initialStock"
    }
    else {
        Log-Test "Create Product" "FAIL" $productJson.message
        exit 1
    }
    
    # ====== STEP 3: CREATE TEST CUSTOMER ======
    Write-Host "`n=== STEP 3: Create Test Customer ===" -ForegroundColor Cyan
    
    $customerBody = @{
        name           = "Test Customer $(Get-Date -Format 'HHmmss')"
        type           = "CUSTOMER"
        email          = "cust$(Get-Date -Format 'HHmmss')@test.com"
        phone          = "98765$(Get-Date -Format 'HHmm')"
        openingBalance = 0
    } | ConvertTo-Json
    
    $customerResult = Invoke-WebRequest -Uri "$baseUrl/parties" -Method POST -Headers $headers -Body $customerBody -UseBasicParsing
    $customerJson = $customerResult.Content | ConvertFrom-Json
    
    if ($customerJson.success) {
        $customerId = $customerJson.data.id
        $initialBalance = [decimal]$customerJson.data.currentBalance
        Log-Test "Create Customer" "PASS" "ID: $customerId, Initial Balance: $initialBalance"
    }
    else {
        Log-Test "Create Customer" "FAIL" $customerJson.message
        exit 1
    }
    
    # ====== STEP 4: CREATE INVOICE (Stock Deduction Test) ======
    Write-Host "`n=== STEP 4: Create Invoice (Testing Stock Deduction) ===" -ForegroundColor Cyan
    
    $invoiceBody = @{
        customerId  = $customerId
        invoiceDate = (Get-Date -Format "yyyy-MM-dd")
        dueDate     = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
        status      = "DRAFT"
        items       = @(
            @{
                productId   = $productId
                productName = "Stock Test Product"
                quantity    = 10
                rate        = 100
                taxRate     = 18
            }
        )
    } | ConvertTo-Json -Depth 5
    
    $invoiceResult = Invoke-WebRequest -Uri "$baseUrl/sales/invoices" -Method POST -Headers $headers -Body $invoiceBody -UseBasicParsing
    $invoiceJson = $invoiceResult.Content | ConvertFrom-Json
    
    if ($invoiceJson.success) {
        $invoiceId = $invoiceJson.data.invoice.id
        $invoiceNumber = $invoiceJson.data.invoice.invoiceNumber
        $invoiceTotal = $invoiceJson.data.invoice.totalAmount
        Log-Test "Create Invoice" "PASS" "Invoice: $invoiceNumber, Total: $invoiceTotal"
    }
    else {
        Log-Test "Create Invoice" "FAIL" $invoiceJson.message
    }
    
    # ====== STEP 5: VERIFY STOCK DEDUCTED ======
    Write-Host "`n=== STEP 5: Verify Stock Deducted ===" -ForegroundColor Cyan
    
    $productCheckResult = Invoke-WebRequest -Uri "$baseUrl/inventory/products/$productId" -Method GET -Headers $headers -UseBasicParsing
    $productCheck = $productCheckResult.Content | ConvertFrom-Json
    
    $newStock = $productCheck.data.currentStock
    $expectedStock = $initialStock - 10
    
    if ($newStock -eq $expectedStock) {
        Log-Test "Stock Deduction" "PASS" "Stock changed: $initialStock -> $newStock (Expected: $expectedStock)"
    }
    else {
        Log-Test "Stock Deduction" "FAIL" "Stock is $newStock but expected $expectedStock"
    }
    
    # ====== STEP 6: VERIFY CUSTOMER BALANCE UPDATED ======
    Write-Host "`n=== STEP 6: Verify Customer Balance Updated ===" -ForegroundColor Cyan
    
    $customerCheckResult = Invoke-WebRequest -Uri "$baseUrl/parties/$customerId" -Method GET -Headers $headers -UseBasicParsing
    $customerCheck = $customerCheckResult.Content | ConvertFrom-Json
    
    $newBalance = [decimal]$customerCheck.data.currentBalance
    
    if ($newBalance -gt $initialBalance) {
        Log-Test "Customer Balance Update" "PASS" "Balance changed: $initialBalance -> $newBalance"
    }
    else {
        Log-Test "Customer Balance Update" "FAIL" "Balance is $newBalance but should be > $initialBalance"
    }
    
    # ====== SUMMARY ======
    Write-Host "`n========================================" -ForegroundColor Yellow
    Write-Host "            TEST SUMMARY" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    
    $passed = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
    $failed = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
    
    Write-Host "Passed: $passed" -ForegroundColor Green
    Write-Host "Failed: $failed" -ForegroundColor Red
    Write-Host "Total:  $($testResults.Count)"
    
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
}
