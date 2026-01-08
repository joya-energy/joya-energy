import { Router } from 'express';
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
 *         measuredAmount:
 *           type: number
 *           description: Monthly electricity bill amount (TND)
 *           example: 234
 *         referenceMonth:
 *           type: integer
 *           description: Month of the measured consumption (1-12)
 *           minimum: 1
 *           maximum: 12
 *           example: 7
 *         latitude:
 *           type: number
 *           description: Optional latitude (will be geocoded if not provided)
 *         longitude:
 *           type: number
 *           description: Optional longitude (will be geocoded if not provided)
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

export const auditSolaireSimulationRoutes = Router();

/**
 * @swagger
 * /audit-solaire-simulations:
 *   post:
 *     summary: Create a new solar audit simulation
 *     tags: [Solar Audit]
 *     description: Creates a comprehensive solar audit simulation with consumption extrapolation, PV production calculation, and economic analysis.
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
auditSolaireSimulationRoutes.post('/', auditSolaireSimulationController.createSimulation);

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
auditSolaireSimulationRoutes.get('/', auditSolaireSimulationController.getSimulations);

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
auditSolaireSimulationRoutes.get('/:id', auditSolaireSimulationController.getSimulationById);

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
auditSolaireSimulationRoutes.delete('/:id', auditSolaireSimulationController.deleteSimulation);
