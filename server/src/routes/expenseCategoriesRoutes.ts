import express from 'express';
import { protect } from '../middleware/auth';
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/expenseCategoriesController';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getCategories)
    .post(createCategory);

router.route('/:id')
    .put(updateCategory)
    .delete(deleteCategory);

export default router;
