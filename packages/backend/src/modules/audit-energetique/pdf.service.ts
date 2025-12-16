import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { AuditEnergetiqueResponseDto } from './dto/audit-energetique-response.dto';

/* ======================================================
   RECOMMENDATION ENGINE
====================================================== */

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

export class AuditPDFService {
  async generatePDF(dto: AuditEnergetiqueResponseDto): Promise<Buffer> {
    /* ===============================
       LOAD TEMPLATE
    =============================== */
    const templatePath = path.resolve(__dirname, './template/template.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    /* ===============================
       LOAD CSS (BOOTSTRAP + CUSTOM)
    =============================== */
    const bootstrapCSS = fs.readFileSync(
      path.resolve(__dirname, './template/bootstrap.min.css'),
      'utf8'
    );
    const customCSS = fs.readFileSync(
      path.resolve(__dirname, './template/style.css'),
      'utf8'
    );

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
  .readFileSync(
    path.resolve(
      __dirname,
      './image/building.png'
    )
  )
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
  .readFileSync(
    path.resolve(__dirname, './image/energy.png')
  )
  .toString('base64');


  const building2IconBase64 = fs
  .readFileSync(
    path.resolve(__dirname, './image/building2.png')
  )
  .toString('base64');


    /* ===============================
       ENERGY & CO₂ SCALES
    =============================== */
    const energyScale = [
      { label: 'A', color: '#008000' },
      { label: 'B', color: '#4CAF50' },
      { label: 'C', color: '#CDDC39' },
      { label: 'D', color: '#FFC107' },
      { label: 'E', color: '#FF9800' },
      { label: 'F', color: '#FF5722' },
      { label: 'G', color: '#B71C1C' },
    ];

    const energyClass =
      dto.data.results.energyClassification?.class ?? 'N/A';

    const classes = energyScale
      .map(
        c => `
        <div class="energy-bar ${c.label === energyClass ? 'active' : ''}"
             style="background:${c.color}">
          ${c.label}
        </div>`
      )
      .join('');

    const co2Scale = [
      { label: 'A', color: '#b0e3ff' },
      { label: 'B', color: '#99c9f3' },
      { label: 'C', color: '#7aaed4' },
      { label: 'D', color: '#5f93b5' },
      { label: 'E', color: '#466f95' },
      { label: 'F', color: '#2e4c76' },
      { label: 'G', color: '#1b2f4f' },
    ];

    const co2Classes = co2Scale
      .map(
        c => `
        <div class="co2-bar ${c.label === energyClass ? 'active' : ''}"
             style="background:${c.color}">
          ${c.label}
        </div>`
      )
      .join('');

    /* ===============================
       FLATTEN DTO → TEMPLATE
    =============================== */
    const data = dto.data;

    const flattened: Record<string, string | number> = {
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

      auditDate: new Date(data.createdAt).toLocaleDateString('fr-FR'),

      firstName: data.contact.firstName,
      lastName: data.contact.lastName,
      companyName: data.contact.companyName,
      email: data.contact.email,
      phoneNumber: data.contact.phoneNumber,
      address: data.contact.address,
      governorate: data.contact.governorate,


      heating: data.systems.heating,
      cooling: data.systems.cooling,
      ventilation: data.envelope.ventilation,
      domesticHotWater: data.systems.domesticHotWater,
      glazingType: data.envelope.glazingType,


 



      buildingType: data.building.type,
      surfaceArea: data.building.surfaceArea,
      floors: data.building.floors,
      activityType: data.building.activityType,

      climateZone: data.envelope.climateZone,

      tariffType: data.billing.tariffType,
      monthlyBillAmount: data.billing.monthlyBillAmount,
      contractedPower: data.billing.contractedPower ?? '',

      energyClass,
      becth: data.results.energyClassification?.becth ?? '',
      annualConsumption: data.results.energyConsumption.annual.value,
      consumptionPerM2: data.results.energyConsumption.perSquareMeter.value,
      co2PerM2: data.results.co2Emissions.perSquareMeter.value,
      annualCost: data.results.energyCost.annual.value,

      recommendationsHTML: getRecommendationsHTML(data.building.type),
    };

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

    const filePath = path.join(
      outputDir,
      `Audit_${data.contact.firstName}_${Date.now()}.pdf`
    );

    fs.writeFileSync(filePath, pdf);
    console.log('✅ PDF saved:', filePath);

    return Buffer.from(pdf);
  }
}

export const auditPDFService = new AuditPDFService();
