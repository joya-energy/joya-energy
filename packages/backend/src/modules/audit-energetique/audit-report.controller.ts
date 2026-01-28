import { Request, Response } from 'express';
import { AuditPDFService } from './pdf.service';
import { mailService, MailAttachment } from '../../common/mail/mail.service';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { AuditEnergetiqueSimulation } from '../../models/audit-energetique/audit-energetique-simulation.model';
import { toAuditEnergetiqueResponseDto } from './dto/audit-energetique-response.dto';
import { getFileService } from '../file/file.service.factory';

export class AuditReportController {
  private pdfService = new AuditPDFService(getFileService());

 
  private async buildAuditPdf(simulationId: string): Promise<Buffer> {
    const simulation = await AuditEnergetiqueSimulation.findById(simulationId);

    if (!simulation) {
      throw new Error('Simulation not found');
    }

    const dto = toAuditEnergetiqueResponseDto(simulation);

    
    return this.pdfService.generatePDF(dto);
  }

  // 🔹 SWAGGER / DOWNLOAD
  async generateAuditReportPDF(req: Request, res: Response) {
    try {
      const { simulationId } = req.body;

      if (!simulationId) {
        return res.status(400).json({ error: 'simulationId is required' });
      }

      const pdfBuffer = await this.buildAuditPdf(simulationId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="rapport-audit-energetique.pdf"',
      );

      return res.send(pdfBuffer);

    } catch (error) {
      Logger.error(`❌ Audit PDF error: ${(error as Error).message}`);
      return res.status(500).json({ error: 'Failed to generate audit PDF' });
    }
  }

  // 🔹 ASYNC / BACKGROUND (EMAIL)
  async sendAuditReport(req: Request, res: Response) {
    try {
      const { simulationId } = req.body;

      if (!simulationId) {
        return res.status(400).json({ error: 'simulationId is required' });
      }

      // ---------------------------------------------------------------------
      // 1️⃣ Load simulation
      // ---------------------------------------------------------------------
      const simulation = await AuditEnergetiqueSimulation.findById(simulationId);
      if (!simulation) {
        return res.status(404).json({ error: 'Simulation not found' });
      }

      // ---------------------------------------------------------------------
      // 2️⃣ Build DTO
      // ---------------------------------------------------------------------
      const dto = toAuditEnergetiqueResponseDto(simulation);

      // ---------------------------------------------------------------------
      // 3️⃣ Infra checks 
      // ---------------------------------------------------------------------
      if (!mailService.isPostmarkConfigured()) {
        Logger.warn(`Postmark not configured — cannot send audit report ${simulationId}`);
        return res.status(500).json({
          error: 'Postmark is not configured. Set POSTMARK_SERVER_TOKEN.',
        });
      }

      if (!mailService.isTransportAvailable()) {
        Logger.warn(`Mail transport unavailable — audit report ${simulationId}`);
        return res.status(500).json({
          error: 'Email transport is not available or misconfigured.',
        });
      }

      // ---------------------------------------------------------------------
      // 4️⃣ Generate PDF
      // ---------------------------------------------------------------------
      const pdfBuffer = await this.pdfService.generatePDF(dto);
      Logger.info(`✅ Audit PDF generated (${pdfBuffer.length} bytes)`);

      // ---------------------------------------------------------------------
      // 5️⃣ Extract email data (SAFE)
      // ---------------------------------------------------------------------
      const contact = dto.data.contact;
      const results = dto.data.results;

      const fullName = contact.fullName ?? '';
      const email = contact.email ?? '';
      const company = contact.companyName ?? '';

      const auditDate = dto.data.createdAt.split('T')[0];
      const energyClass = results.energyClassification?.class ?? 'N/A';
      const becth = results.energyClassification?.becth ?? 0;

      // ---------------------------------------------------------------------
      // 6️⃣ Attachment
      // ---------------------------------------------------------------------
      const attachment: MailAttachment = {
        Name: `AuditReport-${company.replace(/\s+/g, '_')}.pdf`,
        Content: pdfBuffer.toString('base64'),
        ContentType: 'application/pdf',
        ContentID: '',
      };

      // Template configurable via env
      const templateId =
        Number(process.env.POSTMARK_AUDIT_TEMPLATE_ID);

      // ---------------------------------------------------------------------
      // 7️⃣ Send email (non-blocking - don't wait for Postmark response)
      // ---------------------------------------------------------------------
      Logger.info(`📧 Sending audit report to ${email}...`);

      // Send email in background - don't block the HTTP response
      // Postmark can take 30-60 seconds which makes the UI feel slow
      void mailService.sendMail({
        to: email,
        subject: 'Votre audit énergétique JOYA',
        text: 'Veuillez trouver votre rapport d\'audit énergétique en pièce jointe.',
        html: '<p>Veuillez trouver votre rapport d\'audit énergétique en pièce jointe.</p>',
        templateId,
        templateModel: {
          fullName,
          company,
          auditDate,
          energyClass,
          becth,
        },
        attachments: [attachment],
      }).then(() => {
        Logger.info(`✅ Audit PDF sent to ${email}`);
      }).catch((err: Error) => {
        Logger.error(`❌ Failed to send audit PDF to ${email}: ${err.message}`);
      });

      // Return immediately - email is being sent in background
      return res.status(202).json({
        message: 'Audit PDF generated. Email is being sent in the background.',
        email,
        simulationId,
      });

    } catch (error) {
      Logger.error(`❌ Audit PDF send error: ${(error as Error).message}`);
      return res.status(500).json({
        error: 'Failed to generate or send audit PDF',
      });
    }
  }
}

export const auditReportController = new AuditReportController();
