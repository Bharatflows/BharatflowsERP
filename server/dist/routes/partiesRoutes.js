"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const partiesController_1 = require("../controllers/partiesController");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.route('/')
    .get(partiesController_1.getParties)
    .post(partiesController_1.createParty);
router.post('/verify-business', partiesController_1.verifyBusiness);
router.route('/:id')
    .get(partiesController_1.getParty)
    .put(partiesController_1.updateParty)
    .delete(partiesController_1.deleteParty);
router.get('/:id/trust-score', partiesController_1.getTrustScore);
exports.default = router;
//# sourceMappingURL=partiesRoutes.js.map