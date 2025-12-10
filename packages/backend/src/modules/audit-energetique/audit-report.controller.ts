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
      const simulationId = req.body.simulationId;

      if (!simulationId) {
        return res.status(400).json({ error: "simulationId is required in body" });
      }

      const simulation = await AuditEnergetiqueSimulation.findById(simulationId);
      if (!simulation) {
        return res.status(404).json({ error: "Simulation not found" });
      }

      const dto = toAuditEnergetiqueResponseDto(simulation);
      const results = dto.data.results || {};

      // --------------------------
      // 1️⃣ Extract contact info safely
      // --------------------------
      const { firstName = '', lastName = '', email = '', companyName = '', phoneNumber = '', address = '', governorate = '' } = dto.data.contact || {};

      // Convert any arrays to strings
      const firstNameStr = Array.isArray(firstName) ? firstName[0] : firstName;
      const lastNameStr = Array.isArray(lastName) ? lastName[0] : lastName;
      const emailStr = Array.isArray(email) ? email[0] : email;
      const companyNameStr = Array.isArray(companyName) ? companyName[0] : companyName;
      const phoneNumberStr = Array.isArray(phoneNumber) ? phoneNumber[0] : phoneNumber;
      const addressStr = Array.isArray(address) ? address[0] : address;
      const governorateStr = Array.isArray(governorate) ? governorate[0] : governorate;

      // --------------------------
      // 2️⃣ Extract building info
      // --------------------------
      const { type: buildingType = '', surfaceArea = 0, floors = 1, activityType = '', openingHoursPerDay = 0, openingDaysPerWeek = 0 } = dto.data.building || {};

      // --------------------------
      // 3️⃣ Extract envelope info
      // --------------------------
      const { insulation = '', glazingType = '', ventilation = '', climateZone = '' } = dto.data.envelope || {};

      // --------------------------
      // 4️⃣ Extract systems info
      // --------------------------
      let { heating: heatingSystem = '', cooling: coolingSystem = '', conditionedCoverage = '', domesticHotWater = '', equipmentCategories = '', lightingType = '' } = dto.data.systems || {};

      // Convert equipmentCategories to string if array
      const equipmentCategoriesStr = Array.isArray(equipmentCategories) ? equipmentCategories.join(', ') : equipmentCategories ?? '';

      // --------------------------
      // 5️⃣ Extract billing info
      // --------------------------
      const { tariffType = '', contractedPower = 0, monthlyBillAmount = 0, hasRecentBill = false, recentBillConsumption = 0, billAttachmentUrl = '' } = dto.data.billing || {};

      // --------------------------
      // 6️⃣ Extract results safely
      // --------------------------
      const annualConsumption = results.energyConsumption?.annual?.value ?? 0;
      const perM2Consumption = results.energyConsumption?.perSquareMeter?.value ?? 0;
      const co2Total = results.co2Emissions?.annual?.kilograms ?? 0;
      const co2PerM2 = results.co2Emissions?.perSquareMeter?.value ?? 0;
      const energyCostAnnual = results.energyCost?.annual?.value ?? 0;
      const energyClass = results.energyClassification?.class ?? 'N/A';
      const becth = results.energyClassification?.becth ?? 0;

      const auditDate = new Date().toISOString().split("T")[0];

      Logger.info("Generating PDF…");

      const pdfBuffer = await this.pdfService.generatePDF({
        firstName: firstNameStr,
        lastName: lastNameStr,
        companyName: companyNameStr,
        email: emailStr,
        phoneNumber: phoneNumberStr,
        address: addressStr,
        governorate: governorateStr,
        buildingType,
        surfaceArea,
        floors,
        activityType,
        openingDaysPerWeek,
        openingHoursPerDay,
        insulation,
        glazingType,
        ventilation,
        climateZone,
        heatingSystem,
        coolingSystem,
        conditionedCoverage,
        domesticHotWater,
        equipmentCategories: equipmentCategoriesStr,
        lightingType,
        tariffType,
        monthlyBillAmount,
        contractedPower,
        hasRecentBill,
        recentBillConsumption,
        billAttachmentUrl,
        auditDate,
        energyConsumption: {
          annual: annualConsumption,
          perSquareMeter: perM2Consumption
        },
        co2Emissions: {
          total: co2Total,
          perSquareMeter: co2PerM2
        },
        energyCost: energyCostAnnual,
        energyClass,
        becth,
        recommendations: "To be filled by energy consultant."
      });

      Logger.debug("PDF Buffer generated:", pdfBuffer.length, "bytes");

      const attachment: MailAttachment = {
        Name: `AuditReport-${firstNameStr}-${lastNameStr}.pdf`,
        Content: pdfBuffer.toString('base64'),
        ContentType: 'application/pdf'
      };

      Logger.info(`Sending email to ${emailStr}...`);

      await mailService.sendMail({
        to: emailStr,
        templateId: 42449222,
        templateModel: {
          firstName: firstNameStr,
          lastName: lastNameStr,
          auditDate,
          energyClass,
          becth
        },
        attachments: [attachment]
      });

      Logger.info(`Audit PDF sent to ${emailStr}`);

      return res.status(200).json({
        message: "Audit PDF generated and sent successfully.",
        email: emailStr,
        simulationId
      });

    } catch (error) {
      Logger.error(`Failed to generate/send audit PDF: ${(error as Error).message}`);
      return res.status(500).json({ error: "Failed to generate/send audit PDF." });
    }
  }
}

export const auditReportController = new AuditReportController();
