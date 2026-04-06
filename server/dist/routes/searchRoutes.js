"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const searchController_1 = require("../controllers/searchController");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.get('/global', searchController_1.globalSearch);
exports.default = router;
//# sourceMappingURL=searchRoutes.js.map