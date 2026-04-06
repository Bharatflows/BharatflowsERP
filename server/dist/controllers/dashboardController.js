"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = void 0;
const dashboardService_1 = require("../services/dashboardService");
exports.dashboardController = {
    async getCashFlow(req, res) {
        try {
            // Assuming user attached to req by middleware, otherwise defaults needed
            // const companyId = req.user?.companyId; 
            // For now, hardcode or fetch from query if multi-tenant logic isn't strictly enforced yet
            // But adhering to our previous patterns:
            const companyId = req.params.companyId || 'default-company-id'; // Fallback for MVP
            const data = await dashboardService_1.dashboardService.getCashFlow(companyId);
            res.json(data);
        }
        catch (error) {
            console.error('Error fetching cash flow:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async getTickerData(req, res) {
        try {
            const companyId = req.query.companyId || 'default-company-id';
            const data = await dashboardService_1.dashboardService.getTickerData(companyId);
            res.json(data);
        }
        catch (error) {
            console.error('Error fetching ticker data:', error);
            res.status(500).json({ error: error.message });
        }
    }
};
//# sourceMappingURL=dashboardController.js.map