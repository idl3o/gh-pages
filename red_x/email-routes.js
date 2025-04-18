/**
 * Email API Routes for Web3 Crypto Streaming Service
 * Handles all email-related API endpoints including:
 * - Contact form submissions
 * - Newsletter subscriptions
 * - Beta program signups
 * - Job applications
 * - Welcome emails
 */

const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Create rate limiters to prevent abuse
const contactFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: { error: 'Too many contact form submissions, please try again later.' }
});

const newsletterLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // 3 requests per day
  message: { error: 'Too many subscription attempts, please try again later.' }
});

// Middleware to verify email service connection
router.use(async (req, res, next) => {
  try {
    const connected = await emailService.verifyConnection();
    if (!connected) {
      console.error('Email service connection failed');
      return res.status(503).json({ error: 'Email service unavailable' });
    }
    next();
  } catch (error) {
    console.error('Error verifying email service connection:', error);
    return res.status(503).json({ error: 'Email service unavailable' });
  }
});

/**
 * Contact form submission endpoint
 * @route POST /api/email/contact
 */
router.post(
  '/contact',
  contactFormLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('type')
      .optional()
      .isIn(['general', 'support', 'creators', 'press'])
      .withMessage('Invalid contact type')
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, subject, message, type = 'general' } = req.body;

      const result = await emailService.sendContactFormSubmission({
        name,
        email,
        subject,
        message,
        type
      });

      if (!result.success) {
        return res.status(500).json({ error: 'Failed to send contact form submission' });
      }

      return res.status(200).json({
        success: true,
        message: 'Contact form submitted successfully'
      });
    } catch (error) {
      console.error('Error processing contact form:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * Newsletter subscription endpoint
 * @route POST /api/email/newsletter/subscribe
 */
router.post(
  '/newsletter/subscribe',
  newsletterLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('name').optional().trim(),
    body('interests').optional().isArray(),
    body('referrer').optional().trim()
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, name = '', interests = [], referrer = '' } = req.body;

      // Store subscription in database (not implemented in this example)
      // Implement database storage logic here

      // Send confirmation email
      const result = await emailService.sendTemplatedEmail({
        to: email,
        subject: 'Newsletter Subscription Confirmation - Web3 Crypto Streaming',
        template: 'newsletter-subscription',
        data: {
          name: name || 'Crypto Enthusiast',
          email,
          date: new Date().toLocaleDateString()
        }
      });

      if (!result.success) {
        return res.status(500).json({ error: 'Failed to send subscription confirmation' });
      }

      return res.status(200).json({
        success: true,
        message: 'Newsletter subscription successful'
      });
    } catch (error) {
      console.error('Error processing newsletter subscription:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * Beta program signup endpoint
 * @route POST /api/email/beta-signup
 */
router.post(
  '/beta-signup',
  newsletterLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role')
      .optional()
      .isIn(['Creator', 'Viewer', 'Developer', 'Investor'])
      .withMessage('Invalid role')
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, role = 'Viewer' } = req.body;

      // Store beta signup in database (not implemented in this example)
      // Implement database storage logic here

      // Send confirmation email
      const result = await emailService.sendBetaSignupConfirmation({
        name,
        email,
        role
      });

      if (!result.success) {
        return res.status(500).json({ error: 'Failed to process beta signup' });
      }

      return res.status(200).json({
        success: true,
        message: 'Beta program signup successful'
      });
    } catch (error) {
      console.error('Error processing beta signup:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * Job application submission endpoint
 * @route POST /api/email/job-application
 */
router.post(
  '/job-application',
  contactFormLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('jobTitle').trim().notEmpty().withMessage('Job title is required'),
    body('resume').optional().trim()
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, jobTitle, resume, coverLetter } = req.body;

      // Store job application in database (not implemented in this example)
      // Implement database storage logic here

      // Send confirmation email
      const result = await emailService.sendJobApplicationConfirmation({
        name,
        email,
        jobTitle,
        date: new Date().toLocaleDateString()
      });

      if (!result.success) {
        return res.status(500).json({ error: 'Failed to process job application' });
      }

      return res.status(200).json({
        success: true,
        message: 'Job application submitted successfully'
      });
    } catch (error) {
      console.error('Error processing job application:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * Welcome email endpoint
 * @route POST /api/email/welcome
 * @access Authenticated - Internal use only
 */
router.post(
  '/welcome',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('walletAddress').trim().notEmpty().withMessage('Wallet address is required')
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Note: In production, this endpoint should be protected with authentication
    // to prevent unauthorized access

    try {
      const { name, email, walletAddress } = req.body;

      const result = await emailService.sendWelcomeEmail({
        name,
        email,
        walletAddress
      });

      if (!result.success) {
        return res.status(500).json({ error: 'Failed to send welcome email' });
      }

      return res.status(200).json({
        success: true,
        message: 'Welcome email sent successfully'
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * Newsletter sending endpoint
 * @route POST /api/email/newsletter/send
 * @access Admin only
 */
router.post(
  '/newsletter/send',
  [
    body('recipients').isArray().withMessage('Recipients array is required'),
    body('recipients.*').isEmail().withMessage('All recipients must be valid emails'),
    body('content.title').trim().notEmpty().withMessage('Newsletter title is required'),
    body('content.body').trim().notEmpty().withMessage('Newsletter body is required')
  ],
  async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Note: In production, this endpoint should be protected with admin authentication
    // to prevent unauthorized access

    try {
      const { recipients, content } = req.body;

      const result = await emailService.sendNewsletter(recipients, content);

      if (!result.success) {
        return res.status(500).json({ error: 'Failed to send newsletter' });
      }

      return res.status(200).json({
        success: true,
        message: `Newsletter sent to ${result.recipientCount} recipients`
      });
    } catch (error) {
      console.error('Error sending newsletter:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;
