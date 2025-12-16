"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const hrController_1 = require("../controllers/hrController");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.route('/employees')
    .get(hrController_1.getEmployees)
    .post(hrController_1.createEmployee);
router.route('/employees/:id')
    .get(hrController_1.getEmployee)
    .put(hrController_1.updateEmployee)
    .delete(hrController_1.deleteEmployee);
exports.default = router;
//# sourceMappingURL=hrRoutes.js.map