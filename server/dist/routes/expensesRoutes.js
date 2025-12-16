"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const expensesController_1 = require("../controllers/expensesController");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.route('/')
    .get(expensesController_1.getExpenses)
    .post(expensesController_1.createExpense);
router.route('/:id')
    .get(expensesController_1.getExpense)
    .put(expensesController_1.updateExpense)
    .delete(expensesController_1.deleteExpense);
router.post('/:id/approve', expensesController_1.approveExpense);
exports.default = router;
//# sourceMappingURL=expensesRoutes.js.map