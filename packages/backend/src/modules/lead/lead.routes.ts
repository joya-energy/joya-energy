import asyncRouter from 'express-promise-router';
import { leadController } from './lead.controller';

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateLeadInput:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Lead email address (required)
 *           example: "user@example.com"
 *         phoneNumber:
 *           type: string
 *           description: Lead phone number (optional)
 *           example: "+21651845578"
 *         name:
 *           type: string
 *           description: Lead full name (optional)
 *           maxLength: 100
 *           example: "John Doe"
 *         address:
 *           type: string
 *           description: Lead address (optional)
 *           maxLength: 500
 *           example: "123 Avenue Habib Bourguiba, Tunis"
 *         companyName:
 *           type: string
 *           description: Lead company name (optional)
 *           maxLength: 100
 *           example: "Company Inc"
 *         source:
 *           type: string
 *           description: Source of the lead (optional)
 *           enum: [simulator, contact-form, newsletter]
 *           example: "simulator"
 *
 *     Lead:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Lead unique identifier
 *         email:
 *           type: string
 *           format: email
 *           description: Lead email address
 *         phoneNumber:
 *           type: string
 *           description: Lead phone number
 *           nullable: true
 *         name:
 *           type: string
 *           description: Lead full name
 *           nullable: true
 *         address:
 *           type: string
 *           description: Lead address
 *           nullable: true
 *         companyName:
 *           type: string
 *           description: Lead company name
 *           nullable: true
 *         source:
 *           type: string
 *           description: Source of the lead
 *           enum: [simulator, contact-form, newsletter]
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Lead creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Lead last update timestamp
 *
 *     LeadExistsResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "already exist"
 *           description: Indicates that the lead with this email already exists
 */

/**
 * @swagger
 * tags:
 *   name: Leads
 *   description: Lead management endpoints for collecting potential customer information
 */

export const leadRoutes = asyncRouter();

/**
 * @swagger
 * /api/leads:
 *   get:
 *     summary: Get all leads
 *     description: |
 *       Returns the list of all leads collected from simulators, contact forms, and newsletter subscriptions.
 *       This endpoint is intended for internal/admin use (lead monitoring dashboard).
 *     tags: [Leads]
 *     responses:
 *       200:
 *         description: List of leads
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new lead or check if email already exists
 *     description: |
 *       Stores a new lead in the database. All fields except email are optional.
 *       If a lead with the same email already exists, returns a message indicating the lead already exists.
 *       This endpoint is used internally to collect leads from simulators, contact forms, and newsletter subscriptions.
 *     tags: [Leads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLeadInput'
 *           examples:
 *             newsletter:
 *               summary: Newsletter subscription
 *               value:
 *                 email: "user@example.com"
 *                 source: "newsletter"
 *             simulator:
 *               summary: Lead from simulator
 *               value:
 *                 email: "user@example.com"
 *                 phoneNumber: "+21651845578"
 *                 name: "John Doe"
 *                 address: "123 Avenue Habib Bourguiba, Tunis"
 *                 companyName: "Company Inc"
 *                 source: "simulator"
 *             contactForm:
 *               summary: Lead from contact form
 *               value:
 *                 email: "user@example.com"
 *                 phoneNumber: "+21651845578"
 *                 name: "Jane Smith"
 *                 companyName: "Business Corp"
 *                 source: "contact-form"
 *     responses:
 *       201:
 *         description: Lead created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lead'
 *             example:
 *               id: "507f1f77bcf86cd799439011"
 *               email: "user@example.com"
 *               phoneNumber: "+21651845578"
 *               name: "John Doe"
 *               address: "123 Avenue Habib Bourguiba, Tunis"
 *               companyName: "Company Inc"
 *               source: "simulator"
 *               createdAt: "2026-02-09T10:00:00.000Z"
 *               updatedAt: "2026-02-09T10:00:00.000Z"
 *       200:
 *         description: Lead with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeadExistsResponse'
 *             example:
 *               message: "already exist"
 *       400:
 *         description: Bad request - Invalid input data (e.g., missing email, invalid email format, invalid phone number format)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Email is required"
 *       500:
 *         description: Server error
 */
leadRoutes.get('/', leadController.getLeads);
leadRoutes.post('/', leadController.createLead);
