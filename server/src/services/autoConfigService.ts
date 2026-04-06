import prisma from '../config/prisma';
import { SECTOR_BLUEPRINTS, SectorBlueprint } from '../config/sectorBlueprints';
import logger from '../config/logger';

export class AutoConfigService {

    /**
     * Apply a sector blueprint to a company
     * 1. Updates company sector, business type, and enabled modules
     * 2. Creates default ledger groups and ledgers
     */
    async applySectorBlueprint(companyId: string, sector: string): Promise<void> {
        const blueprint = SECTOR_BLUEPRINTS[sector];
        if (!blueprint) {
            throw new Error(`Invalid sector: ${sector}`);
        }

        logger.info(`Applying sector blueprint: ${sector} for company: ${companyId}`);

        // 1. Update Company Configuration
        await prisma.company.update({
            where: { id: companyId },
            data: {
                sector: blueprint.sector,
                businessType: blueprint.businessType,
                enabledModules: blueprint.modules as any,
                sectorConfig: {
                    features: blueprint.features,
                    inventoryTypes: blueprint.inventoryTypes,
                    productionFlow: blueprint.productionFlow
                } as any
            }
        });

        // 2. Create Ledger/Account Structure
        await this.createSectorLedgers(companyId, blueprint);

        // 3. (Optional) Create Sample/Default Data based on inventory types
        // This could be expanded later to create default Units, Categories etc.
    }

    /**
     * Create default ledger groups and ledgers for the sector
     */
    public async createSectorLedgers(companyId: string, blueprint: SectorBlueprint): Promise<void> {
        // First ensure system-level groups exist (Assets, Liabilities, etc.) if not already
        // But here we focus on sector-specific groups defined in the blueprint

        // 1. Create Groups
        for (const group of blueprint.ledgerGroups) {
            // Check if group exists by code
            const existingGroup = await prisma.ledgerGroup.findFirst({
                where: { companyId, code: group.code }
            });

            if (!existingGroup) {
                // Determine parent ID if parentCode is provided
                let parentId: string | undefined;
                if (group.parentCode) {
                    const parent = await prisma.ledgerGroup.findFirst({
                        where: { companyId, code: group.parentCode }
                    });
                    parentId = parent?.id;
                }

                await prisma.ledgerGroup.create({
                    data: {
                        name: group.name,
                        code: group.code,
                        type: group.type,
                        companyId,
                        parentId,
                        // Defaults
                    }
                });
            }
        }

        // 2. Create Ledgers
        for (const ledger of blueprint.ledgers) {
            // Find the group
            const group = await prisma.ledgerGroup.findFirst({
                where: { companyId, code: ledger.groupCode }
            });

            if (!group) {
                logger.warn(`Skipping ledger ${ledger.code}: Group ${ledger.groupCode} not found`);
                continue;
            }

            const existingLedger = await prisma.ledger.findUnique({
                where: {
                    companyId_code: {
                        companyId,
                        code: ledger.code
                    }
                }
            });

            if (!existingLedger) {
                await prisma.ledger.create({
                    data: {
                        name: ledger.name,
                        code: ledger.code,
                        groupId: group.id,
                        companyId,
                        description: ledger.description,
                        isSystemLedger: true,
                        openingBalance: 0,
                        openingType: ledger.openingBalanceType
                    }
                });
            }
        }
    }
}

export const autoConfigService = new AutoConfigService();
