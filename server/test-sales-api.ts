// Sales API Endpoint Testing Script
// Run this with: ts-node test-sales-api.ts

import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api/v1';
let authToken = '';
let testCustomerId = '';
let testProductId = '';
let testEstimateId = '';
let testInvoiceId = '';

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message: string, color: string = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
    log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
    log(`❌ ${message}`, colors.red);
}

function logInfo(message: string) {
    log(`ℹ️  ${message}`, colors.blue);
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Authentication
async function testAuthentication() {
    log('\n=== Test 1: Authentication ===', colors.yellow);
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'authtest@example.com',
            password: 'password123'
        });

        if (response.data.success && response.data.data && response.data.data.token) {
            authToken = response.data.data.token;
            logSuccess('Authentication successful');
            logInfo(`User: ${response.data.data.user?.name || 'Unknown'}`);
            logInfo(`Company: ${response.data.data.company?.businessName || 'Unknown'}`);
            logInfo(`Token: ${authToken.substring(0, 30)}...`);
            return true;
        } else {
            logError('Authentication failed: No token received');
            logInfo(`Response: ${JSON.stringify(response.data)}`);
            return false;
        }
    } catch (error: any) {
        logError(`Authentication failed: ${error.message}`);
        if (error.response) {
            logError(`Status: ${error.response.status}`);
            logError(`Message: ${error.response.data?.message || 'Unknown error'}`);
        }
        return false;
    }
}

// Test 2: Get all invoices (should be empty initially)
async function testGetInvoices() {
    log('\n=== Test 2: Get All Invoices ===', colors.yellow);
    try {
        const response = await axios.get(`${BASE_URL}/sales/invoices`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success) {
            logSuccess(`Retrieved ${response.data.data.invoices.length} invoices`);
            logInfo(`Total: ${response.data.data.pagination.total}`);
            return true;
        }
        return false;
    } catch (error: any) {
        logError(`Get invoices failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// Test 3: Get all estimates
async function testGetEstimates() {
    log('\n=== Test 3: Get All Estimates ===', colors.yellow);
    try {
        const response = await axios.get(`${BASE_URL}/sales/estimates`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success) {
            logSuccess(`Retrieved ${response.data.data.estimates.length} estimates`);
            logInfo(`Total: ${response.data.data.pagination.total}`);
            return true;
        }
        return false;
    } catch (error: any) {
        logError(`Get estimates failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// Test 4: Get all sales orders
async function testGetSalesOrders() {
    log('\n=== Test 4: Get All Sales Orders ===', colors.yellow);
    try {
        const response = await axios.get(`${BASE_URL}/sales/orders`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success) {
            logSuccess(`Retrieved ${response.data.data.orders.length} sales orders`);
            logInfo(`Total: ${response.data.data.pagination.total}`);
            return true;
        }
        return false;
    } catch (error: any) {
        logError(`Get sales orders failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// Test 5: Create estimate (if customer and product exist)
async function testCreateEstimate() {
    log('\n=== Test 5: Create Estimate (Requires Customer & Product) ===', colors.yellow);

    // First, try to get a customer
    try {
        const customersResponse = await axios.get(`${BASE_URL}/parties?type=CUSTOMER&limit=1`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (customersResponse.data.data && customersResponse.data.data.parties && customersResponse.data.data.parties.length > 0) {
            testCustomerId = customersResponse.data.data.parties[0].id;
            logInfo(`Found customer: ${testCustomerId}`);
        } else {
            logInfo('No customers found - skipping estimate creation');
            return false;
        }
    } catch (error) {
        logInfo('Could not fetch customers - skipping estimate creation');
        return false;
    }

    // Try to get a product
    try {
        const productsResponse = await axios.get(`${BASE_URL}/inventory/products?limit=1`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (productsResponse.data.data && productsResponse.data.data.products && productsResponse.data.data.products.length > 0) {
            const product = productsResponse.data.data.products[0];
            testProductId = product.id;
            logInfo(`Found product: ${testProductId}`);

            // Now create estimate
            const estimateData = {
                customerId: testCustomerId,
                date: new Date().toISOString().split('T')[0],
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'PENDING',
                notes: 'Test estimate from API testing script',
                items: [{
                    productId: testProductId,
                    productName: product.name,
                    quantity: 5,
                    rate: product.sellingPrice || 100,
                    taxRate: product.gstRate || 18
                }]
            };

            const response = await axios.post(`${BASE_URL}/sales/estimates`, estimateData, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            if (response.data.success && response.data.data.estimate) {
                testEstimateId = response.data.data.estimate.id;
                logSuccess(`Created estimate: ${response.data.data.estimate.estimateNumber}`);
                logInfo(`Estimate ID: ${testEstimateId}`);
                logInfo(`Total Amount: ₹${response.data.data.estimate.totalAmount}`);
                return true;
            }
        } else {
            logInfo('No products found - skipping estimate creation');
            return false;
        }
    } catch (error: any) {
        logError(`Create estimate failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
    return false;
}

// Test 6: Convert estimate to invoice
async function testConvertEstimate() {
    log('\n=== Test 6: Convert Estimate to Invoice ===', colors.yellow);

    if (!testEstimateId) {
        logInfo('No test estimate available - skipping conversion test');
        return false;
    }

    try {
        const response = await axios.post(
            `${BASE_URL}/sales/estimates/${testEstimateId}/convert`,
            {},
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (response.data.success && response.data.data.invoice) {
            testInvoiceId = response.data.data.invoice.id;
            logSuccess(`Converted to invoice: ${response.data.data.invoice.invoiceNumber}`);
            logInfo(`Invoice ID: ${testInvoiceId}`);
            logInfo(`Total Amount: ₹${response.data.data.invoice.totalAmount}`);
            return true;
        }
        return false;
    } catch (error: any) {
        logError(`Convert estimate failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// Test 7: Get created invoice
async function testGetCreatedInvoice() {
    log('\n=== Test 7: Get Created Invoice ===', colors.yellow);

    if (!testInvoiceId) {
        logInfo('No test invoice available - skipping');
        return false;
    }

    try {
        const response = await axios.get(`${BASE_URL}/sales/invoices/${testInvoiceId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && response.data.data.invoice) {
            const invoice = response.data.data.invoice;
            logSuccess(`Retrieved invoice: ${invoice.invoiceNumber}`);
            logInfo(`Customer: ${invoice.customer?.name || 'N/A'}`);
            logInfo(`Items: ${invoice.items?.length || 0}`);
            logInfo(`Status: ${invoice.status}`);
            logInfo(`Total: ₹${invoice.totalAmount}`);
            return true;
        }
        return false;
    } catch (error: any) {
        logError(`Get invoice failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// Test 8: Search invoices
async function testSearchInvoices() {
    log('\n=== Test 8: Search Invoices ===', colors.yellow);

    try {
        const response = await axios.get(`${BASE_URL}/sales/invoices/search?q=INV`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success) {
            logSuccess(`Search returned ${response.data.data.invoices.length} results`);
            return true;
        }
        return false;
    } catch (error: any) {
        logError(`Search invoices failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// Main test runner
async function runAllTests() {
    log('\n' + '='.repeat(60), colors.blue);
    log('SALES API ENDPOINT TESTING', colors.blue);
    log('='.repeat(60) + '\n', colors.blue);

    const results = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
    };

    const tests = [
        { name: 'Authentication', fn: testAuthentication, critical: true },
        { name: 'Get Invoices', fn: testGetInvoices, critical: false },
        { name: 'Get Estimates', fn: testGetEstimates, critical: false },
        { name: 'Get Sales Orders', fn: testGetSalesOrders, critical: false },
        { name: 'Create Estimate', fn: testCreateEstimate, critical: false },
        { name: 'Convert Estimate', fn: testConvertEstimate, critical: false },
        { name: 'Get Created Invoice', fn: testGetCreatedInvoice, critical: false },
        { name: 'Search Invoices', fn: testSearchInvoices, critical: false },
    ];

    for (const test of tests) {
        results.total++;
        const result = await test.fn();

        if (result) {
            results.passed++;
        } else if (test.critical) {
            results.failed++;
            log(`\n⚠️  Critical test failed. Stopping tests.`, colors.red);
            break;
        } else {
            results.skipped++;
        }

        await sleep(500); // Small delay between tests
    }

    // Summary
    log('\n' + '='.repeat(60), colors.blue);
    log('TEST SUMMARY', colors.blue);
    log('='.repeat(60), colors.blue);
    log(`Total Tests: ${results.total}`);
    log(`Passed: ${results.passed}`, colors.green);
    log(`Failed: ${results.failed}`, results.failed > 0 ? colors.red : colors.reset);
    log(`Skipped: ${results.skipped}`, colors.yellow);
    log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%\n`);
}

// Run tests
runAllTests().catch(error => {
    logError(`Test runner failed: ${error.message}`);
    process.exit(1);
});
