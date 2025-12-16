// Create Test Data and Run Full Sales Workflow Test
// Run with: ts-node test-sales-full-workflow.ts

import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api/v1';
let authToken = '';
let customerId = '';
let productId = '';
let estimateId = '';
let invoiceId = '';

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
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

function logStep(message: string) {
    log(`\n${'='.repeat(60)}`, colors.cyan);
    log(message, colors.cyan);
    log('='.repeat(60), colors.cyan);
}

// Step 1: Login
async function login() {
    logStep('STEP 1: Authentication');
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'authtest@example.com',
            password: 'password123'
        });

        if (response.data.success && response.data.data?.token) {
            authToken = response.data.data.token;
            logSuccess('Logged in successfully');
            logInfo(`User: ${response.data.data.user.name}`);
            logInfo(`Company: ${response.data.data.company.businessName}`);
            return true;
        }
        return false;
    } catch (error: any) {
        logError(`Login failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// Step 2: Create Test Customer
async function createCustomer() {
    logStep('STEP 2: Creating Test Customer');
    try {
        const customerData = {
            name: 'Acme Corporation',
            type: 'CUSTOMER',
            email: 'acme@example.com',
            phone: '+919876543211',
            gstin: '29ABCDE1234F1Z5',
            billingAddress: {
                street: '123 Business Park',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001',
                country: 'India'
            }
        };

        const response = await axios.post(`${BASE_URL}/parties`, customerData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && response.data.data) {
            customerId = response.data.data.party?.id || response.data.data.id;
            logSuccess(`Customer created: ${customerData.name}`);
            logInfo(`Customer ID: ${customerId}`);
            return true;
        }
        return false;
    } catch (error: any) {
        if (error.response?.status === 404) {
            logError('Parties API endpoint not found - need to implement parties routes');
        } else {
            logError(`Create customer failed: ${error.response?.data?.message || error.message}`);
        }
        return false;
    }
}

// Step 3: Create Test Product
async function createProduct() {
    logStep('STEP 3: Creating Test Product');
    try {
        const productData = {
            name: 'Premium Widget',
            code: 'WDG-001',
            hsnCode: '84149090',
            unit: 'pcs',
            sellingPrice: 1000,
            purchasePrice: 800,
            gstRate: 18,
            currentStock: 100,
            minStock: 10
        };

        const response = await axios.post(`${BASE_URL}/inventory/products`, productData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && response.data.data) {
            productId = response.data.data.product?.id || response.data.data.id;
            logSuccess(`Product created: ${productData.name}`);
            logInfo(`Product ID: ${productId}`);
            logInfo(`Price: ₹${productData.sellingPrice} | GST: ${productData.gstRate}%`);
            return true;
        }
        return false;
    } catch (error: any) {
        if (error.response?.status === 404) {
            logError('Inventory API endpoint not found - need to implement inventory routes');
        } else {
            logError(`Create product failed: ${error.response?.data?.message || error.message}`);
        }
        return false;
    }
}

// Step 4: Create Estimate
async function createEstimate() {
    logStep('STEP 4: Creating Estimate');

    if (!customerId || !productId) {
        logError('Cannot create estimate - missing customer or product');
        logInfo('Creating estimate with placeholder IDs for testing...');

        // Try with generated UUIDs as fallback
        customerId = customerId || '00000000-0000-0000-0000-000000000001';
        productId = productId || '00000000-0000-0000-0000-000000000002';
    }

    try {
        const estimateData = {
            customerId: customerId,
            date: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'PENDING',
            notes: 'Test estimate created via automated testing script',
            items: [
                {
                    productId: productId,
                    productName: 'Premium Widget',
                    quantity: 5,
                    rate: 1000,
                    taxRate: 18
                }
            ]
        };

        const response = await axios.post(`${BASE_URL}/sales/estimates`, estimateData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && response.data.data?.estimate) {
            const estimate = response.data.data.estimate;
            estimateId = estimate.id;
            logSuccess(`Estimate created: ${estimate.estimateNumber}`);
            logInfo(`Estimate ID: ${estimateId}`);
            logInfo(`Subtotal: ₹${estimate.subtotal}`);
            logInfo(`Tax: ₹${estimate.totalTax}`);
            logInfo(`Total: ₹${estimate.totalAmount}`);
            logInfo(`Valid Until: ${estimate.validUntil}`);
            return true;
        }
        return false;
    } catch (error: any) {
        logError(`Create estimate failed: ${error.response?.data?.message || error.message}`);
        if (error.response?.data?.error) {
            logError(`Details: ${error.response.data.error}`);
        }
        return false;
    }
}

// Step 5: Convert Estimate to Invoice
async function convertEstimateToInvoice() {
    logStep('STEP 5: Converting Estimate to Invoice');

    if (!estimateId) {
        logError('Cannot convert - no estimate ID available');
        return false;
    }

    try {
        const response = await axios.post(
            `${BASE_URL}/sales/estimates/${estimateId}/convert`,
            {},
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (response.data.success && response.data.data?.invoice) {
            const invoice = response.data.data.invoice;
            invoiceId = invoice.id;
            logSuccess(`✨ Estimate converted to Invoice!`);
            logInfo(`Invoice Number: ${invoice.invoiceNumber}`);
            logInfo(`Invoice ID: ${invoiceId}`);
            logInfo(`Total Amount: ₹${invoice.totalAmount}`);
            logInfo(`Due Date: ${invoice.dueDate}`);
            logInfo(`Status: ${invoice.status}`);
            return true;
        }
        return false;
    } catch (error: any) {
        logError(`Convert estimate failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// Step 6: Get Invoice Details
async function getInvoiceDetails() {
    logStep('STEP 6: Retrieving Invoice Details');

    if (!invoiceId) {
        logError('Cannot retrieve - no invoice ID available');
        return false;
    }

    try {
        const response = await axios.get(`${BASE_URL}/sales/invoices/${invoiceId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && response.data.data?.invoice) {
            const invoice = response.data.data.invoice;
            logSuccess('Invoice retrieved successfully');
            logInfo(`Invoice Number: ${invoice.invoiceNumber}`);
            logInfo(`Customer: ${invoice.customer?.name || 'N/A'}`);
            logInfo(`Items Count: ${invoice.items?.length || 0}`);

            if (invoice.items && invoice.items.length > 0) {
                log('\nItems:', colors.yellow);
                invoice.items.forEach((item: any, index: number) => {
                    logInfo(`  ${index + 1}. ${item.productName} - Qty: ${item.quantity} @ ₹${item.rate} = ₹${item.total}`);
                });
            }

            log('\nFinancials:', colors.yellow);
            logInfo(`  Subtotal: ₹${invoice.subtotal}`);
            logInfo(`  Tax: ₹${invoice.totalTax}`);
            logInfo(`  Total: ₹${invoice.totalAmount}`);
            logInfo(`  Balance Due: ₹${invoice.balanceAmount}`);

            return true;
        }
        return false;
    } catch (error: any) {
        logError(`Get invoice failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// Step 7: List All Invoices
async function listAllInvoices() {
    logStep('STEP 7: Listing All Invoices');

    try {
        const response = await axios.get(`${BASE_URL}/sales/invoices?limit=10`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success) {
            const invoices = response.data.data.invoices;
            const total = response.data.data.pagination.total;

            logSuccess(`Retrieved ${invoices.length} of ${total} total invoices`);

            if (invoices.length > 0) {
                log('\nRecent Invoices:', colors.yellow);
                invoices.forEach((inv: any, index: number) => {
                    logInfo(`  ${index + 1}. ${inv.invoiceNumber} - ${inv.customer?.name || 'Unknown'} - ₹${inv.totalAmount} - ${inv.status}`);
                });
            }

            return true;
        }
        return false;
    } catch (error: any) {
        logError(`List invoices failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// Step 8: Update Invoice Status
async function updateInvoiceStatus() {
    logStep('STEP 8: Updating Invoice Status to SENT');

    if (!invoiceId) {
        logError('Cannot update - no invoice ID available');
        return false;
    }

    try {
        const response = await axios.put(
            `${BASE_URL}/sales/invoices/${invoiceId}`,
            { status: 'SENT', notes: 'Invoice sent to customer via email' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (response.data.success && response.data.data?.invoice) {
            const invoice = response.data.data.invoice;
            logSuccess('Invoice updated successfully');
            logInfo(`New Status: ${invoice.status}`);
            logInfo(`Notes: ${invoice.notes}`);
            return true;
        }
        return false;
    } catch (error: any) {
        logError(`Update invoice failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// Main workflow
async function runFullWorkflow() {
    log('\n' + '═'.repeat(70), colors.blue);
    log('  SALES MODULE - FULL WORKFLOW TEST', colors.blue);
    log('  Testing Complete CRUD Operations with Real Data', colors.blue);
    log('═'.repeat(70) + '\n', colors.blue);

    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };

    const steps = [
        { name: 'Authentication', fn: login },
        { name: 'Create Customer', fn: createCustomer },
        { name: 'Create Product', fn: createProduct },
        { name: 'Create Estimate', fn: createEstimate },
        { name: 'Convert to Invoice', fn: convertEstimateToInvoice },
        { name: 'Get Invoice Details', fn: getInvoiceDetails },
        { name: 'List All Invoices', fn: listAllInvoices },
        { name: 'Update Invoice Status', fn: updateInvoiceStatus }
    ];

    for (const step of steps) {
        results.total++;
        const success = await step.fn();

        if (success) {
            results.passed++;
        } else {
            results.failed++;
            // Continue even if step fails (for testing purposes)
        }

        // Small delay between steps
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Final summary
    log('\n' + '═'.repeat(70), colors.blue);
    log('  TEST SUMMARY', colors.blue);
    log('═'.repeat(70), colors.blue);
    log(`Total Steps: ${results.total}`);
    log(`Passed: ${results.passed}`, colors.green);
    log(`Failed: ${results.failed}`, results.failed > 0 ? colors.red : colors.green);
    log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

    if (customerId) log(`\n📋 Customer ID: ${customerId}`, colors.cyan);
    if (productId) log(`📦 Product ID: ${productId}`, colors.cyan);
    if (estimateId) log(`📄 Estimate ID: ${estimateId}`, colors.cyan);
    if (invoiceId) log(`🧾 Invoice ID: ${invoiceId}`, colors.cyan);

    log('\n' + '═'.repeat(70) + '\n', colors.blue);
}

// Run the workflow
runFullWorkflow().catch(error => {
    logError(`Workflow failed: ${error.message}`);
    process.exit(1);
});
