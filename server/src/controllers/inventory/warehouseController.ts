/**
 * Warehouse Controller
 * 
 * Handles warehouse CRUD operations.
 * Split from inventoryController.ts for better maintainability.
 */

import { Request, Response } from 'express';
import prisma from '../../config/prisma';

// Create Warehouse
export const createWarehouse = async (req: Request, res: Response) => {
    try {
        const {
            name,
            code,
            address,
            city,
            state,
            pincode,
            isDefault
        } = req.body;

        // @ts-ignore
        const companyId = req.user.companyId;

        const warehouse = await prisma.warehouse.create({
            data: {
                name,
                code,
                address,
                city,
                state,
                pincode,
                isDefault: isDefault || false,
                companyId
            }
        });

        res.status(201).json({
            success: true,
            data: warehouse
        });
    } catch (error: any) {
        console.error('Create warehouse error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating warehouse'
        });
    }
};

// Get All Warehouses
export const getWarehouses = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const companyId = req.user.companyId;

        const warehouses = await prisma.warehouse.findMany({
            where: {
                companyId,
                isActive: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json({
            success: true,
            data: warehouses
        });
    } catch (error: any) {
        console.error('Get warehouses error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching warehouses'
        });
    }
};

// Update Warehouse
export const updateWarehouse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const companyId = req.user.companyId;

        const warehouse = await prisma.warehouse.findFirst({
            where: { id, companyId }
        });

        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: 'Warehouse not found'
            });
        }

        const updatedWarehouse = await prisma.warehouse.update({
            where: { id },
            data: req.body
        });

        return res.json({
            success: true,
            data: updatedWarehouse
        });
    } catch (error: any) {
        console.error('Update warehouse error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error updating warehouse'
        });
    }
};

// Delete Warehouse (soft delete)
export const deleteWarehouse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const companyId = req.user.companyId;

        const warehouse = await prisma.warehouse.findFirst({
            where: { id, companyId }
        });

        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: 'Warehouse not found'
            });
        }

        await prisma.warehouse.update({
            where: { id },
            data: { isActive: false }
        });

        return res.json({
            success: true,
            message: 'Warehouse deleted successfully'
        });
    } catch (error: any) {
        console.error('Delete warehouse error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error deleting warehouse'
        });
    }
};
