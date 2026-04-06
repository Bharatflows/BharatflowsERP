import { Response } from 'express';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { AuthRequest } from '../middleware/auth';
import { eventBus } from '../services/eventBus';
import { maskBankAccount, maskIFSC } from '../utils/maskSensitiveData';
import { uploadToCloudinary, isCloudinaryConfigured } from '../services/cloudinaryService';

// @desc    Update company profile
// @route   PUT /api/v1/settings/company
// @access  Private (Admin only recommended)
export const updateCompany = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const {
            businessName,
            legalName,
            gstin,
            pan,
            email,
            phone,
            website,
            address,
            bankDetails,
            branding,
            // P0-4: Classification fields (may be locked)
            businessType,
            city,
            state
        } = req.body;

        // P0-4: Check if classification fields are being changed and if they're locked
        if (businessType || city || state) {
            const currentCompany = await prisma.company.findUnique({
                where: { id: companyId },
                select: { classificationLockedAt: true, businessType: true, city: true, state: true }
            });

            if (currentCompany?.classificationLockedAt) {
                const lockTime = new Date(currentCompany.classificationLockedAt);
                const hoursSinceLock = (Date.now() - lockTime.getTime()) / (1000 * 60 * 60);

                if (hoursSinceLock > 24) {
                    // Check if any classification field is actually being changed
                    const isChangingClassification =
                        (businessType && businessType !== currentCompany.businessType) ||
                        (city && city !== currentCompany.city) ||
                        (state && state !== currentCompany.state);

                    if (isChangingClassification) {
                        return res.status(403).json({
                            success: false,
                            message: 'Business classification (type, city, state) cannot be changed after 24 hours. Contact support for assistance.'
                        });
                    }
                }
            }
        }

        // RISK MITIGATION: Check if GSTIN/PAN can be changed
        if (gstin || pan) {
            const currentCompany = await prisma.company.findUnique({
                where: { id: companyId },
                select: { gstin: true, pan: true }
            });

            const isGstinChanging = gstin && gstin !== currentCompany?.gstin;
            const isPanChanging = pan && pan !== currentCompany?.pan;

            if (isGstinChanging || isPanChanging) {
                // Check if any invoices exist
                const invoiceCount = await prisma.invoice.count({
                    where: { companyId }
                });

                if (invoiceCount > 0) {
                    logger.warn(`Attempt to change GSTIN/PAN after ${invoiceCount} invoices created`, {
                        companyId,
                        userId: req.user!.id,
                        attemptedGstin: gstin,
                        attemptedPan: pan
                    });

                    return res.status(403).json({
                        success: false,
                        message: 'GSTIN/PAN cannot be changed after invoices are created. This is locked to prevent historical data corruption. Please contact support for assistance.',
                        requiresApproval: true,
                        invoiceCount
                    });
                }
            }

            // Check for duplicate GSTIN if it's being changed
            if (gstin) {
                const existingCompany = await prisma.company.findFirst({
                    where: {
                        gstin,
                        id: { not: companyId }
                    }
                });

                if (existingCompany) {
                    return res.status(400).json({
                        success: false,
                        message: 'GSTIN already registered with another company'
                    });
                }
            }
        }

        const updateData: any = {
            businessName: businessName || undefined,
            legalName: legalName || undefined,
            gstin: gstin || undefined,
            pan: pan || undefined,
            email: email || undefined,
            phone: phone || undefined,
            logo: req.body.logo || undefined,
            enabledModules: req.body.enabledModules || undefined,
        };

        // P0-4: Only allow classification updates within 24 hours
        if (businessType) updateData.businessType = businessType;
        if (city) updateData.city = city;
        if (state) updateData.state = state;

        // Handle JSON fields carefully
        if (address) updateData.address = address;
        if (bankDetails) updateData.bankDetails = bankDetails;

        // Handle branding or other features if they are stored in features json or separate fields
        // Assuming features might store branding for now, or we can add it to features
        // But based on schema, branding is not a direct field. 
        // Let's check schema again? 
        // Schema has `logo`, `features`. 
        // We will store branding in `features` JSON for now if not present elsewhere, 
        // OR just ignore if not in schema. 
        // Re-checking schema from memory/logs: Company model has `logo`, `features`.
        // We can put branding colors and prefixes in `features`.

        // Let's fetch current features to merge
        if (branding) {
            const currentCompany = await prisma.company.findUnique({
                where: { id: companyId },
                select: { features: true }
            });

            const currentFeatures = currentCompany?.features as any || {};
            updateData.features = {
                ...currentFeatures,
                branding: {
                    ...currentFeatures.branding,
                    ...branding
                }
            };
        }

        const company = await prisma.company.update({
            where: { id: companyId },
            data: updateData
        });

        // Emit audit event for sensitive changes
        if (gstin || pan || bankDetails) {
            // TODO: Re-enable proper event emission when SETTINGS_CHANGED event type is defined
            logger.info('Company profile settings changed (audit event would fire here)', {
                type: 'COMPANY_PROFILE_UPDATED',
                userId: req.user!.id,
                companyId,
                gstin: gstin ? 'CHANGED' : undefined,
                pan: pan ? 'CHANGED' : undefined,
                bankDetails: bankDetails ? 'UPDATED' : undefined
            });
        }

        logger.info(`Company profile updated: ${company.businessName} (${company.id})`);

        return res.json({
            success: true,
            message: 'Company profile updated successfully',
            data: company
        });

    } catch (error: any) {
        logger.error('Update company error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating company profile',
            error: error.message
        });
    }
};

// @desc    Upload company logo to Cloudinary
// @route   POST /api/v1/settings/company/logo
// @access  Private (Admin)
export const uploadCompanyLogo = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        if (!isCloudinaryConfigured()) {
            return res.status(503).json({
                success: false,
                message: 'Image upload service is not configured. Please contact support.'
            });
        }

        const companyId = req.user!.companyId;

        // Upload to Cloudinary — use a stable public ID so re-uploading overwrites the old logo
        const { url } = await uploadToCloudinary(
            req.file.buffer,
            'bharatflows/logos',
            `company_logo_${companyId}`
        );

        // Persist the new logo URL in the database
        await prisma.company.update({
            where: { id: companyId },
            data: { logo: url }
        });

        logger.info(`Logo updated for company ${companyId}: ${url}`);

        return res.json({ success: true, message: 'Logo uploaded successfully', logoUrl: url });

    } catch (error: any) {
        logger.error('Logo upload error:', error);
        return res.status(500).json({ success: false, message: 'Error uploading logo', error: error.message });
    }
};

// @desc    Get company profile
// @route   GET /api/v1/settings/company
// @access  Private
export const getCompany = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;

        const company = await prisma.company.findUnique({
            where: { id: companyId }
        });

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // RISK MITIGATION: Mask sensitive bank details
        const maskedCompany = {
            ...company,
            bankDetails: company.bankDetails ? {
                ...(company.bankDetails as any),
                accountNumber: maskBankAccount((company.bankDetails as any)?.accountNumber),
                ifscCode: maskIFSC((company.bankDetails as any)?.ifscCode)
            } : null
        };

        return res.json({
            success: true,
            data: maskedCompany
        });

    } catch (error: any) {
        logger.error('Get company error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching company profile',
            error: error.message
        });
    }
};
