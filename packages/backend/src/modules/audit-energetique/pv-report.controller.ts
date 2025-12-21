import { Request, Response } from 'express';
import { AuditPDFService } from '../audit-energetique/pdf.service';
import { mailService, MailAttachment } from '../../common/mail/mail.service';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { AuditEnergetiqueSimulation } from '../../models/audit-energetique/audit-energetique-simulation.model';
import { toAuditEnergetiqueResponseDto } from '../audit-energetique/dto/audit-energetique-response.dto';

export class PVReportController {
  private pdfService = new AuditPDFService();

  async sendPVReport(req: Request, res: Response) {
    try {
      const { simulationId } = req.body;

      if (!simulationId) {
        return res.status(400).json({ error: 'simulationId is required' });
      }

      const simulation = await AuditEnergetiqueSimulation.findById(simulationId);
      if (!simulation) {
        return res.status(404).json({ error: 'Simulation not found' });
      }

      const dto = toAuditEnergetiqueResponseDto(simulation);

      Logger.info('☀️ Generating PV PDF...');
      await this.pdfService.generatePDF(dto, 'pv');

      return res.status(200).json({
        message: 'PV PDF generated successfully',
        simulationId,
      });

    } catch (error) {
      Logger.error(`❌ PV PDF error: ${(error as Error).message}`);
      return res.status(500).json({ error: 'Failed to generate PV PDF' });
    }
  }
}

export const pvReportController = new PVReportController();
