/**
 * Financing Comparison Controller
 * Handles HTTP requests for financing comparisons
 */

import { Request, Response, NextFunction } from 'express';
import { ComparisonService } from '@backend/modules/financing-comparison/services';
import { ComparisonRequestDto } from '../dto';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { HTTP400Error, HTTP404Error, HTTP500Error } from '@backend/errors/http.error';
import { InvalidInputError, CalculationError, InvalidLocationError } from '@backend/domain/financing';

export class ComparisonController {
  private comparisonService: ComparisonService;

  constructor() {
    this.comparisonService = new ComparisonService();
  }

  /**
   * POST /api/financing-comparisons
   * Creates a new financing comparison
   */
  public createComparison = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const requestDto: ComparisonRequestDto = req.body;

      Logger.info('Creating financing comparison', {
        location: requestDto.location,
        hasSize: !!requestDto.installationSizeKwp,
        hasAmount: !!requestDto.investmentAmountDt,
      });

      const result = this.comparisonService.compareAllSolutions(
        {
          location: requestDto.location,
          installationSizeKwp: requestDto.installationSizeKwp,
          investmentAmountDt: requestDto.investmentAmountDt,
        },
        requestDto.creditParams,
        requestDto.leasingParams,
        requestDto.escoParams
      );

      Logger.info('Financing comparison created successfully', {
        capex: result.projectCalculation.capexDt,
        size: result.projectCalculation.sizeKwp,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, next);
    }
  };

  /**
   * GET /api/financing-comparisons/advantages
   * Returns advantages/disadvantages for all solutions
   */
  public getAdvantages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { SOLUTION_ADVANTAGES } = await import('@backend/domain/financing');

      res.status(200).json({
        success: true,
        data: SOLUTION_ADVANTAGES,
      });
    } catch (error) {
      this.handleError(error, next);
    }
  };

  /**
   * GET /api/financing-comparisons/locations
   * Returns available locations with their yields
   */
  public getLocations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { LOCATION_YIELDS } = await import('@backend/domain/financing');

      const locations = Object.entries(LOCATION_YIELDS)
        .filter(([key]) => key !== 'default')
        .map(([location, yield_kwh]) => ({
          location,
          yieldKwhPerKwpYear: yield_kwh,
        }));

      res.status(200).json({
        success: true,
        data: locations,
      });
    } catch (error) {
      this.handleError(error, next);
    }
  };

  /**
   * Error handler
   */
  private handleError(error: unknown, next: NextFunction): void {
    if (error instanceof InvalidInputError) {
      Logger.warn('Invalid input for financing comparison', { error });
      next(new HTTP400Error(error.message));
    } else if (error instanceof InvalidLocationError) {
      Logger.warn('Invalid location for financing comparison', { error });
      next(new HTTP400Error(error.message));
    } else if (error instanceof CalculationError) {
      Logger.error('Calculation error in financing comparison', { error });
      next(new HTTP400Error(error.message));
    } else if (error instanceof Error) {
      Logger.error('Unexpected error in financing comparison', { error });
      next(new HTTP500Error(error.message));
    } else {
      Logger.error('Unknown error in financing comparison', { error });
      next(new HTTP500Error('An unexpected error occurred'));
    }
  }
}

export const comparisonController = new ComparisonController();

