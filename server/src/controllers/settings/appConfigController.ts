/**
 * App Configuration Controller
 * 
 * Manages application-level settings and preferences.
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';

/**
 * Get application configuration
 */
export const getAppConfig = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: {
                id: true,
                enabledModules: true,
                features: true,
                fiscalYear: true,
                valuationMethod: true,
            },
        });

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found',
            });
        }

        // Get default settings with company overrides
        const config = {
            modules: company.enabledModules || {},
            features: company.features || {},
            fiscalYear: company.fiscalYear || 'April-March',
            valuationMethod: company.valuationMethod || 'AVERAGE',
            // Add more app-level settings here
            timeZone: 'Asia/Kolkata',
            dateFormat: 'DD/MM/YYYY',
            numberFormat: 'en-IN',
            currencySymbol: '₹',
        };

        return res.status(200).json({
            success: true,
            data: config,
        });
    } catch (error: any) {
        console.error('Error fetching app config:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch app configuration',
            error: error.message,
        });
    }
};

/**
 * Update application configuration
 */
export const updateAppConfig = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;
        const {
            enabledModules,
            features,
            fiscalYear,
            valuationMethod,
            sector // New optional field
        } = req.body;

        // Validate valuation method
        if (valuationMethod && !['FIFO', 'WEIGHTED_AVERAGE', 'AVERAGE'].includes(valuationMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid valuation method',
            });
        }

        const updateData: any = {};
        if (enabledModules !== undefined) updateData.enabledModules = enabledModules;
        if (features !== undefined) updateData.features = features;
        if (fiscalYear !== undefined) updateData.fiscalYear = fiscalYear;
        if (valuationMethod !== undefined) updateData.valuationMethod = valuationMethod;
        if (sector !== undefined) updateData.sector = sector;

        const company = await prisma.company.update({
            where: { id: companyId },
            data: updateData,
            select: {
                id: true,
                enabledModules: true,
                features: true,
                fiscalYear: true,
                valuationMethod: true,
                sector: true
            },
        });

        // Trigger Auto-Config side effects if sector is provided (e.g. create ledgers)
        if (sector) {
            try {
                // Lazy load service
                const { SECTOR_BLUEPRINTS } = await import('../../config/sectorBlueprints');
                const { autoConfigService } = await import('../../services/autoConfigService');

                const blueprint = SECTOR_BLUEPRINTS[sector];
                if (blueprint) {
                    // Only create ledgers, don't overwrite enabledModules as user may have customized them
                    await autoConfigService.createSectorLedgers(companyId, blueprint);
                }
            } catch (err) {
                console.error('Failed to apply sector ledgers during app config update:', err);
                // Don't fail the request, just log warning
            }
        }

        return res.status(200).json({
            success: true,
            message: 'App configuration updated successfully',
            data: company,
        });
    } catch (error: any) {
        console.error('Error updating app config:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update app configuration',
            error: error.message,
        });
    }
};
