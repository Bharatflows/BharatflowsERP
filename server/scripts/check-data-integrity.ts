import { exec } from 'child_process';
import { promisify } from 'util';
import prisma from '../src/config/prisma';

const execAsync = promisify(exec);

interface IntegrityReport {
    timestamp: string;
    databaseConnected: boolean;
    dockerContainerRunning: boolean;
    volumeExists: boolean;
    tablesCounts: Record<string, number>;
    totalRecords: number;
    issues: string[];
}

async function checkDataIntegrity(): Promise<IntegrityReport> {
    const report: IntegrityReport = {
        timestamp: new Date().toISOString(),
        databaseConnected: false,
        dockerContainerRunning: false,
        volumeExists: false,
        tablesCounts: {},
        totalRecords: 0,
        issues: []
    };

    console.log('\n🔍 Starting Data Integrity Check...\n');
    console.log(`📅 ${new Date().toLocaleString()}\n`);

    // Check Docker container
    try {
        const { stdout } = await execAsync('docker ps --filter "name=bharatflow_postgres" --format "{{.Status}}"');
        if (stdout.trim()) {
            report.dockerContainerRunning = true;
            console.log('✅ Docker PostgreSQL container is running');
        } else {
            report.dockerContainerRunning = false;
            report.issues.push('PostgreSQL Docker container is not running');
            console.log('❌ Docker PostgreSQL container is NOT running');
        }
    } catch (error) {
        report.issues.push('Failed to check Docker container status');
        console.log('⚠️  Could not check Docker container status');
    }

    // Check Docker volume
    try {
        const { stdout } = await execAsync('docker volume ls --filter "name=pgdata" --format "{{.Name}}"');
        if (stdout.includes('pgdata')) {
            report.volumeExists = true;
            console.log('✅ PostgreSQL data volume exists');

            // Get volume size
            const { stdout: volumeInfo } = await execAsync('docker volume inspect server_pgdata --format "{{.Mountpoint}}"');
            console.log(`📁 Volume location: ${volumeInfo.trim()}`);
        } else {
            report.volumeExists = false;
            report.issues.push('PostgreSQL data volume not found');
            console.log('❌ PostgreSQL data volume NOT found');
        }
    } catch (error) {
        report.issues.push('Failed to check Docker volume');
        console.log('⚠️  Could not check Docker volume');
    }

    // Check database connection and count records
    try {
        await prisma.$connect();
        report.databaseConnected = true;
        console.log('✅ Database connection successful\n');

        console.log('📊 Counting records in tables...\n');

        // Count records in main tables
        const counts = {
            users: await prisma.user.count(),
            companies: await prisma.company.count(),
            parties: await prisma.party.count(),
            products: await prisma.product.count(),
            invoices: await prisma.invoice.count(),
            purchaseOrders: await prisma.purchaseOrder.count(),
            expenses: await prisma.expense.count()
        };

        report.tablesCounts = counts;
        report.totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);

        console.log(`   👥 Users: ${counts.users}`);
        console.log(`   🏢 Companies: ${counts.companies}`);
        console.log(`   🤝 Parties: ${counts.parties}`);
        console.log(`   📦 Products: ${counts.products}`);
        console.log(`   📄 Invoices: ${counts.invoices}`);
        console.log(`   🛒 Purchase Orders: ${counts.purchaseOrders}`);
        console.log(`   💰 Expenses: ${counts.expenses}`);
        console.log(`\n   📊 Total Records: ${report.totalRecords}`);

        // Check for data integrity issues
        if (counts.users === 0) {
            report.issues.push('No users found in database');
            console.log('\n⚠️  WARNING: No users in database!');
        }
        if (counts.companies === 0) {
            report.issues.push('No companies found in database');
            console.log('⚠️  WARNING: No companies in database!');
        }

        await prisma.$disconnect();
    } catch (error: any) {
        report.databaseConnected = false;
        report.issues.push(`Database connection failed: ${error.message}`);
        console.log('❌ Database connection FAILED');
        console.error('   Error:', error.message);
        await prisma.$disconnect();
    }

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 INTEGRITY CHECK SUMMARY');
    console.log('='.repeat(50));

    if (report.issues.length === 0) {
        console.log('✅ All checks passed! Your data is safe.');
    } else {
        console.log(`⚠️  Found ${report.issues.length} issue(s):\n`);
        report.issues.forEach((issue, index) => {
            console.log(`   ${index + 1}. ${issue}`);
        });
    }

    console.log('='.repeat(50) + '\n');

    return report;
}

// Run check if called directly
if (require.main === module) {
    checkDataIntegrity()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Integrity check failed:', error);
            process.exit(1);
        });
}

export { checkDataIntegrity };
