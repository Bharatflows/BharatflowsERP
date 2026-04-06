"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const masterdataController_1 = require("../controllers/masterdataController");
const router = express_1.default.Router();
router.get('/categories', masterdataController_1.getBusinessCategories);
router.get('/industries', masterdataController_1.getIndustries);
router.post('/industries', masterdataController_1.createCustomIndustry);
router.get('/activities', masterdataController_1.getBusinessActivities);
router.get('/products', masterdataController_1.searchBusinessProducts);
router.get('/products/popular', masterdataController_1.getPopularProducts);
router.post('/products', masterdataController_1.createCustomProduct);
router.get('/capabilities', masterdataController_1.getBusinessCapabilities);
router.get('/business-types', masterdataController_1.getBusinessTypes);
router.post('/seed', masterdataController_1.seedMasterData);
exports.default = router;
//# sourceMappingURL=masterdataRoutes.js.map