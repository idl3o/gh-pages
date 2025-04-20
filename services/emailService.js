/**
 * Email Service for Web3 Crypto Streaming Platform
 *
 * Provides a comprehensive email service with the following features:
 * - Template-based emails with dynamic content
 * - Support for text and HTML emails
 * - Email delivery logging and retry mechanisms
 * - Support for multiple email providers with fallback options
 */

const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: 'logs/email-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/email.log' })
  ]
});

// Add console logging in development environment
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple()
    })
  );
}

class EmailService {
  constructor() {
    this.initialized = false;
    this.transporters = {};
    this.templates = {};
    this.defaultProvider = null;
    this.emailQueue = [];
    this.maxRetries = 3;
  }

  /**
   * Initialize the email service with configuration
   * @param {Object} config - Email service configuration
   * @returns {Boolean} - Success status
   */
  async initialize(config = {}) {
    try {
      // Load configuration from environment if not provided
      const defaultConfig = {
        providers: [
          {
            name: 'default',
            host: process.env.SMTP_HOST || 'smtp.example.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER || '',
              pass: process.env.SMTP_PASS || ''
            }
          }
        ],
        defaultProvider: 'default',
        from: process.env.EMAIL_FROM || 'Crypto Streaming <noreply@cryptostreaming.com>',
        templatesDir: process.env.EMAIL_TEMPLATES_DIR || path.join(__dirname, '../email-templates')
      };

      // Merge provided config with defaults
      const finalConfig = { ...defaultConfig, ...config };

      // Initialize email transporters for each provider
      for (const provider of finalConfig.providers) {
        this.transporters[provider.name] = nodemailer.createTransport({
          host: provider.host,
          port: provider.port,
          secure: provider.secure,
          auth: provider.auth,
          tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production'
          }
        });
      }

      this.defaultProvider = finalConfig.defaultProvider;
      this.from = finalConfig.from;
      this.templatesDir = finalConfig.templatesDir;

      // Load email templates
      await this.loadTemplates();

      // Set initialized flag
      this.initialized = true;
      logger.info('Email service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize email service', { error: error.message });
      return false;
    }
  }

  /**
   * Load email templates from the templates directory
   * @returns {void}
   */
  async loadTemplates() {
    try {
      // Read template directory
      const templateDirs = await fs.readdir(this.templatesDir);

      for (const dir of templateDirs) {
        const templatePath = path.join(this.templatesDir, dir);
        const stat = await fs.stat(templatePath);

        if (stat.isDirectory()) {
          // Look for HTML and text templates
          try {
            const htmlPath = path.join(templatePath, 'html.hbs');
            const textPath = path.join(templatePath, 'text.hbs');

            // Read HTML template if exists
            let htmlTemplate = null;
            try {
              const htmlContent = await fs.readFile(htmlPath, 'utf8');
              htmlTemplate = handlebars.compile(htmlContent);
            } catch (e) {
              // HTML template is optional
            }

            // Read text template if exists
            let textTemplate = null;
            try {
              const textContent = await fs.readFile(textPath, 'utf8');
              textTemplate = handlebars.compile(textContent);
            } catch (e) {
              // Text template is optional
            }

            // Store templates if at least one exists
            if (htmlTemplate || textTemplate) {
              this.templates[dir] = {
                html: htmlTemplate,
                text: textTemplate
              };
              logger.info(`Loaded email template: ${dir}`);
            }
          } catch (templateError) {
            logger.error(`Failed to load template ${dir}`, { error: templateError.message });
          }
        }
      }

      logger.info(`Loaded ${Object.keys(this.templates).length} email templates`);
    } catch (error) {
      logger.error('Failed to load email templates', { error: error.message });
      throw error;
    }
  }

  /**
   * Verify connection to email provider
   * @param {String} provider - Provider name (optional)
   * @returns {Boolean} - Connection status
   */
  async verifyConnection(provider = null) {
    if (!this.initialized) {
      await this.initialize();
    }

    const providerName = provider || this.defaultProvider;

    try {
      const transporter = this.transporters[providerName];
      if (!transporter) {
        logger.error(`Email provider not found: ${providerName}`);
        return false;
      }

      await transporter.verify();
      return true;
    } catch (error) {
      logger.error(`Email connection verification failed for ${providerName}`, {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Send an email using a template
   * @param {Object} options - Email options
   * @returns {Object} - Result of the operation
   */
  async sendTemplatedEmail(options) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      to,
      cc,
      bcc,
      subject,
      template,
      data = {},
      attachments = [],
      provider = null
    } = options;

    try {
      // Validate required options
      if (!to) {
        throw new Error('Recipient (to) is required');
      }

      if (!subject) {
        throw new Error('Subject is required');
      }

      if (!template || !this.templates[template]) {
        throw new Error(`Template '${template}' not found`);
      }

      // Prepare email content
      const templateData = {
        ...data,
        year: new Date().getFullYear()
      };

      const emailContent = {
        from: this.from,
        to,
        cc,
        bcc,
        subject,
        attachments
      };

      // Add HTML content if template exists
      if (this.templates[template].html) {
        emailContent.html = this.templates[template].html(templateData);
      }

      // Add text content if template exists
      if (this.templates[template].text) {
        emailContent.text = this.templates[template].text(templateData);
      }

      // Send email
      const providerName = provider || this.defaultProvider;
      const transporter = this.transporters[providerName];

      if (!transporter) {
        throw new Error(`Email provider not found: ${providerName}`);
      }

      const info = await transporter.sendMail(emailContent);

      logger.info('Email sent successfully', {
        messageId: info.messageId,
        template,
        recipient: to
      });

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      logger.error('Failed to send templated email', {
        error: error.message,
        template,
        recipient: to
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send a contact form submission email
   * @param {Object} data - Contact form data
   * @returns {Object} - Result of the operation
   */
  async sendContactFormSubmission(data) {
    const { name, email, subject, message, type } = data;

    // Determine appropriate department email
    const departmentEmails = {
      support: 'support@cryptostreaming.com',
      creators: 'creators@cryptostreaming.com',
      press: 'press@cryptostreaming.com',
      general: 'contact@cryptostreaming.com'
    };

    const toEmail = departmentEmails[type] || departmentEmails.general;

    // Send notification to staff
    const staffResult = await this.sendTemplatedEmail({
      to: toEmail,
      subject: `Contact Form: ${subject}`,
      template: 'contact-form-notification',
      data: {
        name,
        email,
        subject,
        message,
        type,
        date: new Date().toLocaleDateString()
      }
    });

    // Send confirmation to user
    const userResult = await this.sendTemplatedEmail({
      to: email,
      subject: 'We received your message - Crypto Streaming',
      template: 'contact-form-confirmation',
      data: {
        name,
        subject,
        date: new Date().toLocaleDateString()
      }
    });

    return {
      success: staffResult.success && userResult.success
    };
  }

  /**
   * Send welcome email to new users
   * @param {Object} data - User data
   * @returns {Object} - Result of the operation
   */
  async sendWelcomeEmail(data) {
    const { name, email, walletAddress } = data;

    return await this.sendTemplatedEmail({
      to: email,
      subject: 'Welcome to Web3 Crypto Streaming!',
      template: 'welcome-email',
      data: {
        name,
        walletAddress
      }
    });
  }

  /**
   * Send beta signup confirmation
   * @param {Object} data - Beta signup data
   * @returns {Object} - Result of the operation
   */
  async sendBetaSignupConfirmation(data) {
    const { name, email, role } = data;

    return await this.sendTemplatedEmail({
      to: email,
      subject: 'Welcome to the Web3 Crypto Streaming Beta Program',
      template: 'beta-signup',
      data: {
        name,
        role,
        accessCode: this.generateAccessCode()
      }
    });
  }

  /**
   * Send job application confirmation
   * @param {Object} data - Job application data
   * @returns {Object} - Result of the operation
   */
  async sendJobApplicationConfirmation(data) {
    const { name, email, jobTitle, date } = data;

    // Send confirmation to applicant
    const applicantResult = await this.sendTemplatedEmail({
      to: email,
      subject: 'We received your application - Crypto Streaming',
      template: 'job-application-confirmation',
      data: {
        name,
        jobTitle,
        date
      }
    });

    // Send notification to HR
    const hrResult = await this.sendTemplatedEmail({
      to: 'hr@cryptostreaming.com',
      subject: `New Job Application: ${jobTitle}`,
      template: 'job-application-notification',
      data: {
        name,
        email,
        jobTitle,
        date
      }
    });

    return {
      success: applicantResult.success && hrResult.success
    };
  }

  /**
   * Send newsletter to multiple recipients
   * @param {Array} recipients - List of recipient emails
   * @param {Object} content - Newsletter content
   * @returns {Object} - Result of the operation
   */
  async sendNewsletter(recipients, content) {
    const { title, body } = content;

    let successCount = 0;
    const batchSize = 50;

    // Send in batches to avoid rate limiting
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const promises = batch.map(recipient =>
        this.sendTemplatedEmail({
          to: recipient,
          subject: title,
          template: 'newsletter',
          data: {
            title,
            content: body
          }
        })
      );

      const results = await Promise.all(promises);

      // Count successful sends
      successCount += results.filter(result => result.success).length;

      // Wait a bit between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      success: successCount > 0,
      recipientCount: successCount
    };
  }

  /**
   * Generate a random access code
   * @returns {String} - Random access code
   */
  generateAccessCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}

// Create and export a singleton instance
const emailService = new EmailService();
module.exports = emailService;
