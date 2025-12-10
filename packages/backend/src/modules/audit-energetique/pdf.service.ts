import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export interface AuditPdfData {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  address: string;
  governorate: string;

  buildingType: string;
  surfaceArea: number;
  floors: number;
  activityType: string;
  openingDaysPerWeek: number;
  openingHoursPerDay: number;

  insulation: string;
  glazingType: string;
  ventilation: string;
  climateZone: string;

  heatingSystem: string;
  coolingSystem: string;
  conditionedCoverage: string;
  domesticHotWater: string;
  equipmentCategories: string;
  lightingType: string;

  tariffType: string;
  monthlyBillAmount: number;
  contractedPower: number;
  hasRecentBill: boolean;
  recentBillConsumption: number;
  billAttachmentUrl?: string;

  auditDate: string;

  energyConsumption: {
    annual: number;
    perSquareMeter: number;
  };

  co2Emissions: {
    total: number;
    perSquareMeter: number;
  };

  energyCost: number;
  energyClass: string;
  becth: number | string;

  recommendations: string;
}

export class AuditPDFService {
  async generatePDF(data: AuditPdfData): Promise<Buffer> {
    const templatePath = path.resolve(__dirname, './audit-template.html');
    let html = fs.readFileSync(templatePath, 'utf-8');

    const flattened: Record<string, any> = {
      firstName: data.firstName,
      lastName: data.lastName,
      companyName: data.companyName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      address: data.address,
      governorate: data.governorate,

      buildingType: data.buildingType,
      surfaceArea: data.surfaceArea,
      activityType: data.activityType,
      floors: data.floors,
      openingDaysPerWeek: data.openingDaysPerWeek,
      openingHoursPerDay: data.openingHoursPerDay,

      insulation: data.insulation,
      glazingType: data.glazingType,
      ventilation: data.ventilation,
      climateZone: data.climateZone,

      heatingSystem: data.heatingSystem,
      coolingSystem: data.coolingSystem,
      conditionedCoverage: data.conditionedCoverage,
      domesticHotWater: data.domesticHotWater,
      equipmentCategories: data.equipmentCategories,
      lightingType: data.lightingType,

      tariffType: data.tariffType,
      monthlyBillAmount: data.monthlyBillAmount,
      contractedPower: data.contractedPower,
      hasRecentBill: data.hasRecentBill,
      recentBillConsumption: data.recentBillConsumption,
      billAttachmentUrl: data.billAttachmentUrl ?? '',

      auditDate: data.auditDate,

      annualConsumption: data.energyConsumption.annual,
      consumptionPerM2: data.energyConsumption.perSquareMeter,

      co2Total: data.co2Emissions.total,
      co2PerM2: data.co2Emissions.perSquareMeter,

      annualCost: data.energyCost,
      energyClass: data.energyClass,
      becth: data.becth,
      recommendations: data.recommendations,
    };

    // Energy Class Bars (Page 4)
    const energyClasses = [
      { label: "A", color: "#008000" },
      { label: "B", color: "#4CAF50" },
      { label: "C", color: "#CDDC39" },
      { label: "D", color: "#FFC107" },
      { label: "E", color: "#FF9800" },
      { label: "F", color: "#FF5722" },
      { label: "G", color: "#B71C1C" }
    ];

    flattened["classes"] = energyClasses
      .map(c => `<div class="energy-bar" style="width: 360px; background-color: ${c.color};">${c.label}</div>`)
      .join('');

    Object.keys(flattened).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, flattened[key] ?? '');
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '40px', bottom: '40px', left: '40px', right: '40px' },
    });

    await browser.close();

    return Buffer.from(pdf);
  }
}

export const auditPDFService = new AuditPDFService();
