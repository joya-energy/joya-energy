import puppeteer, { type Browser } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
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

/**
 * Image compression quality (0-100)
 * 60 provides good quality for PDF documents while keeping file size small
 */
const IMAGE_COMPRESSION_QUALITY = 60;

/**
 * Maximum image dimensions for PDF
 * Images larger than this will be resized down
 */
const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_HEIGHT = 600;

/** Cover images are loaded at full quality (no compression or resize) */
const COVER_IMAGE_FILES = ['cover.png', 'pv-cover.png'];

type PDFInputDto =
  | AuditEnergetiqueResponseDto
  | AuditSolaireResponseDto;
export type PDFTemplateType = 'audit' | 'pv-bt' | 'pv-mt';


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
  private assetsCacheReady: Promise<void>;

  constructor(fileService: FileService) {
    this.fileService = fileService;
    this.assetsCache = {
      templates: new Map(),
      css: new Map(),
      images: new Map(),
    };
    this.assetsCacheReady = this.initializeAssetsCache();
  }

  /**
   * Load a cover image at full quality (no compression or resize).
   * Used for report cover images so they stay sharp in the PDF.
   */
  private loadCoverImage(imagePath: string): string {
    const buffer = fs.readFileSync(imagePath);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

  /**
   * Compress and resize an image using sharp
   * - Resizes large images to fit within MAX dimensions
   * - Converts PNG to optimized PNG or JPEG depending on content
   */
  private async compressImage(imagePath: string): Promise<string> {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      let image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      // Resize if image is too large (keeps aspect ratio)
      const width = metadata.width || 0;
      const height = metadata.height || 0;
      
      if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
        image = image.resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      // For images with transparency, use PNG with compression
      // For others, convert to JPEG for better compression
      let compressedBuffer: Buffer;
      let mimeType: string;
      
      if (metadata.hasAlpha) {
        // Keep PNG but optimize it aggressively
        compressedBuffer = await image
          .png({ 
            quality: IMAGE_COMPRESSION_QUALITY,
            compressionLevel: 9,
            effort: 10,
            palette: true  // Use palette-based PNG for smaller files
          })
          .toBuffer();
        mimeType = 'image/png';
      } else {
        // Convert to JPEG for better compression (no transparency needed)
        compressedBuffer = await image
          .jpeg({ 
            quality: IMAGE_COMPRESSION_QUALITY,
            mozjpeg: true
          })
          .toBuffer();
        mimeType = 'image/jpeg';
      }
      
      const originalSize = imageBuffer.length;
      const compressedSize = compressedBuffer.length;
      const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      
      Logger.debug(`📦 Compressed ${path.basename(imagePath)}: ${(originalSize/1024).toFixed(1)}KB → ${(compressedSize/1024).toFixed(1)}KB (${savings}% saved)`);
      
      // Return as data URI with correct MIME type
      return `data:${mimeType};base64,${compressedBuffer.toString('base64')}`;
    } catch (error) {
      Logger.warn(`⚠️ Failed to compress ${imagePath}, using original: ${String(error)}`);
      // Fallback to original
      const originalBuffer = fs.readFileSync(imagePath);
      return originalBuffer.toString('base64');
    }
  }

  /**
   * Initialize static assets cache on service creation
   * Loads all templates, CSS files, and images into memory
   * Images are compressed to reduce PDF size
   */
  private async initializeAssetsCache(): Promise<void> {
    try {
      // Cache templates
      const auditTemplateDir = path.resolve(__dirname, './template/audit');
      const pvBtTemplateDir = path.resolve(__dirname, './template/pv-bt');
      const pvMtTemplateDir = path.resolve(__dirname, './template/pv-mt');

      this.assetsCache.templates.set('audit', fs.readFileSync(
        path.join(auditTemplateDir, 'template.html'),
        'utf8'
      ));
      this.assetsCache.templates.set('pv-bt', fs.readFileSync(
        path.join(pvBtTemplateDir, 'template.html'),
        'utf8'
      ));
      this.assetsCache.templates.set('pv-mt', fs.readFileSync(
        path.join(pvMtTemplateDir, 'template.html'),
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
      this.assetsCache.css.set('pv-bt-bootstrap', fs.readFileSync(
        path.join(pvBtTemplateDir, 'bootstrap.min.css'),
        'utf8'
      ));
      this.assetsCache.css.set('pv-bt-style', fs.readFileSync(
        path.join(pvBtTemplateDir, 'style.css'),
        'utf8'
      ));
      this.assetsCache.css.set('pv-mt-bootstrap', fs.readFileSync(
        path.join(pvMtTemplateDir, 'bootstrap.min.css'),
        'utf8'
      ));
      this.assetsCache.css.set('pv-mt-style', fs.readFileSync(
        path.join(pvMtTemplateDir, 'style.css'),
        'utf8'
      ));

      // Cache images from organized uploads folders (with compression)
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

      // Load images: cover images at full quality, others compressed
      const compressionPromises = imageMapping.map(async ({ file, category }) => {
        const imagePath = path.join(uploadsDir, category, file);
        if (!fs.existsSync(imagePath)) {
          Logger.warn(`⚠️ Image file not found: ${category}/${file}`);
          return;
        }
        if (COVER_IMAGE_FILES.includes(file)) {
          this.assetsCache.images.set(file, this.loadCoverImage(imagePath));
        } else {
          const compressedDataUri = await this.compressImage(imagePath);
          this.assetsCache.images.set(file, compressedDataUri);
        }
      });

      await Promise.all(compressionPromises);

      Logger.info(`✅ Static assets cache initialized: ${this.assetsCache.templates.size} templates, ${this.assetsCache.css.size} CSS files, ${this.assetsCache.images.size} images (covers full quality, others compressed)`);
    } catch (error) {
      Logger.error(`❌ Failed to initialize static assets cache: ${String(error)}`);
      // Continue execution - will fall back to reading files on demand
    }
  }

  /**
   * Load image as complete data URI from cache
   * Returns a complete data URI (data:image/...;base64,...)
   * Templates should use src="{{imageName}}" without any prefix
   */
  private getImageDataUri(imageName: string): string {
    const cached = this.assetsCache.images.get(imageName);
    if (cached) {
      // If it's already a data URI, return as-is
      if (cached.startsWith('data:')) {
        return cached;
      }
      // Legacy: plain base64 without data URI prefix
      return `data:image/png;base64,${cached}`;
    }
    
    // Fallback: read from disk if not in cache (uncompressed)
    Logger.warn(`⚠️ Image ${imageName} not in cache, reading from disk (uncompressed)`);
    const uploadsDir = path.resolve(__dirname, './uploads');
    const categoryMapping: Record<string, string> = {
      'cover.png': 'covers',
      'logo.png': 'branding',
      'building.png': 'buildings',
      'building2.png': 'buildings',
      'cold.png': 'icons',
      'heat.png': 'icons',
      'light.png': 'icons',
      'equipment.png': 'icons',
      'ecs.png': 'icons',
      'energy.png': 'icons',
      'panneau.png': 'solar',
      'pv-cover.png': 'solar',
      'bank.png': 'financial',
      'invest.png': 'financial',
    };
    
    const category = categoryMapping[imageName];
    const imagePath = category 
      ? path.join(uploadsDir, category, imageName)
      : path.resolve(__dirname, './image', imageName);
    
    if (fs.existsSync(imagePath)) {
      const base64 = fs.readFileSync(imagePath).toString('base64');
      const dataUri = `data:image/png;base64,${base64}`;
      this.assetsCache.images.set(imageName, dataUri);
      return dataUri;
    }
    
    throw new Error(`Image file not found: ${imageName}`);
  }

  /**
   * Load image as base64 from cache (for legacy templates)
   * Returns just the base64 part without data URI prefix
   * Templates use src="data:image/png;base64,{{imageName}}"
   */
  private getImageBase64(imageName: string): string {
    const dataUri = this.getImageDataUri(imageName);
    
    // Extract just the base64 part from data URI
    const match = dataUri.match(/^data:image\/[^;]+;base64,(.+)$/);
    if (match) {
      return match[1];
    }
    
    // If not a valid data URI, return as-is (probably already base64)
    return dataUri;
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }
    
    if (!this.browserPromise) {
      this.browserPromise = puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
        ],
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
      // We don't need JS for our templates (we render everything server-side).
      // Disabling it reduces overhead and avoids waiting on script execution.
      await page.setJavaScriptEnabled(false);

      // Use 'load' instead of 'networkidle0' for faster rendering
      // Since all content is already in memory (templates, CSS, images as base64),
      // we don't need to wait for network requests
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0',
          bottom: '0',
          left: '0',
          right: '0',
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
    // Ensure assets cache is ready (images compressed)
    await this.assetsCacheReady;
    
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
    const isPv = template === 'pv-bt' || template === 'pv-mt';

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

      // Contact info - from PV (Audit Solaire) simulation only (no fallback to Energetique)
      auditDate: finalSolaireDto
        ? new Date(finalSolaireDto.createdAt).toLocaleDateString('fr-FR')
        : (data ? new Date(data.createdAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')),

      fullName: finalSolaireDto?.fullName ?? '',
      companyName: finalSolaireDto?.companyName ?? '',
      email: finalSolaireDto?.email ?? '',
      phoneNumber: finalSolaireDto?.phoneNumber ?? '',
      address: finalSolaireDto?.address ?? '',
      governorate: data?.contact?.governorate ?? '', // From energy audit contact; not stored in PV simulation

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
    if (template === 'pv-bt' || template === 'pv-mt') {
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
        
        // Format without thousand separator (comma as decimal for decimals)
        const fixed = num.toFixed(decimals);
        const parts = fixed.split('.');
        const integerPart = parts[0];
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
      flattened.selfConsumedEnergy = formatNumber(pvData.selfConsumedEnergy, 0);
      flattened.gridSurplus = formatNumber(pvData.gridSurplus, 0);
      flattened.surplusRatePercent = formatNumber(pvData.surplusRatePercent, 1);
      
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
      // Annual bills and surplus revenue (year 1)
      const annualBillWithoutPVValue = pvData.annualBillWithoutPV ?? null;
      const surplusRevenueSTEGValue = pvData.surplusRevenueSTEG ?? 0;
      const annualSavingsValue = pvData.annualSavings ?? null;

      // Ensure PDF values are consistent with Eco_annuel formula:
      // Eco_annuel = F_sans - F_avec + Vente_exc
      // ⇒ F_avec = F_sans - (Eco_annuel - Vente_exc)
      let annualBillWithPVForPdf: number | null = null;
      if (annualBillWithoutPVValue !== null && annualSavingsValue !== null) {
        annualBillWithPVForPdf =
          annualBillWithoutPVValue - (annualSavingsValue - surplusRevenueSTEGValue);
      }

      flattened.annualBillWithoutPV = formatNumber(annualBillWithoutPVValue, 0);
      flattened.annualBillWithPV = formatNumber(annualBillWithPVForPdf, 0);
      flattened.surplusRevenueSTEG = formatNumber(surplusRevenueSTEGValue, 0);
      // Eco_annuel is already provided by pvData.annualSavings
      flattened.annualSavings = formatNumber(annualSavingsValue, 0);
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
      
      // CO₂ data now comes from PV economic analysis (Audit Solaire).
      // We no longer fall back to Audit Énergétique CO₂ to keep results consistent with the PV simulation UI.
    }

    // Note: monthlyEconomics would come from AuditSolaireResponseDto if available
    // For now, this is only used when PV template is used with solar audit data
    if (isPv && finalSolaireDto && 'monthlyEconomics' in finalSolaireDto) {
      const monthlyData = finalSolaireDto.monthlyEconomics;
      if (Array.isArray(monthlyData)) {
        const normalizedMonthlyData = monthlyData.slice(0, 12);

        const maxBillValue = normalizedMonthlyData.reduce((max, m) => {
          const withoutPv = typeof m.billWithoutPV === 'number' ? m.billWithoutPV : 0;
          const withPv = typeof m.billWithPV === 'number' ? m.billWithPV : 0;
          return Math.max(max, withoutPv, withPv);
        }, 0);

        // Build "nice" Y-axis ticks (no 0 label as requested)
        const tickCount = 5;
        const safeMaxBillValue = maxBillValue > 0 ? maxBillValue : 1;
        const rawStep = safeMaxBillValue / tickCount;
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const normalized = rawStep / magnitude;
        const stepBase = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
        const step = stepBase * magnitude;
        const topTick = step * tickCount;

        flattened.pvChartTick1 = topTick;
        flattened.pvChartTick2 = topTick - step;
        flattened.pvChartTick3 = topTick - step * 2;
        flattened.pvChartTick4 = topTick - step * 3;
        flattened.pvChartTick5 = topTick - step * 4;

        normalizedMonthlyData.forEach((m: MonthlyEconomicData, i: number) => {
          const withoutPv = typeof m.billWithoutPV === 'number' ? m.billWithoutPV : 0;
          const withPv = typeof m.billWithPV === 'number' ? m.billWithPV : 0;
          const savings = typeof m.monthlySavings === 'number' ? m.monthlySavings : 0;

          flattened[`pv.month.${i}.withoutPv`] = withoutPv;
          flattened[`pv.month.${i}.withPv`] = withPv;
          flattened[`pv.month.${i}.savings`] = savings;

          // Use topTick for scaling so bars match displayed Y-axis ticks
          // The chart-bars container has height: 220px with 14px top padding
          // The chart-bars-pair has height: 220px with margin-top: -14px to offset padding
          // So bars are calculated as percentage of topTick, which matches the 220px container height
          // Bars are positioned from bottom, so 0% = bottom, 100% = top
          const withoutPvPct = topTick > 0 ? (withoutPv / topTick) * 100 : 0;
          const withPvPct = topTick > 0 ? (withPv / topTick) * 100 : 0;
          // Round to 2 decimal places for precision, but ensure 0 values stay at 0
          flattened[`pv.month.${i}.withoutPvPct`] = withoutPv === 0 ? 0 : Math.round(withoutPvPct * 100) / 100;
          flattened[`pv.month.${i}.withPvPct`] = withPv === 0 ? 0 : Math.round(withPvPct * 100) / 100;
          // Keep the element so the label "0" is still visible, but make the bar itself visually hidden.
          flattened[`pv.month.${i}.withoutPvZeroClass`] = withoutPv === 0 ? 'pv-bar-zero' : '';
          flattened[`pv.month.${i}.withPvZeroClass`] = withPv === 0 ? 'pv-bar-zero' : '';
        });
      }

      // Calculate cumulative gains vs CAPEX chart data
      if (isPv && finalSolaireDto && 'annualEconomics' in finalSolaireDto && Array.isArray(finalSolaireDto.annualEconomics)) {
        const annualData = finalSolaireDto.annualEconomics.slice(0, 25); // All 25 years
        const reportData = isPv && finalSolaireDto
          ? buildPvReportDataFromSolaire(finalSolaireDto, auditDto ?? undefined)
          : null;
        const capex = (reportData as PvReportData)?.capexTotal ?? 0;
        
        if (annualData.length > 0) {
          // Calculate max and min values
          const maxGain = Math.max(...annualData.map(e => e.cumulativeNetGain || 0));
          const minGain = Math.min(...annualData.map(e => e.cumulativeNetGain || 0));
          const maxValue = Math.max(maxGain, capex);
          const minValue = Math.min(minGain, capex);
          
          // Calculate "nice" ticks for Y-axis (5 intervals: 0%, 20%, 40%, 60%, 80%, 100%)
          const tickCount = 5;
          const range = maxValue - minValue;
          const safeRange = Number.isFinite(range) && range > 0 ? range : 1;
          const rawStep = safeRange / tickCount;
          const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
          const normalized = rawStep / magnitude;
          let stepBase;
          if (normalized <= 1) stepBase = 1;
          else if (normalized <= 2) stepBase = 2;
          else if (normalized <= 5) stepBase = 5;
          else stepBase = 10;
          const step = stepBase * magnitude;
          
          // Round min and max to nice values
          const roundedMin = Math.floor(minValue / step) * step;
          const roundedMax = Math.ceil(maxValue / step) * step;
          const actualRange = roundedMax - roundedMin;
          const actualStep = actualRange / tickCount;
          
          // Generate ticks from bottom to top (ascending: min to max)
          const ticksAscending = Array.from({ length: tickCount + 1 }, (_, i) => roundedMin + i * actualStep);
          
          // Reverse to get descending order (max to min) for display (top to bottom in chart)
          const ticks = ticksAscending.reverse();
          
          flattened.lineChartMaxValue = Math.round(roundedMax);
          flattened.lineChartMinValue = Math.round(roundedMin);
          flattened.lineChartCapex = capex;
          
          // Store Y-axis ticks for template (already in descending order: max at top, min at bottom)
          // 6 ticks total: 0%, 20%, 40%, 60%, 80%, 100%
          flattened.lineChartTick1 = Math.round(ticks[0]);  // Top (100% from bottom = max value)
          flattened.lineChartTick2 = Math.round(ticks[1]);  // 80%
          flattened.lineChartTick3 = Math.round(ticks[2]);  // 60%
          flattened.lineChartTick4 = Math.round(ticks[3]);  // 40%
          flattened.lineChartTick5 = Math.round(ticks[4]);  // 20%
          flattened.lineChartTick6 = Math.round(ticks[5]);  // Bottom (0% from bottom = min value)
          
          // Calculate line points for gains and CAPEX using rounded min/max
          const gainsPoints: string[] = [];
          const capexPoints: string[] = [];
          const gainsPointsArray: Array<{x: number, y: number}> = [];
          const capexPointsArray: Array<{x: number, y: number}> = [];
          
          annualData.forEach((yearData, index) => {
            const value = yearData.cumulativeNetGain || 0;
            const x = annualData.length > 1 ? (index / (annualData.length - 1)) * 1000 : 500;
            const y = 400 - ((value - roundedMin) / actualRange) * 400;
            gainsPoints.push(`${x.toFixed(2)},${y.toFixed(2)}`);
            gainsPointsArray.push({ x, y });
            
            const capexY = 400 - ((capex - roundedMin) / actualRange) * 400;
            capexPoints.push(`${x.toFixed(2)},${capexY.toFixed(2)}`);
            capexPointsArray.push({ x, y: capexY });
          });
          
          flattened.lineChartGainsPoints = gainsPoints.join(' ');
          flattened.lineChartCapexPoints = capexPoints.join(' ');
          
          // Store individual points for circles (generate HTML directly for template)
          // Generate gains circles HTML
          const gainsCirclesHTML = gainsPointsArray.map((p) => 
            `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="4" fill="rgba(59, 130, 246, 0.8)"/>`
          ).join('\n              ');
          
          // Generate CAPEX circles HTML
          const capexCirclesHTML = capexPointsArray.map((p) => 
            `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="4" fill="rgba(249, 115, 22, 0.9)"/>`
          ).join('\n              ');
          
          flattened.lineChartGainsCirclesHTML = gainsCirclesHTML;
          flattened.lineChartCapexCirclesHTML = capexCirclesHTML;
          flattened.lineChartYears = annualData.map(e => e.year).join(',');
          flattened.lineChartMinValueNegative = roundedMin < 0;

          // Calculate intersection point (where cumulative gains = CAPEX)
          let intersectionYear: number | null = null;
          let intersectionX: number | null = null;
          let intersectionY: number | null = null;
          
          for (let i = 0; i < annualData.length - 1; i++) {
            const currentGain = annualData[i].cumulativeNetGain || 0;
            const nextGain = annualData[i + 1].cumulativeNetGain || 0;
            
            // Check if CAPEX is between current and next year
            if (currentGain <= capex && nextGain >= capex) {
              // Linear interpolation to find exact intersection
              const year1 = annualData[i].year;
              const year2 = annualData[i + 1].year;
              const ratio = (capex - currentGain) / (nextGain - currentGain);
              intersectionYear = year1 + (year2 - year1) * ratio;
              
              intersectionX = annualData.length > 1 ? ((i + ratio) / (annualData.length - 1)) * 1000 : 500;
              intersectionY = 400 - ((capex - roundedMin) / actualRange) * 400;
              
              break;
            }
          }

          const formatPaybackYearsAndMonths = (yearDecimal: number): string => {
            const totalMonths = Math.round(yearDecimal * 12);
            if (totalMonths <= 0) return '0 mois';
            const years = Math.floor(totalMonths / 12);
            const remainingMonths = totalMonths % 12;
            if (years === 0) return `${remainingMonths} mois`;
            if (remainingMonths === 0) return `${years} an${years > 1 ? 's' : ''}`;
            return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
          };
          const intersectionYearText = intersectionYear !== null ? formatPaybackYearsAndMonths(intersectionYear) : '';
          flattened.lineChartIntersectionYear = intersectionYearText;
          flattened.lineChartIntersectionX = intersectionX !== null ? intersectionX.toFixed(2) : '';
          flattened.lineChartIntersectionY = intersectionY !== null ? intersectionY.toFixed(2) : '';
          flattened.lineChartIntersectionCapex = Math.round(capex);
          flattened.lineChartHasIntersection = intersectionYear !== null ? 'true' : 'false';
          
          // Calculate bubble width based on text length (approx 7px per char + 30px padding)
          const calculateBubbleWidth = (text: string): number => {
            const charWidth = 7; // Approximate width per character for 14px bold font
            const padding = 30; // 15px padding on each side
            return Math.max(80, text.length * charWidth + padding);
          };
          
          const intersectionBubbleWidth = calculateBubbleWidth(intersectionYearText);
          flattened.lineChartIntersectionBubbleWidth = intersectionBubbleWidth;
          flattened.lineChartIntersectionBubbleX = intersectionX !== null ? (intersectionX - intersectionBubbleWidth / 2).toFixed(2) : '';
          
          // Calculate final value (year 25)
          const year25Index = Math.min(24, annualData.length - 1);
          const finalGain = annualData[year25Index]?.cumulativeNetGain || 0;
          const finalX = annualData.length > 1 ? (year25Index / (annualData.length - 1)) * 1000 : 500;
          const finalY = 400 - ((finalGain - roundedMin) / actualRange) * 400;
          
          // Format final gain without thousand separator
          const formatNumberWithSpaces = (num: number): string => {
            return Math.round(num).toString();
          };
          
          flattened.lineChartFinalGain = formatNumberWithSpaces(finalGain);
          flattened.lineChartFinalX = finalX.toFixed(2);
          flattened.lineChartFinalY = finalY.toFixed(2);
          
          // Calculate bubble width for final gains
          const finalGainText = formatNumberWithSpaces(finalGain) + ' DT';
          const finalGainBubbleWidth = calculateBubbleWidth(finalGainText);
          flattened.lineChartFinalBubbleWidth = finalGainBubbleWidth;
          
          // Calculate leader line and bubble positions (matching frontend)
          flattened.lineChartFinalXMinus95 = (finalX - 95).toFixed(2);
          flattened.lineChartFinalYPlus50 = (finalY + 50).toFixed(2);
          flattened.lineChartFinalBubbleX = (finalX - 210 - (finalGainBubbleWidth - 180) / 2).toFixed(2);
          flattened.lineChartFinalYPlus20 = (finalY + 20).toFixed(2);
          flattened.lineChartFinalTextX = (
            (finalX - 210 - (finalGainBubbleWidth - 180) / 2) + finalGainBubbleWidth / 2
          ).toFixed(2);
          flattened.lineChartFinalYPlus46 = (finalY + 46).toFixed(2);
          
          flattened.lineChartHasFinal = finalGain > 0 ? 'true' : 'false';
          
          // Calculate final CAPEX value (constant, same as initial)
          const finalCapexX = annualData.length > 1 ? (year25Index / (annualData.length - 1)) * 1000 : 500;
          const finalCapexY = 400 - ((capex - roundedMin) / actualRange) * 400;
          
          flattened.lineChartFinalCapex = formatNumberWithSpaces(capex);
          flattened.lineChartFinalCapexX = finalCapexX.toFixed(2);
          flattened.lineChartFinalCapexY = finalCapexY.toFixed(2);
          
          // Calculate bubble width for final CAPEX
          const finalCapexText = formatNumberWithSpaces(capex) + ' DT';
          const finalCapexBubbleWidth = calculateBubbleWidth(finalCapexText);
          flattened.lineChartFinalCapexBubbleWidth = finalCapexBubbleWidth;
          
          // Calculate leader line and bubble positions for CAPEX (matching frontend)
          flattened.lineChartFinalCapexXMinus95 = (finalCapexX - 95).toFixed(2);
          flattened.lineChartFinalCapexYMinus28 = (finalCapexY - 28).toFixed(2);
          flattened.lineChartFinalCapexBubbleX = (finalCapexX - 210 - (finalCapexBubbleWidth - 180) / 2).toFixed(2);
          flattened.lineChartFinalCapexYMinus50 = (finalCapexY - 50).toFixed(2);
          flattened.lineChartFinalCapexTextX = (
            (finalCapexX - 210 - (finalCapexBubbleWidth - 180) / 2) + finalCapexBubbleWidth / 2
          ).toFixed(2);
          flattened.lineChartFinalCapexYMinus24 = (finalCapexY - 24).toFixed(2);
          
          flattened.lineChartHasFinalCapex = capex > 0 ? 'true' : 'false';

          // Precompute display styles so the PDF template doesn't need JS.
          // (renderHTML does simple {{var}} replacement only)
          flattened.lineChartIntersectionDisplay = intersectionYear !== null ? 'block' : 'none';
          flattened.lineChartFinalDisplay = finalGain > 0 ? 'block' : 'none';
          flattened.lineChartFinalCapexDisplay = capex > 0 ? 'block' : 'none';
        }
      }
    }

    /* ===============================
       RENDER HTML & GENERATE PDF
    =============================== */
    html = this.renderHTML(html, flattened);
    const pdfBuffer = await this.generatePDFFromHTML(html);
    
    const sizeKB = (pdfBuffer.length / 1024).toFixed(1);
    const sizeMB = (pdfBuffer.length / 1024 / 1024).toFixed(2);
    Logger.info(`📄 PDF generated: ${sizeKB} KB (${sizeMB} MB) - template: ${template}`);

    // Save to cloud storage (or fallback) WITHOUT blocking the response.
    // This is often the slowest step (network upload). We run it in the background.
    try {
      const filePrefix = (template === 'pv-bt' || template === 'pv-mt') ? 'PV' : 'Audit';
      const fileName = data
        ? `${data.contact.companyName || data.contact.fullName || 'Client'}`
        : (finalSolaireDto ? 'Client' : 'Unknown');
      const originalFileName = `${filePrefix}_${fileName}.pdf`;
      const fileType = (template === 'pv-bt' || template === 'pv-mt') ? FileType.PDF_PV_REPORT : FileType.PDF_AUDIT_REPORT;

      const simulationId = auditDto?.data?.simulationId
        ?? (dto as AuditEnergetiqueResponseDto)?.data?.simulationId
        ?? finalSolaireDto?.id;

      const metadata: IFile['metadata'] = {
        simulationId,
        simulationType: (template === 'pv-bt' || template === 'pv-mt')
          ? (finalSolaireDto ? AuditSimulationTypes.AUDIT_SOLAIRE : AuditSimulationTypes.AUDIT_ENERGETIQUE)
          : AuditSimulationTypes.AUDIT_ENERGETIQUE,
        companyName: data?.contact?.companyName || data?.contact?.fullName || undefined,
      };

      void this.fileService.uploadAndSaveFile(
        pdfBuffer,
        originalFileName,
        fileType,
        metadata
      ).catch((error) => {
        Logger.error(`⚠️ Failed to save PDF: ${String(error)}`);
      });
    } catch (error) {
      Logger.error(`⚠️ Failed to schedule PDF save: ${String(error)}`);
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
