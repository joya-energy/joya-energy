/**
 * Financing Comparison Controller
 * Handles HTTP requests for financing comparisons
 */

import { Request, Response, NextFunction } from 'express';
import { ComparisonService } from '@backend/modules/financing-comparison/services';
import { validateComparisonRequest } from '../validators';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { HTTP400Error, HTTP500Error } from '@backend/errors/http.error';
import {
  InvalidInputError,
  CalculationError,
  InvalidLocationError,
} from '@backend/domain/financing';
import { Governorates } from '@shared/enums/audit-general.enum';
import { mailService } from '@backend/common/mail/mail.service';
import type { CreateComparisonResult } from '@backend/domain/financing';
import { LeadCollectorService } from '@backend/modules/lead/lead-collector.service';

function formatDt(value: number): string {
  return (
    new Intl.NumberFormat('fr-TN', { maximumFractionDigits: 0 }).format(value) +
    ' DT'
  );
}

function buildComparisonEmailHtml(
  fullName: string,
  companyName: string,
  result: CreateComparisonResult
): string {
  const pc = result.projectCalculation;
  const solutions = [
    { name: 'Comptant', ...result.cash },
    { name: 'Crédit bancaire', ...result.credit },
    { name: 'Leasing', ...result.leasing },
    { name: 'ESCO JOYA', ...result.esco },
  ];
  const rows = solutions
    .map(
      (s) =>
        `<tr>
          <td>${s.name}</td>
          <td>${formatDt(s.initialInvestment)}</td>
          <td>${formatDt(s.monthlyPayment)}</td>
          <td>${formatDt(s.totalMonthlyCost)}</td>
          <td>${formatDt(s.monthlyCashflow)}</td>
        </tr>`
    )
    .join('');
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Comparaison financements JOYA</title></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #0d9488;">Votre comparaison des financements JOYA</h2>
  ${fullName ? `<p>Bonjour ${fullName},</p>` : '<p>Bonjour,</p>'}
  ${companyName ? `<p>Voici le récapitulatif de votre comparaison pour <strong>${companyName}</strong>.</p>` : ''}
  <h3>Résumé du projet</h3>
  <ul>
    <li><strong>Localisation :</strong> ${result.input.location}</li>
    <li><strong>Taille installation :</strong> ${pc.sizeKwp.toFixed(1)} kWp</li>
    <li><strong>Investissement total :</strong> ${formatDt(pc.capexDt)}</li>
    <li><strong>Production annuelle :</strong> ${pc.annualProductionKwh.toFixed(0)} kWh</li>
    <li><strong>Économies mensuelles :</strong> ${formatDt(pc.monthlyGrossSavingsDt)}</li>
  </ul>
  <h3>Solutions comparées (7 ans)</h3>
  <table style="width:100%; border-collapse: collapse;">
    <thead>
      <tr style="background: #f1f5f9;">
        <th style="text-align:left; padding: 8px;">Solution</th>
        <th style="text-align:right; padding: 8px;">Invest. initial</th>
        <th style="text-align:right; padding: 8px;">Mensualité</th>
        <th style="text-align:right; padding: 8px;">Coût mensuel total</th>
        <th style="text-align:right; padding: 8px;">Cashflow mensuel</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="margin-top: 24px; color: #64748b;">Ce document a été généré par le simulateur JOYA. Pour toute question, contactez-nous.</p>
</body>
</html>`;
}

async function sendComparisonEmail(
  email: string,
  fullName: string,
  companyName: string,
  result: CreateComparisonResult
): Promise<void> {
  const subject = 'Votre comparaison des financements JOYA';
  const html = buildComparisonEmailHtml(fullName, companyName, result);
  const text = `Comparaison des financements JOYA - ${result.input.location} - ${result.projectCalculation.sizeKwp} kWp. Consultez le détail dans l'email HTML.`;
  Logger.info(`📧 Sending comparison results to ${email}...`);
  await mailService.sendSimpleMail({ to: email, subject, text, html });
  Logger.info(`✅ Comparison email sent to ${email}`);
}

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
      const validatedData = validateComparisonRequest(req.body);

      Logger.info('Creating financing comparison', {
        location: validatedData.location,
        hasSize: !!validatedData.installationSizeKwp,
        hasAmount: !!validatedData.investmentAmountDt,
      });

      const result = await this.comparisonService.compareAllSolutions(
        {
          location: validatedData.location,
          installationSizeKwp: validatedData.installationSizeKwp,
          investmentAmountDt: validatedData.investmentAmountDt,
        },
        validatedData.creditParams,
        validatedData.leasingParams,
        validatedData.escoParams
      );

      Logger.info('Financing comparison created successfully', {
        capex: result.projectCalculation.capexDt,
        size: result.projectCalculation.sizeKwp,
      });

      if (validatedData.email && mailService.isTransportAvailable()) {
        setImmediate(() => {
          sendComparisonEmail(
            validatedData.email!,
            validatedData.fullName ?? '',
            validatedData.companyName ?? '',
            result
          ).catch((err) => {
            Logger.error(
              `❌ Failed to send comparison email to ${validatedData.email}: ${(err as Error).message}`
            );
          });
        });
      } else if (validatedData.email) {
        Logger.info(
          'ℹ️ Email not sent (comparison): email transport not configured.'
        );
      }

      // Collect lead asynchronously (non-blocking)
      if (validatedData.email) {
        LeadCollectorService.collectLead({
          email: validatedData.email,
          phoneNumber: validatedData.phoneNumber ?? '',
          name: validatedData.fullName,
          companyName: validatedData.companyName,
          source: 'financing-comparison',
        }).catch(() => {
          // Silently ignored - lead collection never fails the main operation
        });
      }

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
    _req: Request,
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
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { getLocationYields } = await import('@backend/domain/financing');
      const locationYields = await getLocationYields();

      const locations = Object.entries(locationYields).map(
        ([location, yieldKwhPerKwpYear]) => ({
          location: location as Governorates,
          yieldKwhPerKwpYear,
        })
      );

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
