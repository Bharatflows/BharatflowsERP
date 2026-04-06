"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.phoneValidation = exports.panValidation = exports.gstinValidation = exports.employeeValidation = exports.expenseValidation = exports.partyValidation = exports.productValidation = exports.invoiceValidation = exports.loginValidation = exports.registerValidation = exports.validate = void 0;
const express_validator_1 = require("express-validator");
// Validation result handler
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
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
exports.validate = validate;
// User validation
// User validation
exports.registerValidation = [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Invalid email format'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    (0, express_validator_1.body)('phone')
        .optional({ checkFalsy: true })
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Invalid phone number format (10 digits starting with 6-9)'),
    (0, express_validator_1.body)('gstin')
        .optional({ checkFalsy: true })
        .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
        .withMessage('Invalid GSTIN format'),
    exports.validate
];
exports.loginValidation = [
    (0, express_validator_1.body)('email').notEmpty().withMessage('Email or Phone is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
    exports.validate
];
// Invoice validation
exports.invoiceValidation = [
    (0, express_validator_1.body)('customerId').notEmpty().withMessage('Customer is required'),
    (0, express_validator_1.body)('invoiceDate').isISO8601().withMessage('Valid date is required'),
    (0, express_validator_1.body)('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    (0, express_validator_1.body)('items.*.productId').notEmpty().withMessage('Product is required'),
    (0, express_validator_1.body)('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Valid quantity is required'),
    (0, express_validator_1.body)('items.*.rate').isFloat({ min: 0 }).withMessage('Valid rate is required'),
    exports.validate
];
// Product validation
exports.productValidation = [
    (0, express_validator_1.body)('productName').trim().notEmpty().withMessage('Product name is required'),
    (0, express_validator_1.body)('hsnCode').optional().matches(/^\d{4,8}$/).withMessage('Valid HSN code required'),
    (0, express_validator_1.body)('unit').isIn(['pcs', 'kg', 'ltr', 'mtr', 'box']).withMessage('Valid unit required'),
    (0, express_validator_1.body)('pricing.sellingPrice').isFloat({ min: 0 }).withMessage('Valid selling price required'),
    exports.validate
];
// Party validation
exports.partyValidation = [
    (0, express_validator_1.body)('partyName').trim().notEmpty().withMessage('Party name is required'),
    (0, express_validator_1.body)('partyType').isIn(['customer', 'supplier', 'both']).withMessage('Valid party type required'),
    (0, express_validator_1.body)('gstin')
        .optional()
        .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
        .withMessage('Valid GSTIN required'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('phone')
        .optional()
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Valid phone number required'),
    exports.validate
];
// Expense validation
exports.expenseValidation = [
    (0, express_validator_1.body)('category').trim().notEmpty().withMessage('Category is required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
    (0, express_validator_1.body)('expenseDate').isISO8601().withMessage('Valid date is required'),
    exports.validate
];
// Employee validation
exports.employeeValidation = [
    (0, express_validator_1.body)('firstName').trim().notEmpty().withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').trim().notEmpty().withMessage('Last name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid phone number is required'),
    (0, express_validator_1.body)('department').notEmpty().withMessage('Department is required'),
    (0, express_validator_1.body)('designation').notEmpty().withMessage('Designation is required'),
    exports.validate
];
// GSTIN validation
const gstinValidation = (gstin) => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
};
exports.gstinValidation = gstinValidation;
// PAN validation
const panValidation = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
};
exports.panValidation = panValidation;
// Phone validation
const phoneValidation = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
};
exports.phoneValidation = phoneValidation;
//# sourceMappingURL=validator.js.map