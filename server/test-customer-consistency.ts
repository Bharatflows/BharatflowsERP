// Customer Consistency Testing Script
// Tests that customers are visible across all sales modules
// Run this with: npx ts-node test-customer-consistency.ts

import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api/v1';
let authToken = '';
let testCustomerId = '';
let testProductId = '';
let testInvoiceId = '';
let testEstimateId = '';
let testSalesOrderId = '';
let testDeliveryChallanId = '';

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
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
    log(`ℹ️  ${message}`, colors.cyan);
}

function logWarning(message: string) {
    log(`⚠️  ${message}`, colors.yellow);
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
            return true;
        } else {
            logError('Authentication failed: No token received');
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

// Test 2: Create a test customer
async function testCreateCustomer() {
    log('\n=== Test 2: Create Test Customer ===', colors.yellow);
    try {
        const customerData = {
            name: `Test Customer ${Date.now()}`,
            type: 'customer', // Testing with lowercase
            email: `testcustomer${Date.now()}@example.com`,
            phone: '9876543210',
            gstin: '27AABCU9603R1ZM',
            pan: 'AABCU9603R',
            address: '123 Test Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            openingBalance: 0
        };

        const response = await axios.post(`${BASE_URL}/parties`, customerData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && response.data.data) {
            testCustomerId = response.data.data.id;
            logSuccess(`Created customer: ${response.data.data.name}`);
            logInfo(`Customer ID: ${testCustomerId}`);
            logInfo(`Type stored as: ${response.data.data.type}`);
            return true;
        }
        return false;
    } catch (error: any) {
        logError(`Create customer failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// Test 3: Create a test product
async function testCreateProduct() {
    log('\n=== Test 3: Create Test Product ===', colors.yellow);
    try {
        const productData = {
            name: `Test Product ${Date.now()}`,
            code: `PROD-${Date.now()}`,
            hsnCode: '1234',
            description: 'Test product for API testing',
            unit: 'pcs',
            purchasePrice: 100,
            sellingPrice: 150,
            gstRate: 18,
            currentStock: 100,
            minStock: 10,
            category: 'Test',
            trackInventory: true
        };

        const response = await axios.post(`${BASE_URL}/inventory/products`, productData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && response.data.data) {
            testProductId = response.data.data.id;
            logSuccess(`Created product: ${response.data.data.name}`);
            logInfo(`Product ID: ${testProductId}`);
            return true;
        }
        return false;
    } catch (error: any) {
        logError(`Create product failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// Test 4: Verify customer appears in parties list with type filter
async function testCustomerInPartiesList() {
    log('\n=== Test 4: Verify Customer in Parties List (with type=customer filter) ===', colors.yellow);
    try {
        const response = await axios.get(`${BASE_URL}/parties?type=customer`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && response.data.data) {
            const customers = response.data.data;
            const foundCustomer = customers.find((c: any) => c.id === testCustomerId);

            if (foundCustomer) {
                logSuccess(`Customer found in parties list`);
                logInfo(`Total customers: ${customers.length}`);
                return true;
            } else {
                logError(`Customer NOT found in parties list with type=customer filter`);
                logInfo(`Total customers returned: ${customers.length}`);
                return false;
            }
        }
        return false;
    } catch (error: any) {
        logError(`Get parties failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// Test 5: Create Invoice with the test customer
async function testCreateInvoice() {
    log('\n=== Test 5: Create Invoice with Test Customer ===', colors.yellow);
    try {
        const invoiceData = {
            customerId: testCustomerId,
            invoiceDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'DRAFT',
            notes: 'Test invoice for customer consistency verification',
            items: [{
                productId: testProductId,
                productName: 'Test Product',
                quantity: 2,
                rate: 150,
                taxRate: 18
            }]
        };

        const response = await axios.post(`${BASE_URL}/sales/invoices`, invoiceData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && response.data.data.invoice) {
            testInvoiceId = response.data.data.invoice.id;
            logSuccess(`Created invoice: ${response.data.data.invoice.invoiceNumber}`);
            logInfo(`Invoice ID: ${testInvoiceId}`);
            logInfo(`Customer ID in invoice: ${response.data.data.invoice.customerId}`);
            return true;
        }
        return false;
    } catch (error: any) {
        logError(`Create invoice failed: ${error.response?.data?.message || error.message}`);
        if (error.response?.data) {
            logInfo(`Error details: ${JSON.stringify(error.response.data)}`);
        }
        return false;
    }
}

// Test 6: Create Estimate with the test customer
async function testCreateEstimate() {
    log('\n=== Test 6: Create Estimate with Test Customer ===', colors.yellow);
    try {
        const estimateData = {
            customerId: testCustomerId,
            date: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'PENDING',
            notes: 'Test estimate for customer consistency verification',
            items: [{
                productId: testProductId,
                productName: 'Test Product',
                quantity: 3,
                rate: 150,
                taxRate: 18
            }]
        };

        const response = await axios.post(`${BASE_URL}/sales/estimates`, estimateData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && response.data.data.estimate) {
            testEstimateId = response.data.data.estimate.id;
            logSuccess(`Created estimate: ${response.data.data.estimate.estimateNumber}`);
            logInfo(`Estimate ID: ${testEstimateId}`);
            logInfo(`Customer ID in estimate: ${response.data.data.estimate.customerId}`);
            return true;
        }
        return false;
    } catch (error: any) {
        logError(`Create estimate failed: ${error.response?.data?.message || error.message}`);
        if (error.response?.data) {
            logInfo(`Error details: ${JSON.stringify(error.response.data)}`);
        }
        return false;
    }
}

// Test 7: Create Sales Order with the test customer
async function testCreateSalesOrder() {
    log('\n=== Test 7: Create Sales Order with Test Customer ===', colors.yellow);
    try {
        const orderData = {
            customerId: testCustomerId,
            orderDate: new Date().toISOString().split('T')[0],
            expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'DRAFT',
            notes: 'Test sales order for customer consistency verification',
            items: [{
                productId: testProductId,
                productName: 'Test Product',
                quantity: 5,
                rate: 150,
                taxRate: 18
            }]
        };

        const response = await axios.post(`${BASE_URL}/sales/orders`, orderData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && response.data.data.order) {
            testSalesOrderId = response.data.data.order.id;
            logSuccess(`Created sales order: ${response.data.data.order.orderNumber}`);
            logInfo(`Order ID: ${testSalesOrderId}`);
            logInfo(`Customer ID in order: ${response.data.data.order.customerId}`);
            return true;
        }
        return false;
    } catch (error: any) {
        logError(`Create sales order failed: ${error.response?.data?.message || error.message}`);
        if (error.response?.data) {
            logInfo(`Error details: ${JSON.stringify(error.response.data)}`);
        }
        return false;
    }
}

// Test 8: Create Delivery Challan with the test customer
async function testCreateDeliveryChallan() {
    log('\n=== Test 8: Create Delivery Challan with Test Customer ===', colors.yellow);
    try {
        const challanData = {
            customerId: testCustomerId,
            challanDate: new Date().toISOString().split('T')[0],
            referenceNumber: `REF-${Date.now()}`,
            notes: 'Test delivery challan for customer consistency verification',
            items: [{
                productId: testProductId,
                productName: 'Test Product',
                quantity: 4,
                rate: 150
            }]
        };

        const response = await axios.post(`${BASE_URL}/sales/challans`, challanData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && response.data.data.challan) {
            testDeliveryChallanId = response.data.data.challan.id;
            logSuccess(`Created delivery challan: ${response.data.data.challan.challanNumber}`);
            logInfo(`Challan ID: ${testDeliveryChallanId}`);
            logInfo(`Customer ID in challan: ${response.data.data.challan.customerId}`);
            return true;
        }
        return false;
    } catch (error: any) {
        logError(`Create delivery challan failed: ${error.response?.data?.message || error.message}`);
        if (error.response?.data) {
            logInfo(`Error details: ${JSON.stringify(error.response.data)}`);
        }
        return false;
    }
}

// Test 9: Verify all created records reference the same customer
async function testCustomerConsistency() {
    log('\n=== Test 9: Verify Customer Consistency Across All Modules ===', colors.yellow);

    const checks = [];

    // Check invoice
    if (testInvoiceId) {
        try {
            const response = await axios.get(`${BASE_URL}/sales/invoices/${testInvoiceId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            const customerMatch = response.data.data.invoice.customerId === testCustomerId;
            checks.push({ module: 'Invoice', match: customerMatch });
            log(`Invoice customer ${customerMatch ? '✓' : '✗'} matches`, customerMatch ? colors.green : colors.red);
        } catch (error) {
            checks.push({ module: 'Invoice', match: false });
            logError('Failed to verify invoice');
        }
    }

    // Check estimate
    if (testEstimateId) {
        try {
            const response = await axios.get(`${BASE_URL}/sales/estimates/${testEstimateId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            const customerMatch = response.data.data.estimate.customerId === testCustomerId;
            checks.push({ module: 'Estimate', match: customerMatch });
            log(`Estimate customer ${customerMatch ? '✓' : '✗'} matches`, customerMatch ? colors.green : colors.red);
        } catch (error) {
            checks.push({ module: 'Estimate', match: false });
            logError('Failed to verify estimate');
        }
    }

    // Check sales order
    if (testSalesOrderId) {
        try {
            const response = await axios.get(`${BASE_URL}/sales/orders/${testSalesOrderId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            const customerMatch = response.data.data.order.customerId === testCustomerId;
            checks.push({ module: 'Sales Order', match: customerMatch });
            log(`Sales Order customer ${customerMatch ? '✓' : '✗'} matches`, customerMatch ? colors.green : colors.red);
        } catch (error) {
            checks.push({ module: 'Sales Order', match: false });
            logError('Failed to verify sales order');
        }
    }

    // Check delivery challan
    if (testDeliveryChallanId) {
        try {
            const response = await axios.get(`${BASE_URL}/sales/challans/${testDeliveryChallanId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            const customerMatch = response.data.data.challan.customerId === testCustomerId;
            checks.push({ module: 'Delivery Challan', match: customerMatch });
            log(`Delivery Challan customer ${customerMatch ? '✓' : '✗'} matches`, customerMatch ? colors.green : colors.red);
        } catch (error) {
            checks.push({ module: 'Delivery Challan', match: false });
            logError('Failed to verify delivery challan');
        }
    }

    const allMatch = checks.every(c => c.match);
    if (allMatch && checks.length > 0) {
        logSuccess('All modules reference the same customer!');
        return true;
    } else if (checks.length === 0) {
        logWarning('No modules created to verify');
        return false;
    } else {
        logError('Customer consistency check FAILED');
        return false;
    }
}

// Test 10: Cleanup - Delete test data
async function testCleanup() {
    log('\n=== Test 10: Cleanup Test Data ===', colors.yellow);

    let cleanupSuccess = true;

    // Delete invoice
    if (testInvoiceId) {
        try {
            await axios.delete(`${BASE_URL}/sales/invoices/${testInvoiceId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            logSuccess('Deleted test invoice');
        } catch (error) {
            logWarning('Could not delete test invoice');
            cleanupSuccess = false;
        }
    }

    // Delete estimate
    if (testEstimateId) {
        try {
            await axios.delete(`${BASE_URL}/sales/estimates/${testEstimateId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            logSuccess('Deleted test estimate');
        } catch (error) {
            logWarning('Could not delete test estimate');
            cleanupSuccess = false;
        }
    }

    // Delete sales order
    if (testSalesOrderId) {
        try {
            await axios.delete(`${BASE_URL}/sales/orders/${testSalesOrderId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            logSuccess('Deleted test sales order');
        } catch (error) {
            logWarning('Could not delete test sales order');
            cleanupSuccess = false;
        }
    }

    // Delete delivery challan
    if (testDeliveryChallanId) {
        try {
            await axios.delete(`${BASE_URL}/sales/challans/${testDeliveryChallanId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            logSuccess('Deleted test delivery challan');
        } catch (error) {
            logWarning('Could not delete test delivery challan');
            cleanupSuccess = false;
        }
    }

    // Delete product
    if (testProductId) {
        try {
            await axios.delete(`${BASE_URL}/inventory/products/${testProductId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            logSuccess('Deleted test product');
        } catch (error) {
            logWarning('Could not delete test product');
            cleanupSuccess = false;
        }
    }

    // Delete customer
    if (testCustomerId) {
        try {
            await axios.delete(`${BASE_URL}/parties/${testCustomerId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            logSuccess('Deleted test customer');
        } catch (error) {
            logWarning('Could not delete test customer');
            cleanupSuccess = false;
        }
    }

    return cleanupSuccess;
}

// Main test runner
async function runAllTests() {
    log('\n' + '='.repeat(70), colors.blue);
    log('CUSTOMER CONSISTENCY VERIFICATION TEST', colors.blue);
    log('Testing that customers are visible across all sales modules', colors.cyan);
    log('='.repeat(70) + '\n', colors.blue);

    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };

    const tests = [
        { name: 'Authentication', fn: testAuthentication, critical: true },
        { name: 'Create Customer (lowercase type)', fn: testCreateCustomer, critical: true },
        { name: 'Create Product', fn: testCreateProduct, critical: true },
        { name: 'Verify Customer in Parties List', fn: testCustomerInPartiesList, critical: false },
        { name: 'Create Invoice', fn: testCreateInvoice, critical: false },
        { name: 'Create Estimate', fn: testCreateEstimate, critical: false },
        { name: 'Create Sales Order', fn: testCreateSalesOrder, critical: false },
        { name: 'Create Delivery Challan', fn: testCreateDeliveryChallan, critical: false },
        { name: 'Verify Customer Consistency', fn: testCustomerConsistency, critical: false },
        { name: 'Cleanup Test Data', fn: testCleanup, critical: false }
    ];

    for (const test of tests) {
        results.total++;
        const result = await test.fn();

        if (result) {
            results.passed++;
        } else {
            results.failed++;
            if (test.critical) {
                log(`\n⚠️  Critical test failed. Stopping tests.`, colors.red);
                break;
            }
        }

        await sleep(500); // Small delay between tests
    }

    // Summary
    log('\n' + '='.repeat(70), colors.blue);
    log('TEST SUMMARY', colors.blue);
    log('='.repeat(70), colors.blue);
    log(`Total Tests: ${results.total}`);
    log(`Passed: ${results.passed}`, colors.green);
    log(`Failed: ${results.failed}`, results.failed > 0 ? colors.red : colors.reset);
    log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%\n`);

    if (results.failed === 0) {
        logSuccess('🎉 All tests passed! Customer consistency is working correctly.');
    } else {
        logError('Some tests failed. Please review the output above for details.');
    }
}

// Run tests
runAllTests().catch(error => {
    logError(`Test runner failed: ${error.message}`);
    process.exit(1);
});
