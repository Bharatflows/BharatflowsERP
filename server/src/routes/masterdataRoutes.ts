import express from 'express';
import {
    getBusinessCategories,
    getIndustries,
    getBusinessActivities,
    searchBusinessProducts,
    getBusinessCapabilities,
    seedMasterData,
    createCustomIndustry,
    createCustomProduct,
    getPopularProducts,
    getBusinessTypes
} from '../controllers/masterdataController';

const router = express.Router();

router.get('/categories', getBusinessCategories);
router.get('/industries', getIndustries);
router.post('/industries', createCustomIndustry);
router.get('/activities', getBusinessActivities);
router.get('/products', searchBusinessProducts);
router.get('/products/popular', getPopularProducts);
router.post('/products', createCustomProduct);
router.get('/capabilities', getBusinessCapabilities);
router.get('/business-types', getBusinessTypes);
router.post('/seed', seedMasterData);

export default router;
