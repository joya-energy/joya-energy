import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { AuditEnergetiqueResponseDto } from './dto/audit-energetique-response.dto';
import { AuditSolaireResponseDto } from '../audit-solaire/dto/audit-solaire-response.dto';
import { buildPvReportData, buildPvReportDataFromSolaire, type PvReportData } from './pv-report.builder';
import { AuditReportBuilder } from './audit-report.builder';



/* ======================================================
   RECOMMENDATION ENGINE
====================================================== */

type PDFInputDto =
  | AuditEnergetiqueResponseDto
  | AuditSolaireResponseDto;



type BuildingCategory =
  | 'Catégorie1'
  | 'Catégorie2'
  | 'Catégorie3'
  | 'Catégorie4'
    'Inconnue';

function getBuildingCategory(buildingType: string): BuildingCategory {
  const Catégorie1 = ['Pharmacie', 'Café','Restaurant', 'Centre esthétique' ,'Spa', 'Hôtel' ,
'Maison d’hôtes', 'Clinique' ,'Centre médical', 'Bureau' , 'Administration' ,'Banque', 'École','Centre de formation'];

  const Catégorie2 = [ 'Atelier léger' ,'Artisanat' , 'Menuiserie', 'Industrie textile' ,'Emballage'];

  const Catégorie3 = [ 'Usine lourde / Mécanique / Métallurgie', 'Industrie plastique /Injection'];

  const Catégorie4 = [ 'Industrie alimentaire', 'Industrie agroalimentaire réfrigérée'];

  if (Catégorie1.includes(buildingType)) return 'Catégorie1';
  if (Catégorie2.includes(buildingType)) return 'Catégorie2';
  if (Catégorie3.includes(buildingType)) return 'Catégorie3';
  if (Catégorie4.includes(buildingType)) return 'Catégorie4';

  return 'Catégorie1';
}

function getRecommendationsHTML(buildingType: string): string {
  const category = getBuildingCategory(buildingType);

  const tableHeader = `
    <table class="reco-table">
      <thead>
        <tr>
          <th>Action recommandée</th>
          <th>Poste concerné</th>
          <th>Gain potentiel estimé</th>
        </tr>
      </thead>
      <tbody>
  `;

  const tableFooter = `
      </tbody>
    </table>
  `;

  switch (category) {
    case 'Catégorie1':
      return `
        ${tableHeader}
        <tr>
          <td>Optimisation de la climatisation (HVAC)</td>
          <td>Climatisation</td>
          <td>–10 % à –20 %</td>
        </tr>
        <tr>
          <td>Éclairage LED et gestion automatisée</td>
          <td>Éclairage</td>
          <td>–10 % à –25 %</td>
        </tr>
        <tr>
          <td>Gestion des horaires d’occupation</td>
          <td>Usage global</td>
          <td>–5 % à –15 %</td>
        </tr>
        <tr>
          <td>Optimisation de la production d’ECS</td>
          <td>Eau chaude sanitaire</td>
          <td>–5 % à –20 %</td>
        </tr>
        <tr>
          <td>Maintenance énergétique préventive</td>
          <td>Systèmes énergétiques</td>
          <td>–5 % à –10 %</td>
        </tr>
        ${tableFooter}
      `;

    case 'Catégorie2':
      return `
        ${tableHeader}
        <tr>
          <td>Éclairage industriel LED</td>
          <td>Éclairage</td>
          <td>–10 % à –20 %</td>
        </tr>
        <tr>
          <td>Variateurs de vitesse sur moteurs / ventilateurs</td>
          <td>Moteurs / Ventilation</td>
          <td>–10 % à –25 %</td>
        </tr>
        <tr>
          <td>Optimisation des compresseurs d’air</td>
          <td>Air comprimé</td>
          <td>–10 % à –20 %</td>
        </tr>
        <tr>
          <td>Réduction des fuites d’air comprimé</td>
          <td>Air comprimé</td>
          <td>–10 % à –30 %</td>
        </tr>
        <tr>
          <td>Optimisation des cycles de production</td>
          <td>Process</td>
          <td>–5 % à –15 %</td>
        </tr>
        ${tableFooter}
      `;

    case 'Catégorie3':
      return `
        ${tableHeader}
        <tr>
          <td>Optimisation des moteurs et équipements process</td>
          <td>Process industriel</td>
          <td>–10 % à –20 %</td>
        </tr>
        <tr>
          <td>Variateurs sur compresseurs et pompes</td>
          <td>Pompage / Compression</td>
          <td>–10 % à –25 %</td>
        </tr>
        <tr>
          <td>Optimisation des systèmes pneumatiques</td>
          <td>Systèmes pneumatiques</td>
          <td>–10 % à –30 %</td>
        </tr>
        <tr>
          <td>Modernisation de l’éclairage industriel</td>
          <td>Éclairage</td>
          <td>–10 % à –15 %</td>
        </tr>
        <tr>
          <td>Monitoring énergétique industriel</td>
          <td>Suivi énergétique</td>
          <td>–10 % à –20 %</td>
        </tr>
        ${tableFooter}
      `;

    case 'Catégorie4':
      return `
        ${tableHeader}
        <tr>
          <td>Optimisation des chambres froides (isolation / étanchéité)</td>
          <td>Froid</td>
          <td>–10 % à –25 %</td>
        </tr>
        <tr>
          <td>Amélioration du rendement des groupes froid</td>
          <td>Production de froid</td>
          <td>–15 % à –35 %</td>
        </tr>
        <tr>
          <td>Variateurs sur compresseurs et ventilateurs</td>
          <td>Ventilation / Froid</td>
          <td>–10 % à –25 %</td>
        </tr>
        <tr>
          <td>Maintenance préventive du système de froid</td>
          <td>Systèmes frigorifiques</td>
          <td>–5 % à –15 %</td>
        </tr>
        <tr>
          <td>Optimisation de l’éclairage en zone froide</td>
          <td>Éclairage</td>
          <td>–5 % à –10 %</td>
        </tr>
        ${tableFooter}
      `;

    default:
      return `
        ${tableHeader}
        <tr>
          <td>Audit énergétique approfondi requis</td>
          <td>Global</td>
          <td>À définir</td>
        </tr>
        <tr>
          <td>Analyse spécifique du type de bâtiment</td>
          <td>Global</td>
          <td>À définir</td>
        </tr>
        ${tableFooter}
      `;
  }
}


/* ======================================================
   PDF SERVICE
====================================================== */
export type PDFTemplateType = 'audit' | 'pv';


export class AuditPDFService {
  async generatePDF(
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
       LOAD TEMPLATE
    =============================== */

const templateDir = path.resolve(__dirname, `./template/${template}`);

const templatePath = path.join(templateDir, 'template.html');
const cssPath = path.join(templateDir, 'style.css');
const bootstrapPath = path.join(templateDir, 'bootstrap.min.css');

let html = fs.readFileSync(templatePath, 'utf8');

const bootstrapCSS = fs.readFileSync(bootstrapPath, 'utf8');
const customCSS = fs.readFileSync(cssPath, 'utf8');

html = html.replace('{{INLINE_CSS}}', `${bootstrapCSS}\n${customCSS}`);

    /* ===============================
       LOAD IMAGES
    =============================== */
    const heroImageBase64 = fs
      .readFileSync(path.resolve(__dirname, './image/cover.png'))
      .toString('base64');

    const joyaLogoBase64 = fs
      .readFileSync(path.resolve(__dirname, './image/logo.png'))
      .toString('base64');

const buildingImageBase64 = fs
  .readFileSync(path.resolve(__dirname,'./image/building.png' ))
  .toString('base64');

  const iconACBase64 = fs
  .readFileSync(path.resolve(__dirname, './image/cold.png'))
  .toString('base64');

const iconHeatingBase64 = fs
  .readFileSync(path.resolve(__dirname, './image/heat.png'))
  .toString('base64');

const iconLightBase64 = fs
  .readFileSync(path.resolve(__dirname, './image/light.png'))
  .toString('base64');

const iconEquipmentBase64 = fs
  .readFileSync(path.resolve(__dirname, './image/equipment.png'))
  .toString('base64');

const iconECSBase64 = fs
  .readFileSync(path.resolve(__dirname, './image/ecs.png'))
  .toString('base64');

const energyIconBase64 = fs
  .readFileSync(path.resolve(__dirname, './image/energy.png') )
  .toString('base64');

  const building2IconBase64 = fs
  .readFileSync(path.resolve(__dirname, './image/building2.png'))
  .toString('base64');

    const panneauIconBase64 = fs
  .readFileSync( path.resolve(__dirname, './image/panneau.png'))
  .toString('base64');

      const bankIconBase64 = fs
  .readFileSync(path.resolve(__dirname, './image/bank.png'))
  .toString('base64');

        const investIconBase64 = fs
  .readFileSync(path.resolve(__dirname, './image/invest.png'))
  .toString('base64');


          const pvcoverBase64 = fs
  .readFileSync(path.resolve(__dirname, './image/pv-cover.png'))
  .toString('base64');



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

const classes = energyScale
  .map(
    c => `
    <div class="energy-row-wrapper">
      <div class="energy-row ${c.label === energyClass ? 'active' : ''}"
           style="background:${c.color}; width:${c.width}%;">
        ${c.label}
      </div>
    </div>
  `
  )
  .join('');


    const co2Scale = [
      { label: 'A', color: '#b0e3ff' ,width: 40 },
      { label: 'B', color: '#99c9f3' ,width: 46 },
      { label: 'C', color: '#7aaed4' ,width: 52 },
      { label: 'D', color: '#5f93b5' ,width: 60 },
      { label: 'E', color: '#466f95' ,width: 68 },

    ];

    const carbonClass = auditDto?.data?.results?.carbonClassification?.class ?? 'N/A';
          const co2Classes = co2Scale
  .map(
    c => `
      <div class="co2-bar ${c.label === carbonClass ? 'active' : ''}"
           style="background:${c.color}; width:${c.width}%;">
        ${c.label}
      </div>`
  )
  .join('');


    // For PV template, use the explicitly passed solaireDto or detect from dto
    // Prefer the explicitly passed DTO over type detection
    const finalSolaireDto = pvDtoParam ?? (isPv && ('installedPower' in dto || 'systemSize_kWp' in dto || 'expectedProduction' in dto) ? dto as AuditSolaireResponseDto : null);
    
    
    const reportData = isAudit && auditDto
      ? AuditReportBuilder.build(auditDto)
      : isPv && finalSolaireDto
        ? buildPvReportDataFromSolaire(finalSolaireDto, auditDto ?? undefined)
        : isPv && auditDto
          ? buildPvReportData(auditDto)
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

    const flattened: Record<string, string | number | boolean> = {
     studyDuration: 25,
     pvDegradation: 0.4,
     stegInflation: 7,
     discountRate: 8,

     
     // ---- END USES (FLAT KEYS FOR TEMPLATE) ----
'endUses.cooling.consumptionKwh': endUses?.cooling.consumptionKwh ?? 0,
'endUses.cooling.costTnd': endUses?.cooling.costTnd ?? 0,
'endUses.cooling.sharePercent': endUses?.cooling.sharePercent ?? 0,

'endUses.heating.consumptionKwh': endUses?.heating.consumptionKwh ?? 0,
'endUses.heating.costTnd': endUses?.heating.costTnd ?? 0,
'endUses.heating.sharePercent': endUses?.heating.sharePercent ?? 0,

'endUses.lighting.consumptionKwh': endUses?.lighting.consumptionKwh ?? 0,
'endUses.lighting.costTnd': endUses?.lighting.costTnd ?? 0,
'endUses.lighting.sharePercent': endUses?.lighting.sharePercent ?? 0,

'endUses.equipment.consumptionKwh': endUses?.equipment.consumptionKwh ?? 0,
'endUses.equipment.costTnd': endUses?.equipment.costTnd ?? 0,
'endUses.equipment.sharePercent': endUses?.equipment.sharePercent ?? 0,

'endUses.ecs.consumptionKwh': endUses?.ecs.consumptionKwh ?? 0,
'endUses.ecs.costTnd': endUses?.ecs.costTnd ?? 0,
'endUses.ecs.sharePercent': endUses?.ecs.sharePercent ?? 0,



     pvcoverBase64,
      investIconBase64,
      bankIconBase64,
      panneauIconBase64,
      heroImageBase64,
      joyaLogoBase64,
      buildingImageBase64,
      iconACBase64,
      iconHeatingBase64,
      iconLightBase64,
      iconEquipmentBase64,
      iconECSBase64,
      energyIconBase64,
      building2IconBase64,
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
      annualCost: data?.results?.energyCost?.annual?.value ?? 0,

      recommendationsHTML: getRecommendationsHTML(data?.building.type ?? finalSolaireDto?.buildingType ?? ''),
    };

    // Format co2Emissions for {{co2Emissions}} placeholder in audit template (kgCO₂/m²/an)
    // Format with 2 decimals using French format (comma as decimal separator): e.g., 26,78
    const co2PerM2Raw = data?.results?.co2Emissions?.perSquareMeter?.value ?? 0;
    if (co2PerM2Raw > 0) {
      const formatted = co2PerM2Raw.toFixed(2).replace('.', ',');
      flattened.co2Emissions = formatted;
    } else {
      flattened.co2Emissions = '0,00';
    }


    // ===============================
// MERGE PV REPORT DATA (ONLY FOR PV TEMPLATE)
// ===============================
if (template === 'pv') {
  // Format numbers for display (without locale formatting to avoid space issues)
  const formatNumber = (n: number | string | undefined, decimals = 2): string => {
    const num = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
    if (!Number.isFinite(num) || num === 0) {
      // Return "0" for zero values, but keep decimals for display
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
  flattened.gainDiscounted = formatNumber(pvData.gainDiscounted ?? 0, 0);
  flattened.cashflowCumulated = formatNumber(pvData.cashflowCumulated ?? 0, 0);
  flattened.cashflowDiscounted = formatNumber(pvData.cashflowDiscounted ?? 0, 0);
  
  // Ensure all PV fields are properly formatted and override with formatted values
  flattened.pvPower = formatNumber(pvData.pvPower ?? 0, 2);
  flattened.pvYield = formatNumber(pvData.pvYield ?? 0, 0);
  flattened.pvProductionYear1 = formatNumber(pvData.pvProductionYear1 ?? 0, 0);
  flattened.coverageRate = formatNumber(pvData.coverageRate ?? 0, 1);
  
  // Use actual values from PV data (these should be calculated correctly)
  flattened.consumptionWithoutPV = formatNumber(pvData.consumptionWithoutPV ?? 0, 0);
  flattened.consumptionWithPV = formatNumber(pvData.consumptionWithPV ?? 0, 0);
  flattened.avgPriceWithoutPV = formatNumber(pvData.avgPriceWithoutPV ?? 0, 3);
  flattened.avgPriceWithoutPV_mDt = formatNumber(pvData.avgPriceWithoutPV_mDt ?? 0, 0);
  flattened.avgPriceWithPV = formatNumber(pvData.avgPriceWithPV ?? 0, 3);
  flattened.avgPriceWithPV_mDt = formatNumber(pvData.avgPriceWithPV_mDt ?? 0, 0);
  flattened.annualSavings = formatNumber(pvData.annualSavings ?? 0, 0);
  flattened.gainCumulated = formatNumber(pvData.gainCumulated ?? 0, 0);
  flattened.npv = formatNumber(pvData.npv ?? 0, 0);
  flattened.paybackSimple = formatNumber(pvData.paybackSimple ?? 0, 2);
  flattened.paybackDiscounted = formatNumber(pvData.paybackDiscounted ?? 0, 2);
  flattened.irr = formatNumber(pvData.irr ?? 0, 2);
  flattened.roi = formatNumber(pvData.roi ?? 0, 2);
  flattened.co2PerYear = formatNumber(pvData.co2PerYear ?? 0, 2);
  flattened.co2Total = formatNumber(pvData.co2Total ?? 0, 0);
  
  // Format annual consumption for PV template
  // Use Solaire annualConsumption if available, otherwise Energetique
  const annualConsumptionValue = finalSolaireDto?.annualConsumption ?? 
    (data?.results?.energyConsumption?.annual?.value ?? 0);
  flattened.annualConsumption = formatNumber(annualConsumptionValue, 0);
  
  // Use actual CO2 data from audit if PV data doesn't have it or is zero
  const co2TonsFromAudit = data?.results?.co2Emissions?.annual?.tons ?? 0;
  if (!pvData.co2PerYear || pvData.co2PerYear === 0) {
    flattened.co2PerYear = formatNumber(co2TonsFromAudit, 2);
  }
  if (!pvData.co2Total || pvData.co2Total === 0) {
    const studyDuration = typeof flattened.studyDuration === 'number' ? flattened.studyDuration : 25;
    flattened.co2Total = formatNumber(co2TonsFromAudit * studyDuration, 0);
  }
  
  // Ensure co2Emissions is formatted for audit template (kgCO₂/m²/an)
  // This is the same as co2PerM2 but needs to be explicitly set for the {{co2Emissions}} placeholder
  const co2PerM2Value = data?.results?.co2Emissions?.perSquareMeter?.value ?? 0;
  if (co2PerM2Value > 0) {
    const formatted = co2PerM2Value.toFixed(2).replace('.', ',');
    flattened.co2Emissions = formatted;
  } else {
    flattened.co2Emissions = '0,00';
  }
}


// Note: monthlyEconomics would come from AuditSolaireResponseDto if available
// For now, this is only used when PV template is used with solar audit data
if (isPv && finalSolaireDto && 'monthlyEconomics' in finalSolaireDto) {
  const monthlyData = (finalSolaireDto as any).monthlyEconomics;
  if (Array.isArray(monthlyData)) {
    monthlyData.forEach((m: any, i: number) => {
      flattened[`pv.month.${i}.withoutPv`] = m.billWithoutPV ?? 0;
      flattened[`pv.month.${i}.withPv`] = m.billWithPV ?? 0;
      flattened[`pv.month.${i}.savings`] = m.monthlySavings ?? 0;
    });
  }
}


    Object.entries(flattened).forEach(([key, value]) => {
      html = html.replace(
        new RegExp(`{{${key}}}`, 'g'),
        String(value ?? '')
      );
    });

    /* ===============================
       GENERATE PDF
    =============================== */
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
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

    await browser.close();

    /* ===============================
       SAVE LOCALLY (DEBUG)
    =============================== */
    const outputDir = path.resolve(process.cwd(), 'exports');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

 const filePrefix = template === 'pv' ? 'PV' : 'Audit';

const fileName = data 
  ? `${data.contact.companyName || data.contact.fullName}`
  : (finalSolaireDto ? 'Client' : 'Unknown');
const filePath = path.join(
  outputDir,
  `${filePrefix}_${fileName}_${Date.now()}.pdf`
);


    fs.writeFileSync(filePath, pdf);

    return Buffer.from(pdf);
  }
}

export const auditPDFService = new AuditPDFService();
