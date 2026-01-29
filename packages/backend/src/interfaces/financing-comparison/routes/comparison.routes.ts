/**
 * Financing Comparison Routes
 */

import { Router } from 'express';
import { comparisonController } from '../controllers';

const router = Router();

/**
 * @route   POST /api/financing-comparisons
 * @desc    Create a new financing comparison
 * @access  Public
 */
router.post('/', comparisonController.createComparison);

/**
 * @route   GET /api/financing-comparisons/advantages
 * @desc    Get advantages/disadvantages for all solutions
 * @access  Public
 */
router.get('/advantages', comparisonController.getAdvantages);

/**
 * @route   GET /api/financing-comparisons/locations
 * @desc    Get available locations with yields
 * @access  Public
 */
router.get('/locations', comparisonController.getLocations);

export default router;

