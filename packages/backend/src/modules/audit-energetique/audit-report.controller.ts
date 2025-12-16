import { Request, Response } from 'express';
import { AuditPDFService } from './pdf.service';
import { mailService, MailAttachment } from '../../common/mail/mail.service';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { AuditEnergetiqueSimulation } from '../../models/audit-energetique/audit-energetique-simulation.model';
import { toAuditEnergetiqueResponseDto } from './dto/audit-energetique-response.dto';

export class AuditReportController {
  private pdfService = new AuditPDFService();

  public async sendAuditPDF(req: Request, res: Response) {
    try {
      const { simulationId } = req.body;

      if (!simulationId) {
        return res.status(400).json({
          error: 'simulationId is required in body',
        });
      }

      // ---------------------------------------------------------------------
      // 1️⃣ Load simulation
      // ---------------------------------------------------------------------
      const simulation = await AuditEnergetiqueSimulation.findById(simulationId);
      if (!simulation) {
        return res.status(404).json({
          error: 'Simulation not found',
        });
      }

      // ---------------------------------------------------------------------
      // 2️⃣ Build DTO (SINGLE SOURCE OF TRUTH)
      // ---------------------------------------------------------------------
      const dto = toAuditEnergetiqueResponseDto(simulation);

      // ---------------------------------------------------------------------
      // 3️⃣ Generate PDF from DTO (✅ FIXED)
      // ---------------------------------------------------------------------
      Logger.info('📄 Generating audit PDF...');
      const pdfBuffer = await this.pdfService.generatePDF(dto);

      // ---------------------------------------------------------------------
      // 4️⃣ Extract data for email (SAFE ACCESS)
      // ---------------------------------------------------------------------
      const contact = dto.data.contact;
      const results = dto.data.results;

      const firstName = contact.firstName ?? '';
      const lastName = contact.lastName ?? '';
      const email = contact.email ?? '';

      const auditDate = dto.data.createdAt.split('T')[0];
      const energyClass = results.energyClassification?.class ?? 'N/A';
      const becth = results.energyClassification?.becth ?? 0;

      // ---------------------------------------------------------------------
      // 5️⃣ Build mail attachment (✅ ContentID REQUIRED)
      // ---------------------------------------------------------------------
      const attachment: MailAttachment = {
        Name: `AuditReport-${firstName}-${lastName}.pdf`,
        Content: pdfBuffer.toString('base64'),
        ContentType: 'application/pdf',
        ContentID: '', // required by interface
      };

      // ---------------------------------------------------------------------
      // 6️⃣ Send email (✅ subject / text / html REQUIRED)
      // ---------------------------------------------------------------------
      Logger.info(`📧 Sending audit report to ${email}...`);

      await mailService.sendMail({
        to: email,
        subject: 'Votre audit énergétique JOYA',
        text: 'Veuillez trouver votre rapport d’audit énergétique en pièce jointe.',
        html: '<p>Veuillez trouver votre rapport d’audit énergétique en pièce jointe.</p>',
        templateId: 42449222,
        templateModel: {
          firstName,
          lastName,
          auditDate,
          energyClass,
          becth,
        },
        attachments: [attachment],
      });

      Logger.info(`✅ Audit PDF sent to ${email}`);

      return res.status(200).json({
        message: 'Audit PDF generated and sent successfully.',
        email,
        simulationId,
      });

    } catch (error) {
      Logger.error(
        `❌ Failed to generate/send audit PDF: ${(error as Error).message}`
      );

      return res.status(500).json({
        error: 'Failed to generate/send audit PDF.',
      });
    }
  }
}

export const auditReportController = new AuditReportController();
