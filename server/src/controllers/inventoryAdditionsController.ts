import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

// ==================== UNIT CONVERSION ====================

export const getUnitConversions = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const conversions = await prisma.unitConversion.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: conversions });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createUnitConversion = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { fromUnit, toUnit, conversionFactor, productId, description } = req.body;

        const conversion = await prisma.unitConversion.create({
            data: {
                fromUnit,
                toUnit,
                conversionFactor,
                productId,
                description,
                companyId
            }
        });
        res.status(201).json({ success: true, data: conversion });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteUnitConversion = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user!.companyId;
        await prisma.unitConversion.delete({
            where: { id, companyId }
        });
        res.json({ success: true, message: 'Unit conversion deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== SERIAL TRACKING ====================

export const getSerialNumbers = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { productId, status } = req.query;

        const where: any = { companyId };
        if (productId) where.productId = productId as string;
        if (status) where.status = status as string;

        const serials = await prisma.serialNumber.findMany({
            where,
            include: {
                product: { select: { name: true, code: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json({ success: true, data: serials });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSerialNumber = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user!.companyId;
        const serial = await prisma.serialNumber.update({
            where: { id, companyId },
            data: req.body
        });
        res.json({ success: true, data: serial });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
