"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const masterdataController_1 = require("../controllers/masterdataController");
const router = express_1.default.Router();
router.use(auth_1.protect);
// Units routes
router.route('/units')
    .get(masterdataController_1.getUnits)
    .post(masterdataController_1.createUnit);
router.route('/units/:id')
    .put(masterdataController_1.updateUnit)
    .delete(masterdataController_1.deleteUnit);
// Categories routes
router.route('/categories')
    .get(masterdataController_1.getCategories)
    .post(masterdataController_1.createCategory);
router.route('/categories/:id')
    .put(masterdataController_1.updateCategory)
    .delete(masterdataController_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=masterdataRoutes.js.map