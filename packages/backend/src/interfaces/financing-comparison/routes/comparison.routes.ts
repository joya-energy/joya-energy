/**
 * Financing Comparison Routes
 */

import { Router } from 'express';
import { comparisonController } from '../controllers';
import { validateRequest } from '@backend/middlewares/validation.middleware';
import { comparisonRequestSchema } from '../validators';

const router = Router();

/**
 * @route   POST /api/financing-comparisons
 * @desc    Create a new financing comparison
 * @access  Public
 */
router.post(
  '/',
  validateRequest(comparisonRequestSchema),
  comparisonController.createComparison
);

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

