import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// @desc    Get all expense categories with computed spent and count
// @route   GET /api/v1/expense-categories
// @access  Private
export const getCategories = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;

        // Get categories
        const categories = await prisma.expenseCategory.findMany({
            where: { companyId },
            orderBy: { name: 'asc' }
        });

        // For each category, compute spent and count from Expense table
        const categoriesWithStats = await Promise.all(
            categories.map(async (category) => {
                const stats = await prisma.expense.aggregate({
                    where: {
                        companyId,
                        category: category.name
                    },
                    _sum: { amount: true },
                    _count: true
                });

                return {
                    ...category,
                    budget: Number(category.budget),
                    spent: Number(stats._sum.amount || 0),
                    count: stats._count
                };
            })
        );

        res.json({
            success: true,
            count: categoriesWithStats.length,
            data: categoriesWithStats
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Create expense category
// @route   POST /api/v1/expense-categories
// @access  Private
export const createCategory = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const { name, description, budget, color } = req.body;

        if (!name) {
            res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
            return;
        }

        const category = await prisma.expenseCategory.create({
            data: {
                name,
                description,
                budget: budget ? Number(budget) : 0,
                color: color || '#6b7280',
                companyId: companyId!
            }
        });

        res.status(201).json({
            success: true,
            data: {
                ...category,
                budget: Number(category.budget),
                spent: 0,
                count: 0
            }
        });
    } catch (error: any) {
        console.error('Error creating category:', error);
        if (error.code === 'P2002') {
            res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Update expense category
// @route   PUT /api/v1/expense-categories/:id
// @access  Private
export const updateCategory = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const categoryId = req.params.id;
        const { name, description, budget, color } = req.body;

        const existing = await prisma.expenseCategory.findFirst({
            where: { id: categoryId, companyId }
        });

        if (!existing) {
            res.status(404).json({
                success: false,
                message: 'Category not found'
            });
            return;
        }

        const updated = await prisma.expenseCategory.update({
            where: { id: categoryId },
            data: {
                name: name || existing.name,
                description: description !== undefined ? description : existing.description,
                budget: budget !== undefined ? Number(budget) : existing.budget,
                color: color || existing.color
            }
        });

        res.json({
            success: true,
            data: {
                ...updated,
                budget: Number(updated.budget)
            }
        });
    } catch (error: any) {
        console.error('Error updating category:', error);
        if (error.code === 'P2002') {
            res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Delete expense category
// @route   DELETE /api/v1/expense-categories/:id
// @access  Private
export const deleteCategory = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const categoryId = req.params.id;

        const existing = await prisma.expenseCategory.findFirst({
            where: { id: categoryId, companyId }
        });

        if (!existing) {
            res.status(404).json({
                success: false,
                message: 'Category not found'
            });
            return;
        }

        await prisma.expenseCategory.delete({
            where: { id: categoryId }
        });

        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
