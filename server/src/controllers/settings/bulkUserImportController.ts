/**
 * Bulk User Import Controller
 * 
 * Handles bulk user import from CSV files.
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

interface UserImportRow {
    email: string;
    name: string;
    phone?: string;
    role?: string;
    department?: string;
}

interface ImportResult {
    imported: number;
    failed: number;
    errors: { row: number; email: string; error: string }[];
    users: { id: string; email: string; name: string }[];
}

/**
 * Parse CSV content to user rows
 */
function parseCSV(content: string): UserImportRow[] {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const emailIndex = headers.indexOf('email');
    const nameIndex = headers.indexOf('name');
    const phoneIndex = headers.indexOf('phone');
    const roleIndex = headers.indexOf('role');
    const deptIndex = headers.indexOf('department');

    if (emailIndex === -1 || nameIndex === -1) {
        throw new Error('CSV must have "email" and "name" columns');
    }

    const rows: UserImportRow[] = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if (values[emailIndex]) {
            rows.push({
                email: values[emailIndex],
                name: values[nameIndex] || '',
                phone: phoneIndex !== -1 ? values[phoneIndex] : undefined,
                role: roleIndex !== -1 ? values[roleIndex] : 'STAFF',
                department: deptIndex !== -1 ? values[deptIndex] : undefined,
            });
        }
    }
    return rows;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Normalize role string to valid Role enum value
 */
function normalizeRole(role?: string): 'OWNER' | 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'STAFF' | 'AUDITOR' {
    const upperRole = (role || 'STAFF').toUpperCase();
    const validRoles = ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'STAFF', 'AUDITOR'];
    return validRoles.includes(upperRole) ? upperRole as any : 'STAFF';
}

/**
 * POST /api/v1/settings/users/bulk-import
 * 
 * Import users from CSV data
 */
export const bulkImportUsers = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;
        const { csvContent, sendInvites = false } = req.body;

        if (!csvContent) {
            return res.status(400).json({
                success: false,
                message: 'CSV content is required',
            });
        }

        // Parse CSV
        let users: UserImportRow[];
        try {
            users = parseCSV(csvContent);
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid users found in CSV',
            });
        }

        const result: ImportResult = {
            imported: 0,
            failed: 0,
            errors: [],
            users: [],
        };

        // Process each user
        for (let i = 0; i < users.length; i++) {
            const row = users[i];
            const rowNum = i + 2; // Account for header row and 0-indexing

            // Validate email
            if (!isValidEmail(row.email)) {
                result.failed++;
                result.errors.push({ row: rowNum, email: row.email, error: 'Invalid email format' });
                continue;
            }

            // Check if user already exists
            const existing = await prisma.user.findUnique({
                where: { email: row.email.toLowerCase() },
            });

            if (existing) {
                result.failed++;
                result.errors.push({ row: rowNum, email: row.email, error: 'User already exists' });
                continue;
            }

            try {
                // Generate temporary password
                const tempPassword = uuidv4().substring(0, 8);
                const hashedPassword = await bcrypt.hash(tempPassword, 10);

                // Create user
                const user = await prisma.user.create({
                    data: {
                        email: row.email.toLowerCase(),
                        name: row.name,
                        phone: row.phone || null,
                        password: hashedPassword,
                        role: normalizeRole(row.role),
                        companyId,
                        status: sendInvites ? 'INACTIVE' : 'ACTIVE',
                    },
                });

                result.imported++;
                result.users.push({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                });

                // TODO: Send invite email if sendInvites is true
                // await emailService.sendUserInvite(user.email, tempPassword);

            } catch (error: any) {
                result.failed++;
                result.errors.push({
                    row: rowNum,
                    email: row.email,
                    error: error.message || 'Failed to create user'
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: `Imported ${result.imported} users, ${result.failed} failed`,
            data: result,
        });
    } catch (error: any) {
        console.error('Error in bulk user import:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to import users',
            error: error.message,
        });
    }
};

/**
 * GET /api/v1/settings/users/import-template
 * 
 * Download CSV template for user import
 */
export const getImportTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const template = 'email,name,phone,role,department\njohn@example.com,John Doe,9876543210,STAFF,Sales\njane@example.com,Jane Smith,9876543211,MANAGER,Finance';

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=user-import-template.csv');
        return res.send(template);
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Failed to generate template',
        });
    }
};
