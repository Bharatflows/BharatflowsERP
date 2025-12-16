# MSME ERP Backend Test Script - GRN & Banking
# Tests: Stock Increase on GRN, Banking Transaction Balance Updates

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
    
    # ====== STEP 2: CREATE TEST PRODUCT FOR GRN ======
    Write-Host "`n=== STEP 2: Create Test Product for GRN ===" -ForegroundColor Cyan
    
    $productBody = @{
        name           = "GRN Test Product $(Get-Date -Format 'HHmmss')"
        code           = "GRN-$(Get-Date -Format 'HHmmss')"
        unit           = "pcs"
        purchasePrice  = 50
        sellingPrice   = 100
        gstRate        = 18
        currentStock   = 50
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
    
    # ====== STEP 3: CREATE TEST SUPPLIER ======
    Write-Host "`n=== STEP 3: Create Test Supplier ===" -ForegroundColor Cyan
    
    $supplierBody = @{
        name           = "Test Supplier $(Get-Date -Format 'HHmmss')"
        type           = "SUPPLIER"
        email          = "supplier$(Get-Date -Format 'HHmmss')@test.com"
        phone          = "87654$(Get-Date -Format 'HHmm')"
        openingBalance = 0
    } | ConvertTo-Json
    
    $supplierResult = Invoke-WebRequest -Uri "$baseUrl/parties" -Method POST -Headers $headers -Body $supplierBody -UseBasicParsing
    $supplierJson = $supplierResult.Content | ConvertFrom-Json
    
    if ($supplierJson.success) {
        $supplierId = $supplierJson.data.id
        $initialSupplierBalance = [decimal]$supplierJson.data.currentBalance
        Log-Test "Create Supplier" "PASS" "ID: $supplierId, Initial Balance: $initialSupplierBalance"
    }
    else {
        Log-Test "Create Supplier" "FAIL" $supplierJson.message
        exit 1
    }
    
    # ====== STEP 4: CREATE GRN (Goods Received Note) ======
    Write-Host "`n=== STEP 4: Create GRN (Testing Stock Increase) ===" -ForegroundColor Cyan
    
    $grnBody = @{
        supplierId      = $supplierId
        grnDate         = (Get-Date -Format "yyyy-MM-dd")
        referenceNumber = "PO-TEST-001"
        subtotal        = 2500
        totalAmount     = 2950
        items           = @(
            @{
                productId   = $productId
                productName = "GRN Test Product"
                quantity    = 50
                rate        = 50
                total       = 2500
            }
        )
    } | ConvertTo-Json -Depth 5
    
    $grnResult = Invoke-WebRequest -Uri "$baseUrl/purchases/grn" -Method POST -Headers $headers -Body $grnBody -UseBasicParsing
    $grnJson = $grnResult.Content | ConvertFrom-Json
    
    if ($grnJson.success) {
        $grnId = $grnJson.data.id
        $grnNumber = $grnJson.data.grnNumber
        Log-Test "Create GRN" "PASS" "GRN: $grnNumber"
    }
    else {
        Log-Test "Create GRN" "FAIL" $grnJson.message
    }
    
    # ====== STEP 5: VERIFY STOCK INCREASED ======
    Write-Host "`n=== STEP 5: Verify Stock Increased ===" -ForegroundColor Cyan
    
    $productCheckResult = Invoke-WebRequest -Uri "$baseUrl/inventory/products/$productId" -Method GET -Headers $headers -UseBasicParsing
    $productCheck = $productCheckResult.Content | ConvertFrom-Json
    
    $newStock = $productCheck.data.currentStock
    $expectedStock = $initialStock + 50
    
    if ($newStock -eq $expectedStock) {
        Log-Test "Stock Increase" "PASS" "Stock changed: $initialStock -> $newStock (Expected: $expectedStock)"
    }
    else {
        Log-Test "Stock Increase" "FAIL" "Stock is $newStock but expected $expectedStock"
    }
    
    # ====== STEP 6: VERIFY SUPPLIER BALANCE UPDATED ======
    Write-Host "`n=== STEP 6: Verify Supplier Balance Updated ===" -ForegroundColor Cyan
    
    $supplierCheckResult = Invoke-WebRequest -Uri "$baseUrl/parties/$supplierId" -Method GET -Headers $headers -UseBasicParsing
    $supplierCheck = $supplierCheckResult.Content | ConvertFrom-Json
    
    $newSupplierBalance = [decimal]$supplierCheck.data.currentBalance
    
    if ($newSupplierBalance -gt $initialSupplierBalance) {
        Log-Test "Supplier Balance Update" "PASS" "Balance changed: $initialSupplierBalance -> $newSupplierBalance"
    }
    else {
        Log-Test "Supplier Balance Update" "FAIL" "Balance is $newSupplierBalance but should be > $initialSupplierBalance"
    }
    
    # ====== STEP 7: CREATE BANK ACCOUNT ======
    Write-Host "`n=== STEP 7: Create Bank Account ===" -ForegroundColor Cyan
    
    $bankBody = @{
        name          = "Test Account $(Get-Date -Format 'HHmmss')"
        bankName      = "Test Bank"
        accountNumber = "1234567890$(Get-Date -Format 'mmss')"
        ifsc          = "TEST0001234"
        type          = "Current"
        balance       = 10000
        status        = "ACTIVE"
    } | ConvertTo-Json
    
    $bankResult = Invoke-WebRequest -Uri "$baseUrl/banking/accounts" -Method POST -Headers $headers -Body $bankBody -UseBasicParsing
    $bankJson = $bankResult.Content | ConvertFrom-Json
    
    if ($bankJson.success) {
        $accountId = $bankJson.data.id
        $initialBankBalance = [decimal]$bankJson.data.balance
        Log-Test "Create Bank Account" "PASS" "ID: $accountId, Initial Balance: $initialBankBalance"
    }
    else {
        Log-Test "Create Bank Account" "FAIL" $bankJson.message
        exit 1
    }
    
    # ====== STEP 8: CREATE CREDIT TRANSACTION ======
    Write-Host "`n=== STEP 8: Create Credit Transaction ===" -ForegroundColor Cyan
    
    $txnBody = @{
        accountId   = $accountId
        date        = (Get-Date -Format "yyyy-MM-dd")
        description = "Test Credit Transaction"
        category    = "Sales"
        amount      = 5000
        type        = "credit"
        reference   = "INV-TEST-001"
    } | ConvertTo-Json
    
    $txnResult = Invoke-WebRequest -Uri "$baseUrl/banking/transactions" -Method POST -Headers $headers -Body $txnBody -UseBasicParsing
    $txnJson = $txnResult.Content | ConvertFrom-Json
    
    if ($txnJson.success) {
        $txnId = $txnJson.data.id
        Log-Test "Create Credit Transaction" "PASS" "Transaction created"
    }
    else {
        Log-Test "Create Credit Transaction" "FAIL" $txnJson.message
    }
    
    # ====== STEP 9: VERIFY BANK BALANCE INCREASED ======
    Write-Host "`n=== STEP 9: Verify Bank Balance (Credit) ===" -ForegroundColor Cyan
    
    $bankCheckResult = Invoke-WebRequest -Uri "$baseUrl/banking/accounts/$accountId" -Method GET -Headers $headers -UseBasicParsing
    $bankCheck = $bankCheckResult.Content | ConvertFrom-Json
    
    $newBankBalance = [decimal]$bankCheck.data.balance
    $expectedBankBalance = $initialBankBalance + 5000
    
    if ($newBankBalance -eq $expectedBankBalance) {
        Log-Test "Bank Balance (Credit)" "PASS" "Balance changed: $initialBankBalance -> $newBankBalance (Expected: $expectedBankBalance)"
    }
    else {
        Log-Test "Bank Balance (Credit)" "FAIL" "Balance is $newBankBalance but expected $expectedBankBalance"
    }
    
    # ====== STEP 10: CREATE DEBIT TRANSACTION ======
    Write-Host "`n=== STEP 10: Create Debit Transaction ===" -ForegroundColor Cyan
    
    $debitBody = @{
        accountId   = $accountId
        date        = (Get-Date -Format "yyyy-MM-dd")
        description = "Test Debit Transaction"
        category    = "Purchase"
        amount      = 2000
        type        = "debit"
        reference   = "PO-TEST-001"
    } | ConvertTo-Json
    
    $debitResult = Invoke-WebRequest -Uri "$baseUrl/banking/transactions" -Method POST -Headers $headers -Body $debitBody -UseBasicParsing
    $debitJson = $debitResult.Content | ConvertFrom-Json
    
    if ($debitJson.success) {
        Log-Test "Create Debit Transaction" "PASS" "Transaction created"
    }
    else {
        Log-Test "Create Debit Transaction" "FAIL" $debitJson.message
    }
    
    # ====== STEP 11: VERIFY BANK BALANCE DECREASED ======
    Write-Host "`n=== STEP 11: Verify Bank Balance (Debit) ===" -ForegroundColor Cyan
    
    $bankCheck2Result = Invoke-WebRequest -Uri "$baseUrl/banking/accounts/$accountId" -Method GET -Headers $headers -UseBasicParsing
    $bankCheck2 = $bankCheck2Result.Content | ConvertFrom-Json
    
    $finalBankBalance = [decimal]$bankCheck2.data.balance
    $expectedFinalBalance = $expectedBankBalance - 2000
    
    if ($finalBankBalance -eq $expectedFinalBalance) {
        Log-Test "Bank Balance (Debit)" "PASS" "Balance changed: $newBankBalance -> $finalBankBalance (Expected: $expectedFinalBalance)"
    }
    else {
        Log-Test "Bank Balance (Debit)" "FAIL" "Balance is $finalBankBalance but expected $expectedFinalBalance"
    }
    
    # ====== SUMMARY ======
    Write-Host "`n========================================" -ForegroundColor Yellow
    Write-Host "        GRN & BANKING TEST SUMMARY" -ForegroundColor Yellow
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
