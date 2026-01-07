import { Request, Response } from 'express';
import { AuditPDFService } from '../audit-energetique/pdf.service';
import { mailService, MailAttachment } from '../../common/mail/mail.service';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { HTTP400Error } from '@backend/errors/http.error';
import { AuditEnergetiqueSimulation } from '../../models/audit-energetique/audit-energetique-simulation.model';
import { AuditSolaireSimulationModel } from '../../models/audit-solaire/audit-solaire-simulation.model';
import { toAuditEnergetiqueResponseDto } from '../audit-energetique/dto/audit-energetique-response.dto';
import { toAuditSolaireResponseDto } from '../audit-solaire/dto/audit-solaire-response.dto';
import type { AuditSolaireResponseDto } from '../audit-solaire/dto/audit-solaire-response.dto';
import type { AuditEnergetiqueResponseDto } from '../audit-energetique/dto/audit-energetique-response.dto';
import { getFileService } from '../file/file.service.factory';

export class PVReportController {
  private pdfService = new AuditPDFService(getFileService());

  /**
   * Resolve simulation IDs from request body
   * Supports both new format (solaireId/energetiqueId) and legacy (simulationId)
   */
  private async resolveSimulationIds(
    solaireId?: string,
    energetiqueId?: string,
    simulationId?: string
  ): Promise<{ solaireId?: string; energetiqueId?: string }> {
    let finalSolaireId = solaireId;
    let finalEnergetiqueId = energetiqueId;

    if (simulationId && !finalSolaireId && !finalEnergetiqueId) {
      const solaireSim = await AuditSolaireSimulationModel.findById(simulationId);
      if (solaireSim) {
        finalSolaireId = simulationId;
        Logger.info(`📋 Using legacy simulationId as solaireId: ${simulationId}`);
      } else {
        finalEnergetiqueId = simulationId;
        Logger.info(`📋 Using legacy simulationId as energetiqueId: ${simulationId}`);
      }
    }

    if (!finalSolaireId && !finalEnergetiqueId) {
      throw new HTTP400Error(
        'Either solaireId or energetiqueId (or legacy simulationId) is required'
      );
    }

    return { solaireId: finalSolaireId, energetiqueId: finalEnergetiqueId };
  }

  /**
   * Build PV PDF from simulation IDs
   * Supports:
   * - solaireId only: Uses Audit Solaire data (complete PV calculations)
   * - energetiqueId only: Uses Audit Energetique data (basic data, PV = 0)
   * - Both: Combines data for complete report
   */
  private async buildPvPdf(
    solaireId?: string,
    energetiqueId?: string
  ): Promise<Buffer> {
    Logger.info(`🔄 buildPvPdf called: solaireId=${solaireId}, energetiqueId=${energetiqueId}`);
    let solaireDto: AuditSolaireResponseDto | null = null;
    let energetiqueDto: AuditEnergetiqueResponseDto | null = null;

    // Fetch Audit Solaire data if provided
    if (solaireId) {
      Logger.info(`🔍 Fetching Audit Solaire simulation: ${solaireId}`);
      const solaireSimulation = await AuditSolaireSimulationModel.findById(solaireId);
      if (!solaireSimulation) {
        throw new Error(`Audit Solaire simulation not found: ${solaireId}`);
      }
      
      // Validate that required financial metrics are present
      const missingMetrics: string[] = [];
      if (solaireSimulation.npv === null || solaireSimulation.npv === undefined) {
        missingMetrics.push('NPV');
      }
      if (solaireSimulation.irr === null || solaireSimulation.irr === undefined) {
        missingMetrics.push('IRR');
      }
      if (solaireSimulation.roi25Years === null || solaireSimulation.roi25Years === undefined) {
        missingMetrics.push('ROI');
      }
      if (solaireSimulation.simplePaybackYears === null || solaireSimulation.simplePaybackYears === undefined) {
        missingMetrics.push('Simple Payback');
      }
      if (solaireSimulation.discountedPaybackYears === null || solaireSimulation.discountedPaybackYears === undefined) {
        missingMetrics.push('Discounted Payback');
      }
      
      if (missingMetrics.length > 0) {
        const errorMessage = 
          `Cannot generate PV report: The solar audit simulation (ID: ${solaireId}) is missing required financial metrics: ${missingMetrics.join(', ')}. ` +
          `This appears to be an old record or the economic analysis was not completed. ` +
          `Record created: ${solaireSimulation.createdAt}, ` +
          `Has annualEconomics: ${solaireSimulation.annualEconomics?.length ?? 0} years. ` +
          `Solution: Please recreate the solar audit simulation to generate proper financial metrics.`;
        Logger.error(`❌ ${errorMessage}`);
        throw new HTTP400Error(errorMessage);
      }
      
      solaireDto = toAuditSolaireResponseDto(solaireSimulation);
      Logger.info(`✅ Loaded Audit Solaire simulation: ${solaireId}`);
    }

    // Fetch Audit Energetique data if provided
    if (energetiqueId) {
      Logger.info(`🔍 Fetching Audit Energetique simulation: ${energetiqueId}`);
      const energetiqueSimulation = await AuditEnergetiqueSimulation.findById(energetiqueId);
      if (!energetiqueSimulation) {
        throw new Error(`Audit Energetique simulation not found: ${energetiqueId}`);
      }
      energetiqueDto = toAuditEnergetiqueResponseDto(energetiqueSimulation);
      Logger.info(`✅ Loaded Audit Energetique simulation: ${energetiqueId}`);
    }

    // Prefer Audit Solaire data (has complete PV calculations)
    // Fallback to Audit Energetique if no Solaire data
    const dto = solaireDto ?? energetiqueDto;
    
    if (!dto) {
      throw new Error('Either solaireId or energetiqueId must be provided');
    }

    // Pass both DTOs explicitly so PDF service can combine them
    Logger.info(`🔄 Calling PDF service.generatePDF with template='pv'`);
    const pdfBuffer = await this.pdfService.generatePDF(dto, 'pv', solaireDto, energetiqueDto);
    Logger.info(`✅ PDF service returned buffer (${pdfBuffer.length} bytes)`);
    return pdfBuffer;
  }

  // 🔹 ASYNC / BACKGROUND
  async sendPVReport(req: Request, res: Response) {
    try {
      Logger.info(`📋 PV PDF generation request received: solaireId=${req.body.solaireId}, energetiqueId=${req.body.energetiqueId}, simulationId=${req.body.simulationId}`);
      const { solaireId, energetiqueId, simulationId } = req.body;
      const ids = await this.resolveSimulationIds(solaireId, energetiqueId, simulationId);
      Logger.info(`📋 Resolved IDs: solaireId=${ids.solaireId}, energetiqueId=${ids.energetiqueId}`);
      
      const finalSolaireId = ids.solaireId;
      const finalEnergetiqueId = ids.energetiqueId;

      // Load simulations to extract contact info (prefer energetique for contact data)
      let contactInfo: { fullName: string; email: string; company: string } | null = null;

      if (finalEnergetiqueId) {
        Logger.info(`🔍 Fetching Audit Energetique simulation for contact info: ${finalEnergetiqueId}`);
        try {
          const energetiqueSimulation = await AuditEnergetiqueSimulation.findById(finalEnergetiqueId);
          if (!energetiqueSimulation) {
            Logger.error(`❌ Audit Energetique simulation not found: ${finalEnergetiqueId}`);
            return res.status(404).json({ error: `Audit Energetique simulation not found: ${finalEnergetiqueId}` });
          }
          Logger.info(`✅ Audit Energetique simulation found, extracting contact info...`);
          const energetiqueDto = toAuditEnergetiqueResponseDto(energetiqueSimulation);
          contactInfo = {
            fullName: energetiqueDto.data.contact.fullName ?? '',
            email: energetiqueDto.data.contact.email ?? '',
            company: energetiqueDto.data.contact.companyName ?? '',
          };
          Logger.info(`✅ Contact info extracted: email=${contactInfo.email}, company=${contactInfo.company}`);
        } catch (error) {
          Logger.error(`❌ Error fetching Audit Energetique simulation: ${(error as Error).message}`);
          throw error;
        }
      } else if (finalSolaireId) {
        // If only solaire, try to get contact from somewhere else or use defaults
        // For now, we'll use generic values
        contactInfo = {
          fullName: 'Client',
          email: '', // Will need to be provided separately
          company: 'Client',
        };
        Logger.warn(`⚠️ No energetiqueId provided - contact info may be incomplete`);
      }

      if (!contactInfo || !contactInfo.email) {
        return res.status(400).json({ 
          error: 'Email address is required. Provide energetiqueId to get contact info automatically.' 
        });
      }

      // Ensure Postmark is configured (PV reports require Postmark as requested)
      if (!mailService.isPostmarkConfigured()) {
        Logger.warn(`Postmark not configured — cannot send PV report`);
        return res.status(500).json({ error: 'Postmark is not configured. Set POSTMARK_SERVER_TOKEN to enable sending PV reports.' });
      }

      // Also ensure some transport is available
      if (!mailService.isTransportAvailable()) {
        Logger.warn(`Email transport is not available — cannot send PV report`);
        return res.status(500).json({ error: 'Email transport is not available or misconfigured.' });
      }

      // Generate PDF buffer
      Logger.info(`🔄 Starting PDF generation...`);
      const pdfBuffer = await this.buildPvPdf(finalSolaireId, finalEnergetiqueId);
      Logger.info(`✅ PDF generated successfully (${pdfBuffer.length} bytes)`);

      // Attachment
      const attachment: MailAttachment = {
        Name: `PVReport-${contactInfo.company.replace(/\s+/g, '_')}.pdf`,
        Content: pdfBuffer.toString('base64'),
        ContentType: 'application/pdf',
        ContentID: '',
      };

      // Template id can be configured through env; fallback to audit template if missing
      const templateId = Number(process.env.POSTMARK_PV_TEMPLATE_ID);

      // Send email
      Logger.info(`📧 Sending PV report to ${contactInfo.email}...`);

      await mailService.sendMail({
        to: contactInfo.email,
        subject: 'Votre rapport photovoltaïque JOYA',
        text: 'Veuillez trouver votre rapport photovoltaïque en pièce jointe.',
        html: '<p>Veuillez trouver votre rapport photovoltaïque en pièce jointe.</p>',
        templateId,
        templateModel: {
          fullName: contactInfo.fullName,
          company: contactInfo.company,
        },
        attachments: [attachment],
      });

      Logger.info(`✅ PV PDF sent to ${contactInfo.email}`);

      return res.status(200).json({
        message: 'PV PDF generated and sent successfully',
        email: contactInfo.email,
        solaireId: finalSolaireId,
        energetiqueId: finalEnergetiqueId,
      });

    } catch (error) {
      const errorMessage = (error as Error).message;
      Logger.error(`❌ PV PDF send error: ${errorMessage}`);
      
      if (error instanceof HTTP400Error) {
        return res.status(400).json({ error: errorMessage });
      }
      
      // Check if it's a validation error from pv-report.builder
      if (errorMessage.includes('Cannot build PV report') || errorMessage.includes('Cannot generate PV report')) {
        return res.status(400).json({ 
          error: errorMessage,
          hint: 'The solar audit simulation may be missing required financial metrics (NPV, IRR, ROI, Payback). Please ensure the economic analysis was completed when creating the simulation.'
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to generate or send PV PDF',
        details: errorMessage 
      });
    }
  }
}

export const pvReportController = new PVReportController();
