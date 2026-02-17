import asyncRouter from 'express-promise-router';
import { auditSolaireSimulationController } from './audit-solaire.controller';

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateAuditSolaireInput:
 *       type: object
 *       required:
 *         - address
 *         - buildingType
 *         - climateZone
 *         - measuredAmount
 *         - referenceMonth
 *       properties:
 *         address:
 *           type: string
 *           description: Building address for geocoding
 *           example: "123 Avenue Habib Bourguiba, Tunis"
 *         surfaceArea:
 *           type: number
 *           description: Conditioned surface area in m²
 *           example: 120
 *         buildingType:
 *           type: string
 *           enum: ['Café / Restaurant', 'Centre esthétique / Spa', 'Hôtel / Maison d’hôtes', 'Clinique / Centre médical', 'Bureau / Administration / Banque', 'Atelier léger / Artisanat / Menuiserie', 'Usine lourde / Mécanique / Métallurgie', 'Industrie textile / Emballage', 'Industrie alimentaire', 'Industrie plastique / Injection', 'Industrie agroalimentaire réfrigérée', 'École / Centre de formation', 'Service Tertiaire']
 *           example: "Bureau / Administration / Banque"
 *         climateZone:
 *           type: string
 *           enum: ['Nord', 'Centre', 'Sud']
 *           example: "Nord"
 *         measuredAmountTnd:
 *           type: number
 *           description: Monthly electricity bill amount (TND). Can be extracted from bill or entered manually.
 *           example: 234
 *         referenceMonth:
 *           type: integer
 *           description: Month of the measured consumption (1-12). Can be extracted from bill or entered manually.
 *           minimum: 1
 *           maximum: 12
 *           example: 7
 *         tariffTension:
 *           type: string
 *           enum: [BT, MT]
 *           description: Tariff tension (BT = Basse Tension, MT = Moyenne Tension). Can be extracted from bill or entered manually. Defaults to BT if not provided.
 *           example: "BT"
 *         latitude:
 *           type: number
 *           description: Optional latitude (will be geocoded if not provided)
 *         longitude:
 *           type: number
 *           description: Optional longitude (will be geocoded if not provided)
 *
 *     MonthlyConsumptionData:
 *       type: object
 *       properties:
 *         month:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         rawConsumption:
 *           type: number
 *         estimatedConsumption:
 *           type: number
 *         climaticCoefficient:
 *           type: number
 *         buildingCoefficient:
 *           type: number
 *         effectiveCoefficient:
 *           type: number
 *
 *     MonthlyPVProductionData:
 *       type: object
 *       properties:
 *         month:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         rawConsumption:
 *           type: number
 *         pvProduction:
 *           type: number
 *         netConsumption:
 *           type: number
 *         credit:
 *           type: number
 *
 *     MonthlyEconomicData:
 *       type: object
 *       description: Monthly economic data for year 1 (12 months of bill calculations)
 *       properties:
 *         month:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           description: Month number (1-12)
 *         rawConsumption:
 *           type: number
 *           description: Raw consumption before PV (kWh)
 *         billedConsumption:
 *           type: number
 *           description: Billed consumption after PV credit (kWh)
 *         appliedTariffRate:
 *           type: number
 *           description: Applied tariff rate (DT/kWh)
 *         billWithoutPV:
 *           type: number
 *           description: Bill amount without PV (DT)
 *         billWithPV:
 *           type: number
 *           description: Bill amount with PV (DT)
 *         monthlySavings:
 *           type: number
 *           description: Monthly savings from PV (DT)
 *
 *     AnnualEconomicData:
 *       type: object
 *       description: Annual economic projection data (25 years of projections with inflation, degradation, discounting)
 *       properties:
 *         year:
 *           type: integer
 *           minimum: 1
 *           maximum: 25
 *           description: Year number (1-25)
 *         annualRawConsumption:
 *           type: number
 *           description: Annual raw consumption (kWh)
 *         annualBilledConsumption:
 *           type: number
 *           description: Annual billed consumption after PV (kWh)
 *         annualBillWithoutPV:
 *           type: number
 *           description: Annual bill without PV (DT)
 *         annualBillWithPV:
 *           type: number
 *           description: Annual bill with PV (DT)
 *         annualSavings:
 *           type: number
 *           description: Annual savings from PV (DT)
 *         averageAvoidedTariff:
 *           type: number
 *           description: Average avoided tariff rate (DT/kWh)
 *         capex:
 *           type: number
 *           description: Capital expenditure (investment cost, year 1 only, otherwise 0)
 *         opex:
 *           type: number
 *           description: Operating expenditure (maintenance cost for this year, with inflation)
 *         netGain:
 *           type: number
 *           description: Net gain (savings - OPEX) for this year
 *         cumulativeCashFlow:
 *           type: number
 *           description: Cumulative cash flow (non-discounted, sum of all net gains)
 *         cumulativeCashFlowDiscounted:
 *           type: number
 *           description: Cumulative cash flow (discounted, present value)
 *         cumulativeNetGain:
 *           type: number
 *           description: Cumulative net gain (non-discounted, sum of all net gains)
 *         cumulativeNetGainDiscounted:
 *           type: number
 *           description: Cumulative net gain (discounted, present value) - used for NPV calculation
 *
 *     AuditSolaireResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 *         buildingType:
 *           type: string
 *         climateZone:
 *           type: string
 *         measuredConsumption:
 *           type: number
 *         referenceMonth:
 *           type: integer
 *         surfaceArea:
 *           type: number
 *         baseConsumption:
 *           type: number
 *         monthlyConsumptions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MonthlyConsumptionData'
 *         annualConsumption:
 *           type: number
 *         annualIrradiation:
 *           type: number
 *         installedPower:
 *           type: number
 *         annualProducible:
 *           type: number
 *         expectedProduction:
 *           type: number
 *         energyCoverageRate:
 *           type: number
 *         monthlyPVProductions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MonthlyPVProductionData'
 *         installationCost:
 *           type: number
 *         annualOpex:
 *           type: number
 *         annualSavings:
 *           type: number
 *         totalSavings25Years:
 *           type: number
 *         simplePaybackYears:
 *           type: number
 *         discountedPaybackYears:
 *           type: number
 *         roi25Years:
 *           type: number
 *         npv:
 *           type: number
 *         irr:
 *           type: number
 *         monthlyEconomics:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MonthlyEconomicData'
 *         annualEconomics:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AnnualEconomicData'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         address:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Solar Audit
 *   description: Solar audit simulation endpoints
 */

export const auditSolaireSimulationRoutes = asyncRouter();

/**
 * @swagger
 * /audit-solaire-simulations:
 *   post:
 *     summary: Create a new solar audit simulation
 *     tags: [Solar Audit]
 *     description: |
 *       Creates a comprehensive solar audit simulation with:
 *       - Consumption extrapolation (monthly and annual estimates)
 *       - PV production calculation (system sizing, yield, coverage)
 *       - Complete economic analysis including:
 *         - Monthly economics (12 months of bill calculations)
 *         - Annual economics (25 years of projections with inflation, degradation, discounting)
 *         - Financial metrics (NPV, IRR, ROI, payback periods)
 *
 *       The simulation includes detailed monthlyEconomics and annualEconomics arrays that are stored in the database
 *       and used for PV report generation.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAuditSolaireInput'
 *     responses:
 *       201:
 *         description: Simulation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditSolaireResponse'
 *       400:
 *         description: Validation error or missing fields
 *       500:
 *         description: Server error
 */
auditSolaireSimulationRoutes.post(
  '/',
  auditSolaireSimulationController.createSimulation
);

/**
 * @swagger
 * /audit-solaire-simulations:
 *   get:
 *     summary: Get paginated solar audit simulations
 *     tags: [Solar Audit]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of simulations
 */
auditSolaireSimulationRoutes.get(
  '/',
  auditSolaireSimulationController.getSimulations
);

/**
 * @swagger
 * /audit-solaire-simulations/{id}:
 *   get:
 *     summary: Get solar audit simulation by ID
 *     tags: [Solar Audit]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Simulation ID
 *     responses:
 *       200:
 *         description: Simulation details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditSolaireResponse'
 *       404:
 *         description: Simulation not found
 */
auditSolaireSimulationRoutes.get(
  '/:id',
  auditSolaireSimulationController.getSimulationById
);

/**
 * @swagger
 * /audit-solaire-simulations/{id}:
 *   delete:
 *     summary: Delete solar audit simulation
 *     tags: [Solar Audit]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Simulation ID
 *     responses:
 *       204:
 *         description: Simulation deleted successfully
 *       404:
 *         description: Simulation not found
 */
auditSolaireSimulationRoutes.delete(
  '/:id',
  auditSolaireSimulationController.deleteSimulation
);
