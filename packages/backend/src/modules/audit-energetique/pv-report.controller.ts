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
      const solaireSim =
        await AuditSolaireSimulationModel.findById(simulationId);
      if (solaireSim) {
        finalSolaireId = simulationId;
        Logger.info(
          `📋 Using legacy simulationId as solaireId: ${simulationId}`
        );
      } else {
        finalEnergetiqueId = simulationId;
        Logger.info(
          `📋 Using legacy simulationId as energetiqueId: ${simulationId}`
        );
      }
    }

    if (!finalSolaireId && !finalEnergetiqueId) {
      throw new HTTP400Error(
        'Either solaireId or energetiqueId (or legacy simulationId) is required'
      );
    }

    return { solaireId: finalSolaireId, energetiqueId: finalEnergetiqueId };
  }

  /** Contact info for email. Prefer energetique (has contact), fallback to solaire. */
  private async getContactInfo(
    finalSolaireId?: string,
    finalEnergetiqueId?: string
  ): Promise<{ fullName: string; email: string; company: string } | null> {
    if (finalEnergetiqueId) {
      const sim = await AuditEnergetiqueSimulation.findById(finalEnergetiqueId);
      if (sim) {
        const dto = toAuditEnergetiqueResponseDto(sim);
        const email = dto.data.contact.email ?? '';
        if (email) {
          return {
            fullName: dto.data.contact.fullName ?? '',
            email,
            company: dto.data.contact.companyName ?? '',
          };
        }
      }
    }
    if (finalSolaireId) {
      const sim = await AuditSolaireSimulationModel.findById(finalSolaireId);
      if (sim) {
        const dto = toAuditSolaireResponseDto(sim);
        const email = dto.email ?? '';
        if (email) {
          return {
            fullName: dto.fullName ?? '',
            email,
            company: dto.companyName ?? 'Client',
          };
        }
      }
    }
    return null;
  }

  /** Send PV report email in background (shared by download and send-pv-pdf). Logs success or reason skipped. */
  private sendPvReportEmail(
    pdfBuffer: Buffer,
    contactInfo: { fullName: string; email: string; company: string },
    context: string
  ): void {
    const attachment: MailAttachment = {
      Name: `PVReport-${contactInfo.company.replace(/\s+/g, '_')}.pdf`,
      Content: pdfBuffer.toString('base64'),
      ContentType: 'application/pdf',
      ContentID: '',
    };
    const templateId = Number(process.env.POSTMARK_PV_TEMPLATE_ID);
    Logger.info(`📧 Sending PV report to ${contactInfo.email} (${context})...`);
    mailService
      .sendMail({
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
      })
      .then(() => {
        Logger.info(`✅ PV PDF sent to ${contactInfo.email}`);
      })
      .catch((err: Error) => {
        Logger.error(
          `❌ Failed to send PV PDF to ${contactInfo.email}: ${err.message}`
        );
      });
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
    Logger.info(
      `🔄 buildPvPdf called: solaireId=${solaireId}, energetiqueId=${energetiqueId}`
    );
    let solaireDto: AuditSolaireResponseDto | null = null;
    let energetiqueDto: AuditEnergetiqueResponseDto | null = null;

    // Fetch Audit Solaire data if provided
    if (solaireId) {
      Logger.info(`🔍 Fetching Audit Solaire simulation: ${solaireId}`);
      const solaireSimulation =
        await AuditSolaireSimulationModel.findById(solaireId);
      if (!solaireSimulation) {
        throw new Error(`Audit Solaire simulation not found: ${solaireId}`);
      }

      // Validate that required financial metrics are present
      const missingMetrics: string[] = [];
      if (
        solaireSimulation.npv === null ||
        solaireSimulation.npv === undefined
      ) {
        missingMetrics.push('NPV');
      }
      if (
        solaireSimulation.irr === null ||
        solaireSimulation.irr === undefined
      ) {
        missingMetrics.push('IRR');
      }
      if (
        solaireSimulation.roi25Years === null ||
        solaireSimulation.roi25Years === undefined
      ) {
        missingMetrics.push('ROI');
      }
      if (
        solaireSimulation.simplePaybackYears === null ||
        solaireSimulation.simplePaybackYears === undefined
      ) {
        missingMetrics.push('Simple Payback');
      }
      if (
        solaireSimulation.discountedPaybackYears === null ||
        solaireSimulation.discountedPaybackYears === undefined
      ) {
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
      const energetiqueSimulation =
        await AuditEnergetiqueSimulation.findById(energetiqueId);
      if (!energetiqueSimulation) {
        throw new Error(
          `Audit Energetique simulation not found: ${energetiqueId}`
        );
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
    const pdfBuffer = await this.pdfService.generatePDF(
      dto,
      'pv',
      solaireDto,
      energetiqueDto
    );
    Logger.info(`✅ PDF service returned buffer (${pdfBuffer.length} bytes)`);
    return pdfBuffer;
  }

  // 🔹 SWAGGER / DOWNLOAD
  async downloadPVReportPDF(req: Request, res: Response) {
    try {
      const { solaireId, energetiqueId, simulationId } = req.body;
      const ids = await this.resolveSimulationIds(
        solaireId,
        energetiqueId,
        simulationId
      );

      const finalSolaireId = ids.solaireId;
      const finalEnergetiqueId = ids.energetiqueId;

      if (!finalSolaireId && !finalEnergetiqueId) {
        return res.status(400).json({
          error:
            'Either solaireId or energetiqueId (or legacy simulationId) is required',
        });
      }

      Logger.info('🔄 Starting PV PDF generation for download...');
      const pdfBuffer = await this.buildPvPdf(
        finalSolaireId,
        finalEnergetiqueId
      );
      Logger.info(
        `✅ PV PDF generated successfully (${pdfBuffer.length} bytes)`
      );

      // Generate filename
      let filename = 'rapport-pv-joya.pdf';
      if (finalSolaireId) {
        filename = `rapport-pv-${finalSolaireId.substring(0, 8)}.pdf`;
      } else if (finalEnergetiqueId) {
        filename = `rapport-pv-${finalEnergetiqueId.substring(0, 8)}.pdf`;
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      );
      res.send(pdfBuffer);

      // Note: Email is sent automatically after calculation completes, not on PDF download
      // This prevents duplicate emails when users download the PDF

      return;
    } catch (error) {
      const errorMessage = (error as Error).message;
      Logger.error(`❌ PV PDF download error: ${errorMessage}`);

      if (error instanceof HTTP400Error) {
        return res.status(400).json({ error: errorMessage });
      }

      return res.status(500).json({
        error: 'Failed to generate PV PDF',
        details: errorMessage,
      });
    }
  }

  // 🔹 ASYNC / BACKGROUND
  async sendPVReport(req: Request, res: Response) {
    try {
      Logger.info(
        `📋 PV PDF generation request received: solaireId=${req.body.solaireId}, energetiqueId=${req.body.energetiqueId}, simulationId=${req.body.simulationId}`
      );
      const { solaireId, energetiqueId, simulationId } = req.body;
      const ids = await this.resolveSimulationIds(
        solaireId,
        energetiqueId,
        simulationId
      );
      Logger.info(
        `📋 Resolved IDs: solaireId=${ids.solaireId}, energetiqueId=${ids.energetiqueId}`
      );

      const finalSolaireId = ids.solaireId;
      const finalEnergetiqueId = ids.energetiqueId;

      if (finalEnergetiqueId) {
        const exists =
          await AuditEnergetiqueSimulation.findById(finalEnergetiqueId);
        if (!exists) {
          return res.status(404).json({
            error: `Audit Energetique simulation not found: ${finalEnergetiqueId}`,
          });
        }
      }
      if (finalSolaireId) {
        const exists =
          await AuditSolaireSimulationModel.findById(finalSolaireId);
        if (!exists) {
          return res.status(404).json({
            error: `Audit Solaire simulation not found: ${finalSolaireId}`,
          });
        }
      }

      const contactInfo = await this.getContactInfo(
        finalSolaireId,
        finalEnergetiqueId
      );
      if (!contactInfo?.email) {
        return res.status(400).json({
          error:
            'Email address is required. Please provide an email in the PV simulation (Audit Solaire) or provide energetiqueId.',
        });
      }

      if (!mailService.isPostmarkConfigured()) {
        Logger.warn(`Postmark not configured — cannot send PV report`);
        return res.status(500).json({
          error:
            'Postmark is not configured. Set POSTMARK_SERVER_TOKEN to enable sending PV reports.',
        });
      }
      if (!mailService.isTransportAvailable()) {
        Logger.warn(`Email transport is not available — cannot send PV report`);
        return res.status(500).json({
          error: 'Email transport is not available or misconfigured.',
        });
      }

      Logger.info(`🔄 Starting PDF generation...`);
      const pdfBuffer = await this.buildPvPdf(
        finalSolaireId,
        finalEnergetiqueId
      );
      Logger.info(`✅ PDF generated successfully (${pdfBuffer.length} bytes)`);

      Logger.info(`🚀 Sending HTTP 202 response to client IMMEDIATELY...`);
      res.status(202).json({
        message: 'PV PDF generated. Email is being sent in the background.',
        email: contactInfo.email,
        solaireId: finalSolaireId,
        energetiqueId: finalEnergetiqueId,
      });

      setImmediate(() => {
        this.sendPvReportEmail(pdfBuffer, contactInfo, 'send-pv-pdf');
      });

      return;
    } catch (error) {
      const errorMessage = (error as Error).message;
      Logger.error(`❌ PV PDF send error: ${errorMessage}`);

      if (error instanceof HTTP400Error) {
        return res.status(400).json({ error: errorMessage });
      }

      // Check if it's a validation error from pv-report.builder
      if (
        errorMessage.includes('Cannot build PV report') ||
        errorMessage.includes('Cannot generate PV report')
      ) {
        return res.status(400).json({
          error: errorMessage,
          hint: 'The solar audit simulation may be missing required financial metrics (NPV, IRR, ROI, Payback). Please ensure the economic analysis was completed when creating the simulation.',
        });
      }

      return res.status(500).json({
        error: 'Failed to generate or send PV PDF',
        details: errorMessage,
      });
    }
  }
}

export const pvReportController = new PVReportController();
