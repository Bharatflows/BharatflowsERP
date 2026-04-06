/**
 * Settings API - Swagger Documentation
 * 
 * @swagger
 * tags:
 *   - name: Settings
 *     description: Application settings and configuration endpoints
 * 
 * components:
 *   schemas:
 *     AppConfig:
 *       type: object
 *       properties:
 *         enabledModules:
 *           type: object
 *           additionalProperties:
 *             type: boolean
 *           example: { sales: true, purchase: true, inventory: true, accounting: true }
 *         features:
 *           type: object
 *           additionalProperties:
 *             type: boolean
 *           example: { gstEnabled: true, tdsEnabled: false, multiCurrency: false }
 *         fiscalYear:
 *           type: string
 *           example: "APR-MAR"
 *         valuationMethod:
 *           type: string
 *           enum: [FIFO, LIFO, WEIGHTED_AVERAGE]
 *         timezone:
 *           type: string
 *           example: "Asia/Kolkata"
 *     
 *     SecuritySummary:
 *       type: object
 *       properties:
 *         securityScore:
 *           type: number
 *           example: 85
 *         failedLogins:
 *           type: number
 *           example: 3
 *         devices:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *             trusted:
 *               type: number
 *             blocked:
 *               type: number
 *         ipWhitelist:
 *           type: object
 *           properties:
 *             active:
 *               type: number
 *         recentEvents:
 *           type: array
 *           items:
 *             type: object
 *     
 *     IntegrityCheckResult:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         checkType:
 *           type: string
 *           example: "FULL"
 *         status:
 *           type: string
 *           enum: [SUCCESS, WARNING, FAILURE]
 *         totalChecks:
 *           type: number
 *         issuesFound:
 *           type: number
 *         criticalIssues:
 *           type: number
 *         runAt:
 *           type: string
 *           format: date-time
 *         duration:
 *           type: number
 *         issues:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               severity:
 *                 type: string
 *               description:
 *                 type: string
 *     
 *     SettingsExport:
 *       type: object
 *       properties:
 *         version:
 *           type: string
 *         exportedAt:
 *           type: string
 *           format: date-time
 *         company:
 *           type: object
 *         sequences:
 *           type: array
 *         workflows:
 *           type: array
 *         ipWhitelist:
 *           type: array
 * 
 * /settings/app-config:
 *   get:
 *     summary: Get application configuration
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Application configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AppConfig'
 *   put:
 *     summary: Update application configuration
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppConfig'
 *     responses:
 *       200:
 *         description: Configuration updated
 * 
 * /settings/security/summary:
 *   get:
 *     summary: Get security summary and score
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SecuritySummary'
 * 
 * /settings/integrity-check:
 *   post:
 *     summary: Run data integrity check
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               checkTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [STOCK, LEDGER, SEQUENCE]
 *     responses:
 *       200:
 *         description: Integrity check results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/IntegrityCheckResult'
 * 
 * /settings/integrity-check/history:
 *   get:
 *     summary: Get integrity check history
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of integrity check results
 * 
 * /settings/integrity-check/{id}:
 *   get:
 *     summary: Get specific integrity check details
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Integrity check details
 * 
 * /settings/users/bulk-import:
 *   post:
 *     summary: Bulk import users from CSV
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               sendInvites:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Import results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     imported:
 *                       type: number
 *                     failed:
 *                       type: number
 *                     errors:
 *                       type: array
 * 
 * /settings/export:
 *   get:
 *     summary: Export all settings as JSON
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings export
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SettingsExport'
 * 
 * /settings/import:
 *   post:
 *     summary: Import settings from JSON backup
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SettingsExport'
 *     responses:
 *       200:
 *         description: Import results
 */

export { };
