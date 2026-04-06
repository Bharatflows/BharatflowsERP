import prisma from '../config/prisma';
import logger from '../config/logger';

/**
 * Seeds master data (Industries) if tables are empty.
 * Called on server startup to ensure onboarding always has data.
 */
export async function seedMasterDataIfEmpty(): Promise<void> {
    try {
        // Check if industries exist
        const industryCount = await prisma.industry.count();

        if (industryCount === 0) {
            logger.info('🌱 Seeding master data (Industries)...');

            // Comprehensive list of industries for Indian MSMEs
            const industries = [
                // Manufacturing
                'Textiles & Garments',
                'Pharma & Healthcare',
                'Food Processing',
                'Packaging',
                'Plastics & Rubber',
                'Electrical & Electronics',
                'Automotive & Components',
                'Machinery & Equipment',
                'Metal Fabrication',
                'Chemicals',
                'Paper & Printing',
                'Leather & Footwear',
                'Furniture & Wood',
                'Gems & Jewelry',
                'Ceramics & Glass',
                'Cosmetics & Personal Care',

                // Trading & Distribution
                'FMCG',
                'Consumer Electronics',
                'Building Materials',
                'Hardware & Tools',
                'Agricultural Products',
                'Textiles Trading',
                'Wholesale Distribution',

                // Services
                'IT & Software',
                'Consulting & Professional Services',
                'Financial Services',
                'Logistics & Transportation',
                'Hospitality & Tourism',
                'Healthcare Services',
                'Education & Training',
                'Real Estate',
                'Media & Entertainment',
                'Advertising & Marketing',

                // Agriculture & Allied
                'Agriculture',
                'Dairy & Poultry',
                'Fisheries',
                'Horticulture',

                // Others
                'Construction',
                'Energy & Renewables',
                'Waste Management',
                'E-commerce',
                'Handlooms & Handicrafts'
            ];

            for (const name of industries) {
                await prisma.industry.upsert({
                    where: { name },
                    update: { isCustom: false, status: 'active' },
                    create: { name, isCustom: false, status: 'active' }
                });
            }

            logger.info(`✅ Seeded ${industries.length} industries`);
        } else {
            logger.info(`✅ Master data already exists (${industryCount} industries)`);
        }
    } catch (error: any) {
        logger.error('❌ Failed to seed master data:', error.message);
        // Don't throw - allow server to continue
    }
}
