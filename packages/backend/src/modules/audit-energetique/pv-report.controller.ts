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
    let solaireDto: AuditSolaireResponseDto | null = null;
    let energetiqueDto: AuditEnergetiqueResponseDto | null = null;

    // Fetch Audit Solaire data if provided
    if (solaireId) {
      const solaireSimulation = await AuditSolaireSimulationModel.findById(solaireId);
      if (!solaireSimulation) {
        throw new Error(`Audit Solaire simulation not found: ${solaireId}`);
      }
      
      // Validate that required financial metrics are present
      if (solaireSimulation.npv === null || solaireSimulation.npv === undefined) {
        Logger.warn(
          `⚠️ Audit Solaire simulation ${solaireId} is missing NPV. ` +
          `This appears to be an old record or the economic analysis was not completed. ` +
          `Record created: ${solaireSimulation.createdAt}, ` +
          `Has annualEconomics: ${solaireSimulation.annualEconomics?.length ?? 0} years`
        );
      }
      
      solaireDto = toAuditSolaireResponseDto(solaireSimulation);
      Logger.info(`✅ Loaded Audit Solaire simulation: ${solaireId}`);
    }

    // Fetch Audit Energetique data if provided
    if (energetiqueId) {
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
    return this.pdfService.generatePDF(dto, 'pv', solaireDto, energetiqueDto);
  }

  // 🔹 ASYNC / BACKGROUND
  async sendPVReport(req: Request, res: Response) {
    try {
      const { solaireId, energetiqueId, simulationId } = req.body;
      const ids = await this.resolveSimulationIds(solaireId, energetiqueId, simulationId);
      
      const finalSolaireId = ids.solaireId;
      const finalEnergetiqueId = ids.energetiqueId;

      // Load simulations to extract contact info (prefer energetique for contact data)
      let contactInfo: { fullName: string; email: string; company: string } | null = null;

      if (finalEnergetiqueId) {
        const energetiqueSimulation = await AuditEnergetiqueSimulation.findById(finalEnergetiqueId);
        if (!energetiqueSimulation) {
          return res.status(404).json({ error: `Audit Energetique simulation not found: ${finalEnergetiqueId}` });
        }
        const energetiqueDto = toAuditEnergetiqueResponseDto(energetiqueSimulation);
        contactInfo = {
          fullName: energetiqueDto.data.contact.fullName ?? '',
          email: energetiqueDto.data.contact.email ?? '',
          company: energetiqueDto.data.contact.companyName ?? '',
        };
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
      const pdfBuffer = await this.buildPvPdf(finalSolaireId, finalEnergetiqueId);

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
      Logger.error(`❌ PV PDF send error: ${(error as Error).message}`);
      if (error instanceof HTTP400Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to generate or send PV PDF' });
    }
  }
}

export const pvReportController = new PVReportController();
