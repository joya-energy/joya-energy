import puppeteer, { type Browser } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { AuditEnergetiqueResponseDto } from './dto/audit-energetique-response.dto';
import { AuditSolaireResponseDto } from '../audit-solaire/dto/audit-solaire-response.dto';
import { buildPvReportDataFromSolaire, type PvReportData } from './pv-report.builder';
import { AuditReportBuilder } from './audit-report.builder';
import { getRecommendationsHTML } from './recommendation.service';
import { type MonthlyEconomicData } from '@shared/interfaces/audit-solaire.interface';
import { FileService } from '../file/file.service';
import { FileType, type IFile } from '@shared/interfaces/file.interface';
import { Logger } from '@backend/middlewares/logger.midddleware';
import { getFileService } from '../file/file.service.factory';
import { AuditSimulationTypes } from '@backend/enums';

type PDFInputDto =
  | AuditEnergetiqueResponseDto
  | AuditSolaireResponseDto;
export type PDFTemplateType = 'audit' | 'pv';


/**
 * PDF generation timeout in milliseconds
 */
const PDF_GENERATION_TIMEOUT_MS = 60000; // 60 seconds

/**
 * Static assets cache for templates, CSS, and images
 * Loaded once on service initialization to avoid blocking I/O on every request
 */
interface StaticAssetsCache {
  templates: Map<PDFTemplateType, string>;
  css: Map<string, string>;
  images: Map<string, string>;
}

export class AuditPDFService {
  private browser: Browser | null = null;
  private browserPromise: Promise<Browser> | null = null;
  private readonly fileService: FileService;
  private readonly assetsCache: StaticAssetsCache;

  constructor(fileService: FileService) {
    this.fileService = fileService;
    this.assetsCache = {
      templates: new Map(),
      css: new Map(),
      images: new Map(),
    };
    this.initializeAssetsCache();
  }

  /**
   * Initialize static assets cache on service creation
   * Loads all templates, CSS files, and images into memory
   */
  private initializeAssetsCache(): void {
    try {
      // Cache templates
      const auditTemplateDir = path.resolve(__dirname, './template/audit');
      const pvTemplateDir = path.resolve(__dirname, './template/pv');
      
      this.assetsCache.templates.set('audit', fs.readFileSync(
        path.join(auditTemplateDir, 'template.html'),
        'utf8'
      ));
      this.assetsCache.templates.set('pv', fs.readFileSync(
        path.join(pvTemplateDir, 'template.html'),
        'utf8'
      ));

      // Cache CSS files
      this.assetsCache.css.set('audit-bootstrap', fs.readFileSync(
        path.join(auditTemplateDir, 'bootstrap.min.css'),
        'utf8'
      ));
      this.assetsCache.css.set('audit-style', fs.readFileSync(
        path.join(auditTemplateDir, 'style.css'),
        'utf8'
      ));
      this.assetsCache.css.set('pv-bootstrap', fs.readFileSync(
        path.join(pvTemplateDir, 'bootstrap.min.css'),
        'utf8'
      ));
      this.assetsCache.css.set('pv-style', fs.readFileSync(
        path.join(pvTemplateDir, 'style.css'),
        'utf8'
      ));

      // Cache images from organized uploads folders
      const uploadsDir = path.resolve(__dirname, './uploads');
      const imageMapping = [
        { file: 'cover.png', category: 'covers' },
        { file: 'logo.png', category: 'branding' },
        { file: 'building.png', category: 'buildings' },
        { file: 'building2.png', category: 'buildings' },
        { file: 'cold.png', category: 'icons' },
        { file: 'heat.png', category: 'icons' },
        { file: 'light.png', category: 'icons' },
        { file: 'equipment.png', category: 'icons' },
        { file: 'ecs.png', category: 'icons' },
        { file: 'energy.png', category: 'icons' },
        { file: 'panneau.png', category: 'solar' },
        { file: 'pv-cover.png', category: 'solar' },
        { file: 'bank.png', category: 'financial' },
        { file: 'invest.png', category: 'financial' },
      ];

      for (const { file, category } of imageMapping) {
        const imagePath = path.join(uploadsDir, category, file);
        if (fs.existsSync(imagePath)) {
          this.assetsCache.images.set(file, fs.readFileSync(imagePath).toString('base64'));
        } else {
          Logger.warn(`⚠️ Image file not found: ${category}/${file}`);
        }
      }

      Logger.info(`✅ Static assets cache initialized: ${this.assetsCache.templates.size} templates, ${this.assetsCache.css.size} CSS files, ${this.assetsCache.images.size} images`);
    } catch (error) {
      Logger.error(`❌ Failed to initialize static assets cache: ${String(error)}`);
      // Continue execution - will fall back to reading files on demand
    }
  }

  /**
   * Load image as base64 from cache
   */
  private getImageBase64(imageName: string): string {
    const cached = this.assetsCache.images.get(imageName);
    if (cached) {
      return cached;
    }
    
    // Fallback: read from disk if not in cache
    Logger.warn(`⚠️ Image ${imageName} not in cache, reading from disk`);
    const imagePath = path.resolve(__dirname, './image', imageName);
    if (fs.existsSync(imagePath)) {
      const base64 = fs.readFileSync(imagePath).toString('base64');
      this.assetsCache.images.set(imageName, base64);
      return base64;
    }
    
    throw new Error(`Image file not found: ${imageName}`);
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }
    
    if (!this.browserPromise) {
      this.browserPromise = puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    
    this.browser = await this.browserPromise;
    this.browserPromise = null;
    return this.browser;
  }

  /**
   * Load template HTML and CSS from cache
   */
  private loadTemplateAssets(template: PDFTemplateType): string {
    let html = this.assetsCache.templates.get(template);
    if (!html) {
      // Fallback: read from disk if not in cache
      Logger.warn(`⚠️ Template ${template} not in cache, reading from disk`);
      const templatePath = path.resolve(__dirname, `./template/${template}/template.html`);
      html = fs.readFileSync(templatePath, 'utf8');
      this.assetsCache.templates.set(template, html);
    }

    const bootstrapCSS = this.assetsCache.css.get(`${template}-bootstrap`) ?? '';
    const customCSS = this.assetsCache.css.get(`${template}-style`) ?? '';
    
    return html.replace('{{INLINE_CSS}}', `${bootstrapCSS}\n${customCSS}`);
  }

  /**
   * Load all images from cache
   */
  private loadAllImages(): Record<string, string> {
    return {
      heroImageBase64: this.getImageBase64('cover.png'),
      joyaLogoBase64: this.getImageBase64('logo.png'),
      buildingImageBase64: this.getImageBase64('building.png'),
      iconACBase64: this.getImageBase64('cold.png'),
      iconHeatingBase64: this.getImageBase64('heat.png'),
      iconLightBase64: this.getImageBase64('light.png'),
      iconEquipmentBase64: this.getImageBase64('equipment.png'),
      iconECSBase64: this.getImageBase64('ecs.png'),
      energyIconBase64: this.getImageBase64('energy.png'),
      building2IconBase64: this.getImageBase64('building2.png'),
      panneauIconBase64: this.getImageBase64('panneau.png'),
      bankIconBase64: this.getImageBase64('bank.png'),
      investIconBase64: this.getImageBase64('invest.png'),
      pvcoverBase64: this.getImageBase64('pv-cover.png'),
    };
  }

  /**
   * Generate energy and CO2 scale HTML
   */
  private generateScaleHTML(
    scale: Array<{ label: string; color: string; width: number }>,
    activeClass: string,
    wrapperClass: string
  ): string {
    const isEnergy = wrapperClass.includes('energy');
    return scale
      .map(
        c => `
    <div class="${wrapperClass}">
      <div class="${isEnergy ? 'energy-row' : 'co2-bar'} ${c.label === activeClass ? 'active' : ''}"
           style="background:${c.color}; width:${c.width}%;">
        ${c.label}
      </div>
    </div>
  `
      )
      .join('');
  }

  /**
   * Render HTML template by replacing variables
   */
  private renderHTML(html: string, variables: Record<string, string | number | boolean>): string {
    Object.entries(variables).forEach(([key, value]) => {
      html = html.replace(
        new RegExp(`{{${key}}}`, 'g'),
        String(value ?? '')
      );
    });
    return html;
  }

  /**
   * Generate PDF buffer from HTML
   */
  private async generatePDFFromHTML(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '40px',
          bottom: '40px',
          left: '40px',
          right: '40px',
        },
      });

      return Buffer.from(pdf);
    } finally {
      // Ensure page is always closed, even if PDF generation fails
      await page.close().catch((error) => {
        Logger.warn(`⚠️ Failed to close PDF page: ${String(error)}`);
      });
    }
  }

  /**
   * Generate PDF with timeout protection
   */
  async generatePDF(
    dto: PDFInputDto,
    template: PDFTemplateType = 'audit',
    solaireDto?: AuditSolaireResponseDto | null,
    energetiqueDto?: AuditEnergetiqueResponseDto | null
  ): Promise<Buffer> {
    return Promise.race([
      this._generatePDF(dto, template, solaireDto, energetiqueDto),
      new Promise<Buffer>((_, reject) =>
        setTimeout(
          () => reject(new Error(`PDF generation timeout after ${PDF_GENERATION_TIMEOUT_MS}ms`)),
          PDF_GENERATION_TIMEOUT_MS
        )
      ),
    ]);
  }

  /**
   * Internal PDF generation method
   */
  private async _generatePDF(
    dto: PDFInputDto,
    template: PDFTemplateType = 'audit',
    solaireDto?: AuditSolaireResponseDto | null,
    energetiqueDto?: AuditEnergetiqueResponseDto | null
  ): Promise<Buffer> {

    const isAudit = template === 'audit';
    const isPv = template === 'pv';

    // For PV template, use provided DTOs or fallback to dto parameter
    // Prefer explicitly passed DTOs over type casting from single dto
    const auditDto = energetiqueDto ?? ((isAudit || isPv) ? dto as AuditEnergetiqueResponseDto : null);
    const pvDtoParam = solaireDto ?? (isPv ? dto as AuditSolaireResponseDto : null);

    /* ===============================
       LOAD TEMPLATE & IMAGES
    =============================== */
    let html = this.loadTemplateAssets(template);
    const images = this.loadAllImages();



    /* ===============================
       ENERGY & CO₂ SCALES
    =============================== */
    const energyScale = [
      { label: 'A', color: '#008000', width: 40 },
      { label: 'B', color: '#4CAF50', width: 46 },
      { label: 'C', color: '#CDDC39', width: 52 },
      { label: 'D', color: '#FFC107', width: 60 },
      { label: 'E', color: '#FF9800', width: 68 },
    ];

    const energyClass = auditDto?.data?.results?.energyClassification?.class ?? 'N/A';
    const classes = this.generateScaleHTML(energyScale, energyClass, 'energy-row-wrapper');

    const co2Scale = [
      { label: 'A', color: '#b0e3ff', width: 40 },
      { label: 'B', color: '#99c9f3', width: 46 },
      { label: 'C', color: '#7aaed4', width: 52 },
      { label: 'D', color: '#5f93b5', width: 60 },
      { label: 'E', color: '#466f95', width: 68 },
    ];

    const carbonClass = auditDto?.data?.results?.carbonClassification?.class ?? 'N/A';
    const co2Classes = this.generateScaleHTML(co2Scale, carbonClass, 'co2-scale');


    // For PV template, use the explicitly passed solaireDto or detect from dto
    // Prefer the explicitly passed DTO over type detection
    const finalSolaireDto = pvDtoParam ?? (isPv && ('installedPower' in dto || 'systemSize_kWp' in dto || 'expectedProduction' in dto) ? dto as AuditSolaireResponseDto : null);
    
    
    const reportData = isAudit && auditDto
      ? AuditReportBuilder.build(auditDto)
      : isPv && finalSolaireDto
        ? buildPvReportDataFromSolaire(finalSolaireDto, auditDto ?? undefined)
        : isPv
          ? (() => {
              // PV template requires solar audit data with PV calculations
              throw new Error(
                'Cannot generate PV report: PV data is missing. ' +
                'PV reports require AuditSolaireResponseDto with PV calculation data (installedPower, expectedProduction, etc.).'
              );
            })()
          : {};


            const endUses = isAudit
      ? (reportData as ReturnType<typeof AuditReportBuilder.build>).endUses
      : null;




    /* ===============================
       FLATTEN DTO → TEMPLATE
    =============================== */
    // For PV template with Solaire: data might come from Energetique (for CO₂, contact) or be null
    // For Audit template: always use Energetique data
    const data = isAudit && auditDto
      ? auditDto.data
      : isPv && auditDto
        ? auditDto.data  // Energetique data (for CO₂, contact info)
        : isPv && finalSolaireDto
          ? null  // Only Solaire, no Energetique data
          : (dto as AuditEnergetiqueResponseDto).data;

    // Helper to format numbers or return "N/A" for null values
    const formatNumberOrNA = (value: number | null | undefined): string | number => {
      return value === null || value === undefined ? 'N/A' : value;
    };

    const flattened: Record<string, string | number | boolean> = {
     studyDuration: 25,
     pvDegradation: 0.4,
     stegInflation: 7,
     discountRate: 8,

     
     // ---- END USES (FLAT KEYS FOR TEMPLATE) ----
'endUses.cooling.consumptionKwh': formatNumberOrNA(endUses?.cooling.consumptionKwh),
'endUses.cooling.costTunisianDinar': formatNumberOrNA(endUses?.cooling.costTunisianDinar),
'endUses.cooling.sharePercent': formatNumberOrNA(endUses?.cooling.sharePercent),

'endUses.heating.consumptionKwh': formatNumberOrNA(endUses?.heating.consumptionKwh),
'endUses.heating.costTunisianDinar': formatNumberOrNA(endUses?.heating.costTunisianDinar),
'endUses.heating.sharePercent': formatNumberOrNA(endUses?.heating.sharePercent),

'endUses.lighting.consumptionKwh': formatNumberOrNA(endUses?.lighting.consumptionKwh),
'endUses.lighting.costTunisianDinar': formatNumberOrNA(endUses?.lighting.costTunisianDinar),
'endUses.lighting.sharePercent': formatNumberOrNA(endUses?.lighting.sharePercent),

'endUses.equipment.consumptionKwh': formatNumberOrNA(endUses?.equipment.consumptionKwh),
'endUses.equipment.costTunisianDinar': formatNumberOrNA(endUses?.equipment.costTunisianDinar),
'endUses.equipment.sharePercent': formatNumberOrNA(endUses?.equipment.sharePercent),

'endUses.domesticHotWater.consumptionKwh': formatNumberOrNA(endUses?.domesticHotWater.consumptionKwh),
'endUses.domesticHotWater.costTunisianDinar': formatNumberOrNA(endUses?.domesticHotWater.costTunisianDinar),
'endUses.domesticHotWater.sharePercent': formatNumberOrNA(endUses?.domesticHotWater.sharePercent),



      ...images,
      classes,
      co2Classes,

      // Contact info - from Energetique if available, otherwise use Solaire or defaults
      auditDate: data 
        ? new Date(data.createdAt).toLocaleDateString('fr-FR')
        : (finalSolaireDto ? new Date(finalSolaireDto.createdAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')),

      fullName: data?.contact.fullName ?? '',
      companyName: data?.contact.companyName ?? '',
      email: data?.contact.email ?? '',
      phoneNumber: data?.contact.phoneNumber ?? '',
      address: data?.contact.address ?? '',
      governorate: data?.contact.governorate ?? '',

      // Building info - from Energetique if available
      heating: data?.systems.heating ?? '',
      cooling: data?.systems.cooling ?? '',
      ventilation: data?.envelope.ventilation ?? '',
      domesticHotWater: data?.systems.domesticHotWater ?? '',
      glazingType: data?.envelope.glazingType ?? '',

      buildingType: data?.building.type ?? (finalSolaireDto?.buildingType ?? ''),
      surfaceArea: data?.building.surfaceArea ?? 0,
      floors: data?.building.floors ?? 0,
      activityType: data?.building.activityType ?? '',

      climateZone: data?.envelope.climateZone ?? (finalSolaireDto?.climateZone ?? ''),

      tariffType: data?.billing.tariffType ?? '',
      monthlyBillAmount: data?.billing.monthlyBillAmount ?? 0,
      contractedPower: data?.billing.contractedPower ?? '',

      // Energy classification - only from Energetique
      energyClass,
      becth: data?.results?.energyClassification?.becth ?? '',
      annualConsumption: data?.results?.energyConsumption?.annual?.value ?? (finalSolaireDto?.annualConsumption ?? 0),
      consumptionPerM2: data?.results?.energyConsumption?.perSquareMeter?.value ?? 0,
      co2PerM2: data?.results?.co2Emissions?.perSquareMeter?.value ?? 0,
      // Format CO2 emissions with French number style (comma as decimal separator)
      // Ensure it's always a string for template replacement
      co2Emissions: (() => {
        const value = data?.results?.co2Emissions?.perSquareMeter?.value;
        if (value === undefined || value === null || isNaN(value)) {
          return '0,00';
        }
        const fixed = Number(value).toFixed(2);
        const parts = fixed.split('.');
        return parts[1] ? `${parts[0]},${parts[1]}` : parts[0];
      })(),
      annualCost: data?.results?.energyCost?.annual?.value ?? 0,

      recommendationsHTML: getRecommendationsHTML(data?.building.type ?? finalSolaireDto?.buildingType ?? ''),
    };


    // ===============================
    // MERGE PV REPORT DATA (ONLY FOR PV TEMPLATE)
    // ===============================
    if (template === 'pv') {
      // Format numbers for display (without locale formatting to avoid space issues)
      // Returns "N/A" for null/undefined values (missing data)
      const formatNumber = (n: number | string | null | undefined, decimals = 2): string => {
        // Return "N/A" for missing data (null or undefined)
        if (n === null || n === undefined) {
          return 'N/A';
        }
        
        const num = typeof n === 'string' ? parseFloat(n) : n;
        if (!Number.isFinite(num)) {
          return 'N/A';
        }
        
        // Handle zero values (real zeros, not missing data)
        if (num === 0) {
          if (decimals === 0) return '0';
          return '0' + (decimals > 0 ? '.' + '0'.repeat(decimals) : '');
        }
        
        // Format with French number style (space as thousand separator, comma as decimal)
        const fixed = num.toFixed(decimals);
        const parts = fixed.split('.');
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return decimals > 0 ? `${integerPart},${parts[1]}` : integerPart;
      };
      
      const pvData = reportData as PvReportData;
      
      // Merge PV data first (raw numbers)
      Object.assign(flattened, reportData as Record<string, number | string>);
      
      // Add missing financial metrics that template expects
      // Pass null values directly - formatNumber will return "N/A" for missing data
      flattened.gainDiscounted = formatNumber(pvData.gainDiscounted, 0);
      flattened.cashflowCumulated = formatNumber(pvData.cashflowCumulated, 0);
      flattened.cashflowDiscounted = formatNumber(pvData.cashflowDiscounted, 0);
      
      // Ensure all PV fields are properly formatted and override with formatted values
      flattened.pvPower = formatNumber(pvData.pvPower, 2);
      flattened.pvYield = formatNumber(pvData.pvYield, 0);
      flattened.pvProductionYear1 = formatNumber(pvData.pvProductionYear1, 0);
      flattened.coverageRate = formatNumber(pvData.coverageRate, 1);
      
      // Use actual values from PV data (these should be calculated correctly)
      flattened.consumptionWithoutPV = formatNumber(pvData.consumptionWithoutPV, 0);
      flattened.consumptionWithPV = formatNumber(pvData.consumptionWithPV, 0);
      flattened.avgPriceWithoutPV = formatNumber(pvData.avgPriceWithoutPV, 3);
      flattened.avgPriceWithoutPV_mDt = pvData.avgPriceWithoutPV !== null 
        ? formatNumber(pvData.avgPriceWithoutPV * 1000, 0)
        : 'N/A';
      flattened.avgPriceWithPV = formatNumber(pvData.avgPriceWithPV, 3);
      flattened.avgPriceWithPV_mDt = pvData.avgPriceWithPV !== null
        ? formatNumber(pvData.avgPriceWithPV * 1000, 0)
        : 'N/A';
      flattened.annualSavings = formatNumber(pvData.annualSavings, 0);
      flattened.gainCumulated = formatNumber(pvData.gainCumulated, 0);
      flattened.npv = formatNumber(pvData.npv, 0);
      flattened.paybackSimple = formatNumber(pvData.paybackSimple, 2);
      flattened.paybackDiscounted = formatNumber(pvData.paybackDiscounted, 2);
      flattened.irr = formatNumber(pvData.irr, 2);
      // ROI is stored as a ratio, convert to percentage for display
      flattened.roi = formatNumber(pvData.roi !== null && pvData.roi !== undefined ? pvData.roi * 100 : null, 2);
      flattened.co2PerYear = formatNumber(pvData.co2PerYear, 2);
      flattened.co2Total = formatNumber(pvData.co2Total, 0);
      
      // Investment information (capexPerKwp and annualOpexRate are constants, not nullable)
      flattened.capexPerKwp = formatNumber(pvData.capexPerKwp, 0);
      flattened.annualOpexRate = formatNumber(pvData.annualOpexRate, 0);
      flattened.capexTotal = formatNumber(pvData.capexTotal, 0);
      flattened.opexAnnual = formatNumber(pvData.opexAnnual, 0);
      
      // Format annual consumption for PV template
      // Use Solaire annualConsumption if available, otherwise Energetique
      const annualConsumptionValue = finalSolaireDto?.annualConsumption ?? 
        (data?.results?.energyConsumption?.annual?.value ?? 0);
      flattened.annualConsumption = formatNumber(annualConsumptionValue, 0);
      
      // Use actual CO2 data from audit if PV data doesn't have it
      // Pass null if audit data is also missing (formatNumber will return "N/A")
      if (pvData.co2PerYear === null || pvData.co2PerYear === undefined) {
        const co2TonsFromAudit = data?.results?.co2Emissions?.annual?.tons;
        flattened.co2PerYear = formatNumber(co2TonsFromAudit, 2);
      }
      if (pvData.co2Total === null || pvData.co2Total === undefined) {
        const co2TonsFromAudit = data?.results?.co2Emissions?.annual?.tons;
        const studyDuration = typeof flattened.studyDuration === 'number' ? flattened.studyDuration : 25;
        flattened.co2Total = co2TonsFromAudit !== null && co2TonsFromAudit !== undefined
          ? formatNumber(co2TonsFromAudit * studyDuration, 0)
          : formatNumber(null, 0);
      }
    }

    // Note: monthlyEconomics would come from AuditSolaireResponseDto if available
    // For now, this is only used when PV template is used with solar audit data
    if (isPv && finalSolaireDto && 'monthlyEconomics' in finalSolaireDto) {
      const monthlyData = finalSolaireDto.monthlyEconomics;
      if (Array.isArray(monthlyData)) {
        monthlyData.forEach((m: MonthlyEconomicData, i: number) => {
          flattened[`pv.month.${i}.withoutPv`] = m.billWithoutPV ?? 0;
          flattened[`pv.month.${i}.withPv`] = m.billWithPV ?? 0;
          flattened[`pv.month.${i}.savings`] = m.monthlySavings ?? 0;
        });
      }
    }

    /* ===============================
       RENDER HTML & GENERATE PDF
    =============================== */
    html = this.renderHTML(html, flattened);
    const pdfBuffer = await this.generatePDFFromHTML(html);

    // Save to cloud storage (or fallback)
    try {
      const filePrefix = template === 'pv' ? 'PV' : 'Audit';
      const fileName = data 
        ? `${data.contact.companyName || data.contact.fullName || 'Client'}`
        : (finalSolaireDto ? 'Client' : 'Unknown');
      const originalFileName = `${filePrefix}_${fileName}.pdf`;
      const fileType = template === 'pv' ? FileType.PDF_PV_REPORT : FileType.PDF_AUDIT_REPORT;
      
      const simulationId = auditDto?.data?.simulationId ?? (dto as AuditEnergetiqueResponseDto)?.data?.simulationId ?? finalSolaireDto?.id;
      
      const metadata: IFile['metadata'] = {
        simulationId,
        simulationType: template === 'pv' 
          ? (finalSolaireDto ? AuditSimulationTypes.AUDIT_SOLAIRE : AuditSimulationTypes.AUDIT_ENERGETIQUE) 
          : AuditSimulationTypes.AUDIT_ENERGETIQUE,
        companyName: data?.contact?.companyName || data?.contact?.fullName || undefined,
      };

      await this.fileService.uploadAndSaveFile(
        pdfBuffer,
        originalFileName,
        fileType,
        metadata
      );
    } catch (error) {
      Logger.error(`⚠️ Failed to save PDF: ${String(error)}`);
      // Continue execution even if save fails
    }
    
    return pdfBuffer;
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.browserPromise = null;
    }
  }
}

// Note: This instance uses a fallback storage service.
// Controllers should use getFileService() when creating AuditPDFService instances.
// This export is kept for backward compatibility but should not be used directly.
export const auditPDFService = new AuditPDFService(getFileService());
