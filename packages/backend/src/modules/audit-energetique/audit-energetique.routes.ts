import { Router } from 'express';
import multer from 'multer';
import { auditEnergetiqueSimulationController } from './audit-energetique.controller';
import { billExtractionController } from './bill-extraction.controller';

export const auditEnergetiqueSimulationRoutes = Router();

// Configure multer for memory storage (buffer access)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     ExtractedBillData:
 *       type: object
 *       properties:
 *         monthlyBillAmount:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *               description: Total amount to pay in TND
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         recentBillConsumption:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *               description: Total energy consumption in kWh
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         periodStart:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *               format: date
 *               description: Start date of billing period
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         periodEnd:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *               format: date
 *               description: End date of billing period
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         tariffType:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *               enum: [Basse Tension, Moyenne Tension, Haute Tension]
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         contractedPower:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *               description: Contracted power in kVA
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         address:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *               description: Extracted address
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         clientName:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *               description: Extracted client name
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         governorate:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *               description: Extracted governorate
 *             explanation:
 *               type: string
 *               description: Explanation of the value
 *         confidence:
 *           type: number
 *           description: Confidence score (0-1)
 *     CreateAuditEnergetiqueInput:
 *       type: object
 *       required:
 *         - fullName
 *         - companyName
 *         - email
 *         - phoneNumber
 *         - address
 *         - governorate
 *         - buildingType
 *         - surfaceArea
 *         - floors
 *         - openingDaysPerWeek
 *         - openingHoursPerDay
 *         - insulation
 *         - glazingType
 *         - ventilation
 *         - climateZone
 *         - heatingSystem
 *         - coolingSystem
 *         - conditionedCoverage
 *         - domesticHotWater
 *         - tariffType
 *         - monthlyBillAmount
 *         - hasRecentBill
 *         - lightingType
 *       properties:
 *         fullName:
 *           type: string
 *           example: "Mohamed Ben Ali"
 *         companyName:
 *           type: string
 *           example: "Pharmacie Centrale"
 *         email:
 *           type: string
 *           format: email
 *           example: "contact@pharmacie.tn"
 *         phoneNumber:
 *           type: string
 *           example: "20123456"
 *         address:
 *           type: string
 *           example: "123 Avenue Habib Bourguiba"
 *         governorate:
 *           type: string
 *           enum: [Tunis, Ariana, Ben Arous, Manouba, Bizerte, Béja, Jendouba, Kairouan, Kasserine, Médenine, Monastir, Nabeul, Sfax, Sousse, Tataouine, Tozeur, Zaghouan, Siliana, Le Kef, Mahdia, Sidi Bouzid, Gabès, Gafsa]
 *           example: "Tunis"
 *         buildingType:
 *           type: string
 *           enum: ['Pharmacie', 'Café / Restaurant', 'Centre esthétique / Spa', 'Hôtel / Maison d’hôtes', 'Clinique / Centre médical', 'Bureau / Administration / Banque', 'Atelier léger / Artisanat / Menuiserie', 'Usine lourde / Mécanique / Métallurgie', 'Industrie textile / Emballage', 'Industrie alimentaire', 'Industrie plastique / Injection', 'Industrie agroalimentaire réfrigérée', 'École / Centre de formation']
 *           example: "Pharmacie"
 *         surfaceArea:
 *           type: number
 *           description: Surface area in m²
 *           example: 120
 *         floors:
 *           type: integer
 *           description: Number of floors (1, 2, 3...)
 *           example: 1
 *         activityType:
 *           type: string
 *           description: Description of activity
 *           example: "Vente de médicaments"
 *         openingDaysPerWeek:
 *           type: number
 *           minimum: 1
 *           maximum: 7
 *           example: 6
 *         openingHoursPerDay:
 *           type: number
 *           minimum: 1
 *           maximum: 24
 *           example: 10
 *         insulation:
 *           type: string
 *           enum: ['Isolation faible', 'Isolation moyenne', 'Isolation bonne']
 *           example: "Isolation moyenne"
 *         glazingType:
 *           type: string
 *           enum: ['Simple vitrage', 'Double vitrage']
 *           example: "Double vitrage"
 *         ventilation:
 *           type: string
 *           enum: ['Pas de VMC', 'VMC simple flux', 'VMC double flux']
 *           example: "Pas de VMC"
 *         climateZone:
 *           type: string
 *           enum: ['Nord', 'Centre', 'Sud']
 *           example: "Nord"
 *         heatingSystem:
 *           type: string
 *           enum: ['Aucun chauffage', 'Chauffage électrique individuel', 'Chauffage par climatisation réversible', 'Chaudière gaz', 'Autre système de chauffage']
 *           example: "Chauffage par climatisation réversible"
 *         coolingSystem:
 *           type: string
 *           enum: ['Aucune climatisation', 'Climatisation split', 'Climatisation centrale']
 *           example: "Climatisation split"
 *         conditionedCoverage:
 *           type: string
 *           enum: ['Quelques pièces', 'Environ la moitié du bâtiment', 'Presque tout le bâtiment']
 *           example: "Presque tout le bâtiment"
 *         domesticHotWater:
 *           type: string
 *           enum: ['Aucune production ECS', 'Chauffe-eau électrique', 'Chaudière gaz', 'Chauffe-eau solaire', 'Pompe à chaleur ECS']
 *           example: "Chauffe-eau électrique"
 *         equipmentCategories:
 *           type: array
 *           items:
 *             type: string
 *             enum: ['Éclairage', 'Bureautique', 'Froid commercial', 'Cuisine', 'Équipements spécifiques', 'Machines de production', 'Compresseurs', 'Pompes et convoyeurs', 'Froid industriel', 'Équipements auxiliaires']
 *           example: ["Éclairage", "Bureautique", "Froid commercial"]
 *         tariffType:
 *           type: string
 *           enum: ['Tarif basse tension', 'Tarif moyenne tension', 'Tarif haute tension']
 *           example: "Tarif basse tension"
 *         contractedPower:
 *           type: number
 *           description: Contracted power in kVA
 *           example: 15
 *         monthlyBillAmount:
 *           type: number
 *           description: Monthly bill amount in TND
 *           example: 450
 *         hasRecentBill:
 *           type: boolean
 *           example: true
 *         recentBillConsumption:
 *           type: number
 *           description: Consumption from recent bill in kWh
 *           example: 1200
 *         billAttachmentUrl:
 *           type: string
 *           format: uri
 *           example: "https://example.com/bill.pdf"
 *         existingMeasures:
 *           type: array
 *           items:
 *             type: string
 *             enum: ['Isolation toiture', 'Isolation murs', 'Double vitrage', 'LED', 'Solaire PV', 'Solaire thermique']
 *           example: ["LED"]
 *         lightingType:
 *           type: string
 *           enum: ['LED', 'Fluocompacte', 'Halogène', 'Incandescent']
 *           example: "Fluocompacte"
 *
 *     AuditEnergetiqueResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             simulationId:
 *               type: string
 *               format: uuid
 *             createdAt:
 *               type: string
 *               format: date-time
 *             results:
 *               type: object
 *               properties:
 *                 energyConsumption:
 *                   type: object
 *                   properties:
 *                     annual:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           example: 12500.50
 *                         unit:
 *                           type: string
 *                           example: "kWh/an"
 *                 energyCost:
 *                   type: object
 *                   properties:
 *                     annual:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           example: 4375.18
 *                         unit:
 *                           type: string
 *                           example: "TND/an"
 *                 co2Emissions:
 *                   type: object
 *                   properties:
 *                     annual:
 *                       type: object
 *                       properties:
 *                         tons:
 *                           type: number
 *                           example: 5.2
 *                         unit:
 *                           type: string
 *                           example: "t CO₂/an"
 *                 energyClassification:
 *                   type: object
 *                   properties:
 *                     class:
 *                       type: string
 *                       example: "C"
 *                     becth:
 *                       type: number
 *                       example: 85
 *                 carbonClassification:
 *                   type: object
 *                   properties:
 *                     class:
 *                       type: string
 *                       example: "B"
 *                     intensity:
 *                       type: number
 *                       example: 22.5
 *                     unit:
 *                       type: string
 *                       example: "kgCO2/m².an"
 *                     totalElecKg:
 *                       type: number
 *                       example: 3200.5
 *                     totalGasKg:
 *                       type: number
 *                       example: 1200.3
 *                     totalKg:
 *                       type: number
 *                       example: 4400.8
 */

/**
 * @swagger
 * tags:
 *   name: Audit Simulation
 *   description: Energy audit simulation endpoints
 */

/**
 * @swagger
 * /audit-energetique-simulations/extract-bill-data:
 *   post:
 *     summary: Extract structured data from a bill image
 *     tags: [Audit Simulation]
 *     description: Uploads an image (STEG bill) and extracts consumption data using AI.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               billImage:
 *                 type: string
 *                 format: binary
 *                 description: The image file of the bill (JPG/PNG)
 *     responses:
 *       200:
 *         description: Data extracted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ExtractedBillData'
 *       400:
 *         description: Invalid file or bad request
 *       500:
 *         description: Extraction failed
 */
// Remove inline logs to keep code clean after debugging
auditEnergetiqueSimulationRoutes.post(
  '/extract-bill-data',
  upload.single('billImage'),
  billExtractionController.extractBillData
);

/**
 * @swagger
 * /audit-energetique-simulations/full-upload:
 *   post:
 *     summary: Upload a bill and create a simulation in one step
 *     tags: [Audit Simulation]
 *     description: Uploads an image/PDF (STEG bill), extracts data using AI, merges with provided fields, and creates the energy simulation.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               billImage:
 *                 type: string
 *                 format: binary
 *                 description: The image or PDF file of the bill (JPG/PNG/PDF)
 *               fullName:
 *                 type: string
 *               companyName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               governorate:
 *                 type: string
 *                 enum: [Tunis, Ariana, Ben Arous, Manouba, Bizerte, Béja, Jendouba, Kairouan, Kasserine, Médenine, Monastir, Nabeul, Sfax, Sousse, Tataouine, Tozeur, Zaghouan, Siliana, Le Kef, Mahdia, Sidi Bouzid, Gabès, Gafsa]
 *               buildingType:
 *                 type: string
 *                 enum: ['Pharmacie', 'Café / Restaurant', 'Centre esthétique / Spa', 'Hôtel / Maison d’hôtes', 'Clinique / Centre médical', 'Bureau / Administration / Banque', 'Atelier léger / Artisanat / Menuiserie', 'Usine lourde / Mécanique / Métallurgie', 'Industrie textile / Emballage', 'Industrie alimentaire', 'Industrie plastique / Injection', 'Industrie agroalimentaire réfrigérée', 'École / Centre de formation']
 *               surfaceArea:
 *                 type: number
 *               floors:
 *                 type: integer
 *               activityType:
 *                 type: string
 *               openingDaysPerWeek:
 *                 type: number
 *               openingHoursPerDay:
 *                 type: number
 *               insulation:
 *                 type: string
 *               glazingType:
 *                 type: string
 *               ventilation:
 *                 type: string
 *               climateZone:
 *                 type: string
 *               heatingSystem:
 *                 type: string
 *               coolingSystem:
 *                 type: string
 *               conditionedCoverage:
 *                 type: string
 *               domesticHotWater:
 *                 type: string
 *               equipmentCategories:
 *                 type: array
 *                 items:
 *                   type: string
 *               tariffType:
 *                 type: string
 *                 enum: ['Basse Tension', 'Moyenne Tension', 'Haute Tension']
 *               contractedPower:
 *                 type: number
 *               monthlyBillAmount:
 *                 type: number
 *               hasRecentBill:
 *                 type: boolean
 *               recentBillConsumption:
 *                 type: number
 *               existingMeasures:
 *                 type: array
 *                 items:
 *                   type: string
 *               lightingType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Simulation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditEnergetiqueResponse'
 *       400:
 *         description: Validation error or missing fields
 *       500:
 *         description: Server error
 */
auditEnergetiqueSimulationRoutes.post(
  '/full-upload',
  upload.single('billImage'),
  auditEnergetiqueSimulationController.createSimulationWithBill
);

/**
 * @swagger
 * /audit-energetique-simulations:
 *   post:
 *     summary: Create a new energy audit simulation
 *     tags: [Audit Simulation]
 *     description: Creates a simulation and returns detailed energy consumption, costs, and classification results immediately.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAuditEnergetiqueInput'
 *     responses:
 *       201:
 *         description: Simulation created successfully with results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditEnergetiqueResponse'
 *       400:
 *         description: Validation error or missing fields
 *       500:
 *         description: Server error
 */
auditEnergetiqueSimulationRoutes.post('/', auditEnergetiqueSimulationController.createSimulation);

/**
 * @swagger
 * /audit-energetique-simulations/{id}:
 *   get:
 *     summary: Retrieve a simulation by ID
 *     tags: [Audit Simulation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The simulation ID
 *     responses:
 *       200:
 *         description: Simulation details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditEnergetiqueResponse'
 *       404:
 *         description: Simulation not found
 */
auditEnergetiqueSimulationRoutes.get('/:id', auditEnergetiqueSimulationController.getSimulationById);

auditEnergetiqueSimulationRoutes.delete('/:id', auditEnergetiqueSimulationController.deleteSimulation);
