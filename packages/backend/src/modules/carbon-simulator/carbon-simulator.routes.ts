import asyncRouter from 'express-promise-router';
import { Request, Response, NextFunction } from 'express';
import { BuildingTypes } from '@shared/enums/audit-general.enum';
import { calculateCarbonFootprintSummary } from './helpers/carbon-footprint-summary.calculator';
import type { CarbonFootprintSummaryInput } from './helpers/carbon-footprint-summary.calculator';
import { mailService } from '@backend/common/mail/mail.service';
import { Logger } from '@backend/middlewares';

export const carbonSimulatorRoutes = asyncRouter();

/** Map sector key (e.g. OFFICE_ADMIN_BANK) to BuildingTypes value (label). Returns default if unknown so backend stays uncrashable. */
function sectorKeyToBuildingTypeLabel(key: string | undefined): string {
  if (!key) return BuildingTypes.OFFICE_ADMIN_BANK;
  const label = (BuildingTypes as Record<string, string>)[key];
  if (label !== undefined) return label;
  if (Object.values(BuildingTypes).includes(key as BuildingTypes)) return key;
  return BuildingTypes.OFFICE_ADMIN_BANK;
}

/**
 * Generate HTML email template for carbon footprint results
 */
function generateCarbonFootprintEmailHtml(
  result: ReturnType<typeof calculateCarbonFootprintSummary>,
  personal?: { fullName?: string; companyName?: string }
): string {
  const greeting = personal?.fullName
    ? `Bonjour ${personal.fullName},`
    : 'Bonjour,';
  const companyInfo = personal?.companyName
    ? ` pour ${personal.companyName}`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 28px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .metric:last-child { border-bottom: none; }
    .metric-label { font-weight: 600; color: #64748b; }
    .metric-value { font-weight: 700; color: #0f172a; font-size: 18px; }
    .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .cta { background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: 600; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌱 Votre Bilan Carbone</h1>
  </div>
  
  <p>${greeting}</p>
  <p>Voici le récapitulatif de votre bilan carbone${companyInfo} :</p>
  
  <div class="card">
    <h2 style="margin-top: 0; color: #0f172a;">Résumé des Émissions</h2>
    <div class="metric">
      <span class="metric-label">Émissions totales</span>
      <span class="metric-value">${result.co2TotalTonnes.toFixed(1)} tCO2e</span>
    </div>
    <div class="metric">
      <span class="metric-label">Scope 1 (Direct)</span>
      <span class="metric-value">${result.co2Scope1Tonnes.toFixed(1)} tCO2e (${Math.round((result.co2Scope1Tonnes / result.co2TotalTonnes) * 100)}%)</span>
    </div>
    <div class="metric">
      <span class="metric-label">Scope 2 (Électricité)</span>
      <span class="metric-value">${result.co2Scope2Tonnes.toFixed(1)} tCO2e (${Math.round((result.co2Scope2Tonnes / result.co2TotalTonnes) * 100)}%)</span>
    </div>
    <div class="metric">
      <span class="metric-label">Scope 3 (Indirect)</span>
      <span class="metric-value">${result.co2Scope3Tonnes.toFixed(1)} tCO2e (${Math.round((result.co2Scope3Tonnes / result.co2TotalTonnes) * 100)}%)</span>
    </div>
  </div>
  
  <div class="card" style="background: #ecfdf5; border-color: #86efac;">
    <h3 style="margin-top: 0; color: #166534;">💡 Recommandation</h3>
    <p>En Tunisie, l'électricité constitue l'un des principaux postes d'émissions de carbone pour les entreprises.</p>
    <p>La production d'électricité solaire photovoltaïque permet de réduire significativement ces émissions, tout en améliorant durablement la performance économique de l'entreprise.</p>
  </div>
  
  <center>
    <a href="https://joyaenergy.tn/contact" class="cta">Contactez-nous pour réduire vos émissions</a>
  </center>
  
  <div class="footer">
    <p>JOYA Energy - Solutions solaires pour entreprises</p>
    <p>Ce calcul est une estimation basée sur les informations fournies.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * POST /api/carbon-simulator/summary
 * Body: CarbonFootprintSummaryInput (electricity.buildingType can be sector key or label)
 * Returns: CarbonFootprintSummaryResult
 */
carbonSimulatorRoutes.post(
  '/summary',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as CarbonFootprintSummaryInput;
      const buildingTypeLabel = sectorKeyToBuildingTypeLabel(
        body.electricity?.buildingType
      ) as CarbonFootprintSummaryInput['electricity']['buildingType'];
      const electricity = {
        ...body.electricity,
        buildingType: buildingTypeLabel,
      };
      const thermal = {
        ...body.thermal,
        buildingType:
          buildingTypeLabel as CarbonFootprintSummaryInput['thermal']['buildingType'],
      };
      const cold = {
        ...body.cold,
        buildingType:
          buildingTypeLabel as CarbonFootprintSummaryInput['cold']['buildingType'],
      };
      const input: CarbonFootprintSummaryInput = {
        ...body,
        electricity,
        thermal,
        cold,
      };
      const result = calculateCarbonFootprintSummary(input);

      // Send email if personal info provided and email is valid
      if (body.personal?.email && mailService.isTransportAvailable()) {
        try {
          const emailHtml = generateCarbonFootprintEmailHtml(
            result,
            body.personal
          );
          const emailText = `Votre bilan carbone: ${result.co2TotalTonnes.toFixed(1)} tCO2e. Scope 1: ${result.co2Scope1Tonnes.toFixed(1)} tCO2e, Scope 2: ${result.co2Scope2Tonnes.toFixed(1)} tCO2e, Scope 3: ${result.co2Scope3Tonnes.toFixed(1)} tCO2e.`;

          await mailService.sendSimpleMail({
            to: body.personal.email,
            subject: '🌱 Votre Bilan Carbone - JOYA Energy',
            text: emailText,
            html: emailHtml,
          });

          Logger.info(`Carbon footprint email sent to ${body.personal.email}`);
        } catch (emailErr) {
          Logger.error('Failed to send carbon footprint email', emailErr);
          // Don't fail the request if email fails
        }
      }

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
