import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validation result handler
export const validate = (req: Request, res: Response, next: NextFunction): void | Response => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
  return;
};

// User validation
// User validation
export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid phone number format (10 digits starting with 6-9)'),
  body('gstin')
    .optional({ checkFalsy: true })
    .trim()
    .toUpperCase()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Invalid GSTIN format'),
  validate
];

export const loginValidation = [
  body('email').notEmpty().withMessage('Email or Phone is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

// Invoice validation
export const invoiceValidation = [
  body('customerId').notEmpty().withMessage('Customer is required'),
  body('invoiceDate').isISO8601().withMessage('Valid date is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').notEmpty().withMessage('Product is required'),
  body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Valid quantity is required'),
  body('items.*.rate').isFloat({ min: 0 }).withMessage('Valid rate is required'),
  validate
];

// Product validation
export const productValidation = [
  body('productName').trim().notEmpty().withMessage('Product name is required'),
  body('hsnCode').optional().matches(/^\d{4,8}$/).withMessage('Valid HSN code required'),
  body('unit').isIn(['pcs', 'kg', 'ltr', 'mtr', 'box']).withMessage('Valid unit required'),
  body('pricing.sellingPrice').isFloat({ min: 0 }).withMessage('Valid selling price required'),
  validate
];

// Party validation
export const partyValidation = [
  body('partyName').trim().notEmpty().withMessage('Party name is required'),
  body('partyType').isIn(['customer', 'supplier', 'both']).withMessage('Valid party type required'),
  body('gstin')
    .optional({ checkFalsy: true })
    .trim()
    .toUpperCase()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Valid GSTIN required'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Valid phone number required'),
  validate
];

// Expense validation
export const expenseValidation = [
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
  body('expenseDate').isISO8601().withMessage('Valid date is required'),
  validate
];

// Employee validation
export const employeeValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid phone number is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('designation').notEmpty().withMessage('Designation is required'),
  validate
];

// GSTIN validation
export const gstinValidation = (gstin: string): boolean => {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin.trim().toUpperCase());
};

// PAN validation
export const panValidation = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.trim().toUpperCase());
};

// Phone validation
export const phoneValidation = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};
