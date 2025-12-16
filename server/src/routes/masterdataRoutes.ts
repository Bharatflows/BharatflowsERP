import express from 'express';
import { protect } from '../middleware/auth';
import {
    getUnits,
    createUnit,
    updateUnit,
    deleteUnit,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/masterdataController';

const router = express.Router();

router.use(protect);

// Units routes
router.route('/units')
    .get(getUnits)
    .post(createUnit);

router.route('/units/:id')
    .put(updateUnit)
    .delete(deleteUnit);

// Categories routes
router.route('/categories')
    .get(getCategories)
    .post(createCategory);

router.route('/categories/:id')
    .put(updateCategory)
    .delete(deleteCategory);

export default router;
