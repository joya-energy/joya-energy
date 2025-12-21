import { AuditPDFService } from './modules/audit-energetique/pdf.service';
import { AuditEnergetiqueSimulation } from './models/audit-energetique/audit-energetique-simulation.model';
import { toAuditEnergetiqueResponseDto } from './modules/audit-energetique/dto/audit-energetique-response.dto';
import mongoose from 'mongoose';

(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/joya_finance');

  const simulation = await AuditEnergetiqueSimulation.findOne();
  if (!simulation) throw new Error('No simulation found');

  const dto = toAuditEnergetiqueResponseDto(simulation);

  const pdfService = new AuditPDFService();
  await pdfService.generatePDF(dto, 'pv');

  console.log('☀️ PV PDF generated');
  process.exit(0);
})();
