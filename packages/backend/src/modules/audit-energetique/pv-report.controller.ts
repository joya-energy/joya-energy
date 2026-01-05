import { Request, Response } from 'express';
import { AuditPDFService } from '../audit-energetique/pdf.service';
import { mailService, MailAttachment } from '../../common/mail/mail.service';
import { FileService } from '@backend/modules/common/file.service';
import { getFileModel } from '@backend/modules/common/file.repository';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { AuditEnergetiqueSimulation } from '../../models/audit-energetique/audit-energetique-simulation.model';
import { AuditSolaireSimulationModel } from '../../models/audit-solaire/audit-solaire-simulation.model';
import { toAuditEnergetiqueResponseDto } from '../audit-energetique/dto/audit-energetique-response.dto';
import { toAuditSolaireResponseDto } from '../audit-solaire/dto/audit-solaire-response.dto';
import type { AuditSolaireResponseDto } from '../audit-solaire/dto/audit-solaire-response.dto';
import type { AuditEnergetiqueResponseDto } from '../audit-energetique/dto/audit-energetique-response.dto';

interface ConsumptionData {
  totalConsumptionKwh: number;
  totalCostTnd: number;
  breakdown: {
    cooling: { consumptionKwh: number; costTnd: number; sharePercent: number };
    heating: { consumptionKwh: number; costTnd: number; sharePercent: number };
    lighting: { consumptionKwh: number; costTnd: number; sharePercent: number };
    equipment: { consumptionKwh: number; costTnd: number; sharePercent: number };
    dhw: { consumptionKwh: number; costTnd: number; sharePercent: number };
  };
}

export class PVReportController {
  private pdfService = new AuditPDFService();
  private fileService: FileService;

  constructor() {
    const fileModel = getFileModel();
    this.fileService = new FileService(fileModel);
  }

  /**
   * Build PV PDF from simulation IDs and save to cloud storage
   * Supports:
   * - solaireId only: Uses Audit Solaire data (complete PV calculations)
   * - energetiqueId only: Uses Audit Energetique data (basic data, PV = 0)
   * - Both: Combines data for complete report
   * - Optional consumptionData: Override consumption data if needed
   */
  private async buildPvPdf(
    solaireId?: string,
    energetiqueId?: string,
    consumptionData?: ConsumptionData
  ): Promise<{ buffer: Buffer; fileId: string; url: string; fileName: string }> {
    let solaireDto: AuditSolaireResponseDto | null = null;
    let energetiqueDto: AuditEnergetiqueResponseDto | null = null;

    // Fetch Audit Solaire data if provided
    if (solaireId) {
      const solaireSimulation = await AuditSolaireSimulationModel.findById(solaireId);
      if (!solaireSimulation) {
        throw new Error(`Audit Solaire simulation not found: ${solaireId}`);
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

    // If consumption data is provided, merge it with the DTO
    // Note: This would require modifying the DTO structure or PDF template to accept additional consumption data
    if (consumptionData) {
      Logger.info(`📊 Using custom consumption data: ${consumptionData.totalConsumptionKwh} kWh`);
      // TODO: Merge consumptionData with dto if needed for template rendering
    }

    // Pass both DTOs explicitly so PDF service can combine them
    return this.pdfService.generateAndSavePDF(dto, 'pv', solaireDto, energetiqueDto);
  }

  // 🔹 SWAGGER / DOWNLOAD - Now returns file info instead of direct download
  async generatePVReportPDF(req: Request, res: Response) {
    try {
      const { solaireId, energetiqueId, simulationId, consumptionData } = req.body;

      // Support both new format (solaireId/energetiqueId) and legacy (simulationId)
      // Legacy: Try to find simulationId in both models
      let finalSolaireId = solaireId;
      let finalEnergetiqueId = energetiqueId;

      if (simulationId && !finalSolaireId && !finalEnergetiqueId) {
        // Try to find in Audit Solaire first (preferred for PV reports)
        const solaireSim = await AuditSolaireSimulationModel.findById(simulationId);
        if (solaireSim) {
          finalSolaireId = simulationId;
          Logger.info(`📋 Using legacy simulationId as solaireId: ${simulationId}`);
        } else {
          // Fallback to Audit Energetique
          finalEnergetiqueId = simulationId;
          Logger.info(`📋 Using legacy simulationId as energetiqueId: ${simulationId}`);
        }
      }

      if (!finalSolaireId && !finalEnergetiqueId) {
        return res.status(400).json({
          error: 'Either solaireId or energetiqueId (or legacy simulationId) is required'
        });
      }

      const pdfResult = await this.buildPvPdf(finalSolaireId, finalEnergetiqueId, consumptionData);

      // Return file information instead of direct download
      return res.status(201).json({
        success: true,
        message: 'PV PDF generated and stored successfully',
        data: {
          fileId: pdfResult.fileId,
          fileName: pdfResult.fileName,
          url: pdfResult.url,
          size: pdfResult.buffer.length,
          solaireId: finalSolaireId,
          energetiqueId: finalEnergetiqueId,
        }
      });

    } catch (error) {
      Logger.error(`❌ PV PDF error: ${(error as Error).message}`);
      return res.status(500).json({ error: 'Failed to generate PV PDF' });
    }
  }

  // 🔹 ASYNC / BACKGROUND - Send existing or generate new PV report
  async sendPVReport(req: Request, res: Response) {
    try {
      const { solaireId, energetiqueId, simulationId, fileId, consumptionData } = req.body;

      // Support both new format (solaireId/energetiqueId) and legacy (simulationId)
      // Legacy: Try to find simulationId in both models
      let finalSolaireId = solaireId;
      let finalEnergetiqueId = energetiqueId;

      if (simulationId && !finalSolaireId && !finalEnergetiqueId) {
        // Try to find in Audit Solaire first (preferred for PV reports)
        const solaireSim = await AuditSolaireSimulationModel.findById(simulationId);
        if (solaireSim) {
          finalSolaireId = simulationId;
          Logger.info(`📋 Using legacy simulationId as solaireId: ${simulationId}`);
        } else {
          // Fallback to Audit Energetique
          finalEnergetiqueId = simulationId;
          Logger.info(`📋 Using legacy simulationId as energetiqueId: ${simulationId}`);
        }
      }

      if (!finalSolaireId && !finalEnergetiqueId) {
        return res.status(400).json({ 
          error: 'Either solaireId or energetiqueId (or legacy simulationId) is required' 
        });
      }

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

      // Use existing file or generate new PDF
      let pdfBuffer: Buffer;
      let fileName: string;

      if (fileId) {
        // Use existing file
        const existingFile = await this.fileService.getFileById(fileId);
        if (!existingFile) {
          return res.status(404).json({ error: `File not found: ${fileId}` });
        }

        // Get file content (this would need implementation in FileService)
        // For now, we'll regenerate if fileId is not provided
        Logger.info(`📄 Using existing file: ${fileId}`);
        return res.status(400).json({
          error: 'Using existing files not yet implemented. Please omit fileId to generate a new report.'
        });
      } else {
        // Generate new PDF
        const pdfResult = await this.buildPvPdf(finalSolaireId, finalEnergetiqueId, consumptionData);
        pdfBuffer = pdfResult.buffer;
        fileName = pdfResult.fileName;
        Logger.info(`📄 Generated new PV report: ${fileName}`);
      }

      // Attachment
      const attachment: MailAttachment = {
        Name: fileName || `PVReport-${contactInfo.company.replace(/\s+/g, '_')}.pdf`,
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
      return res.status(500).json({ error: 'Failed to generate or send PV PDF' });
    }
  }

  /**
   * Download existing PV report by file ID
   */
  async downloadPVReport(req: Request, res: Response) {
    try {
      const { fileId } = req.params;

      if (!fileId) {
        return res.status(400).json({ error: 'fileId parameter is required' });
      }

      const file = await this.fileService.getFileById(fileId);
      if (!file) {
        return res.status(404).json({ error: 'PV report not found' });
      }

      // Verify it's a PV report
      if (file.folder !== 'pv-reports') {
        return res.status(400).json({ error: 'File is not a PV report' });
      }

      // Get direct download URL
      const downloadUrl = await this.fileService.getFileUrl(fileId);
      if (!downloadUrl) {
        return res.status(500).json({ error: 'Could not generate download URL' });
      }

      return res.json({
        success: true,
        data: {
          fileId: file.id,
          fileName: file.originalName,
          url: downloadUrl,
          size: file.size,
          createdAt: file.createdAt,
        }
      });

    } catch (error) {
      Logger.error(`❌ PV report download error: ${(error as Error).message}`);
      return res.status(500).json({ error: 'Failed to download PV report' });
    }
  }

  /**
   * Get PV reports for a simulation
   */
  async getPVReports(req: Request, res: Response) {
    try {
      const { simulationId } = req.params;

      if (!simulationId) {
        return res.status(400).json({ error: 'simulationId parameter is required' });
      }

      const files = await this.fileService.getFilesBySimulationId(simulationId);
      const pvReports = files.filter(file => file.folder === 'pv-reports');

      return res.json({
        success: true,
        data: pvReports.map(file => ({
          fileId: file.id,
          fileName: file.originalName,
          url: file.storageUrl,
          size: file.size,
          createdAt: file.createdAt,
        }))
      });

    } catch (error) {
      Logger.error(`❌ Get PV reports error: ${(error as Error).message}`);
      return res.status(500).json({ error: 'Failed to get PV reports' });
    }
  }
}

export const pvReportController = new PVReportController();
