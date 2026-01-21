/**
 * CORRECTION 6: TESTS DE SÉCURITÉ EMAIL
 * Tests complets pour la validation et protection des emails
 */

import EmailSecurityValidator from '@/lib/validation/email-security';
import EmailRateLimiter from '@/lib/validation/email-rate-limiting';

describe('EmailSecurityValidator', () => {

  describe('validateEmailAddress', () => {
    it('should validate correct email addresses', () => {
      const result = EmailSecurityValidator.validateEmailAddress('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.threats).toHaveLength(0);
      expect(result.riskLevel).toBe('LOW');
    });

    it('should reject emails with SMTP injection attempts', () => {
      const maliciousEmails = [
        'test@example.com\r\nBcc: evil@hacker.com',
        'test@example.com%0aBcc: evil@hacker.com',
        'test@example.com\nBcc: evil@hacker.com',
        'test@example.com\\nSubject: Hacked',
      ];

      maliciousEmails.forEach(email => {
        const result = EmailSecurityValidator.validateEmailAddress(email);
        expect(result.isValid).toBe(false);
        expect(result.riskLevel).toBe('CRITICAL');
        expect(result.threats.some(t => t.type === 'SMTP_INJECTION')).toBe(true);
      });
    });

    it('should detect phishing domains', () => {
      const phishingEmails = [
        'test@gmai1.com',  // Homograph
        'test@example.tk',  // Suspicious TLD
        'test@paypa1.com', // Typosquatting
      ];

      phishingEmails.forEach(email => {
        const result = EmailSecurityValidator.validateEmailAddress(email);
        expect(result.threats.some(t => t.type === 'PHISHING')).toBe(true);
      });
    });

    it('should sanitize email addresses', () => {
      const result = EmailSecurityValidator.validateEmailAddress('  TeSt@ExAmPlE.cOm  ');
      expect(result.sanitizedValue).toBe('test@example.com');
    });
  });

  describe('validateEmailSubject', () => {
    it('should validate normal subjects', () => {
      const result = EmailSecurityValidator.validateEmailSubject('Meeting Tomorrow');
      expect(result.isValid).toBe(true);
      expect(result.threats).toHaveLength(0);
    });

    it('should reject subjects with SMTP injection', () => {
      const maliciousSubjects = [
        'Meeting\r\nBcc: evil@hacker.com',
        'Meeting%0ABcc: evil@hacker.com',
        'Meeting\\nBcc: evil@hacker.com',
      ];

      maliciousSubjects.forEach(subject => {
        const result = EmailSecurityValidator.validateEmailSubject(subject);
        expect(result.isValid).toBe(false);
        expect(result.riskLevel).toBe('CRITICAL');
        expect(result.threats.some(t => t.type === 'SMTP_INJECTION')).toBe(true);
      });
    });

    it('should detect XSS in subjects', () => {
      const xssSubjects = [
        'Meeting <script>alert("xss")</script>',
        'Meeting <iframe src="evil.com"></iframe>',
        'Meeting onclick="alert(1)"',
        'Meeting javascript:alert(1)',
      ];

      xssSubjects.forEach(subject => {
        const result = EmailSecurityValidator.validateEmailSubject(subject);
        expect(result.threats.some(t => t.type === 'XSS')).toBe(true);
      });
    });

    it('should enforce length limits', () => {
      const longSubject = 'A'.repeat(300);
      const result = EmailSecurityValidator.validateEmailSubject(longSubject, { maxLength: 200 });
      expect(result.threats.some(t => t.type === 'SIZE_LIMIT')).toBe(true);
      expect(result.sanitizedValue.length).toBe(200);
    });

    it('should sanitize subjects', () => {
      const result = EmailSecurityValidator.validateEmailSubject('Meeting\r\nwith<script>');
      expect(result.sanitizedValue).not.toContain('\r\n');
      expect(result.sanitizedValue).not.toContain('<script>');
    });
  });

  describe('validateEmailBody', () => {
    it('should validate normal email bodies', () => {
      const result = EmailSecurityValidator.validateEmailBody('Hello,\n\nThis is a test.\n\nBest regards');
      expect(result.isValid).toBe(true);
    });

    it('should detect XSS in body', () => {
      const xssBodies = [
        'Hello <script>alert("xss")</script>',
        'Hello <iframe src="evil.com"></iframe>',
        'Hello <form><input type="text"></form>',
        'Hello onload="alert(1)"',
      ];

      xssBodies.forEach(body => {
        const result = EmailSecurityValidator.validateEmailBody(body);
        expect(result.threats.some(t => t.type === 'XSS')).toBe(true);
      });
    });

    it('should detect malware patterns', () => {
      const malwareBodies = [
        'Download malware.exe here',
        'Click on http://192.168.1.1/malware.scr',
        'Visit bit.ly/malware for virus.bat',
      ];

      malwareBodies.forEach(body => {
        const result = EmailSecurityValidator.validateEmailBody(body);
        expect(result.threats.some(t => t.type === 'MALWARE')).toBe(true);
      });
    });

    it('should detect phishing content', () => {
      const phishingBodies = [
        'URGENT ACTION REQUIRED - Click here immediately',
        'Congratulations! You have won $1,000,000',
        'Your account will be suspended unless you verify immediately',
        'Prince of Nigeria needs your help with inheritance',
      ];

      phishingBodies.forEach(body => {
        const result = EmailSecurityValidator.validateEmailBody(body);
        expect(result.threats.some(t => t.type === 'PHISHING')).toBe(true);
      });
    });

    it('should sanitize HTML when allowHtml is false', () => {
      const result = EmailSecurityValidator.validateEmailBody(
        'Hello <b>bold</b> and <script>alert("xss")</script>',
        { allowHtml: false }
      );
      expect(result.sanitizedValue).not.toContain('<b>');
      expect(result.sanitizedValue).not.toContain('<script>');
      expect(result.sanitizedValue).toContain('&lt;');
    });
  });

  describe('validateAttachmentName', () => {
    it('should validate safe file names', () => {
      const safeNames = ['document.pdf', 'image.jpg', 'presentation.pptx'];

      safeNames.forEach(name => {
        const result = EmailSecurityValidator.validateAttachmentName(name);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject dangerous file extensions', () => {
      const dangerousNames = [
        'malware.exe',
        'virus.scr',
        'trojan.bat',
        'evil.vbs',
        'hack.cmd',
      ];

      dangerousNames.forEach(name => {
        const result = EmailSecurityValidator.validateAttachmentName(name);
        expect(result.isValid).toBe(false);
        expect(result.riskLevel).toBe('CRITICAL');
        expect(result.threats.some(t => t.type === 'MALWARE')).toBe(true);
      });
    });

    it('should sanitize file names', () => {
      const result = EmailSecurityValidator.validateAttachmentName('file<>:"/\\|?*.txt');
      expect(result.sanitizedValue).not.toMatch(/[<>:"/\\|?*]/);
    });

    it('should handle long file names', () => {
      const longName = 'A'.repeat(300) + '.txt';
      const result = EmailSecurityValidator.validateAttachmentName(longName);
      expect(result.threats.some(t => t.type === 'SIZE_LIMIT')).toBe(true);
      expect(result.sanitizedValue.length).toBeLessThanOrEqual(255);
    });
  });

  describe('validateFullEmail', () => {
    it('should validate complete email', () => {
      const result = EmailSecurityValidator.validateFullEmail({
        to: 'test@example.com',
        from: 'sender@company.com',
        subject: 'Business Meeting',
        body: 'Hello, let\'s schedule a meeting.',
      });
      expect(result.isValid).toBe(true);
      expect(result.riskLevel).toBe('LOW');
    });

    it('should detect multiple threats', () => {
      const result = EmailSecurityValidator.validateFullEmail({
        to: 'test@example.com\r\nBcc: evil@hacker.com',
        subject: 'URGENT ACTION REQUIRED <script>alert("xss")</script>',
        body: 'Click here immediately: bit.ly/malware.exe',
        attachmentName: 'virus.exe',
      });
      expect(result.isValid).toBe(false);
      expect(result.riskLevel).toBe('CRITICAL');
      expect(result.threats.length).toBeGreaterThan(1);
    });
  });

});

describe('EmailRateLimiter', () => {

  beforeEach(() => {
    // Reset rate limiter state
    EmailRateLimiter.resetUserLimits('test-org', 'test@example.com');
  });

  describe('checkRateLimit', () => {
    it('should allow emails within limits', () => {
      const result = EmailRateLimiter.checkRateLimit(
        'test-org',
        'test@example.com',
        'recipient@example.com'
      );
      expect(result.allowed).toBe(true);
      expect(result.currentUsage.perMinute).toBe(0);
    });

    it('should block after exceeding per-minute limit', () => {
      // Simulate 10 emails in the last minute
      for (let i = 0; i < 10; i++) {
        EmailRateLimiter.recordEmailSent(
          'test-org',
          'test@example.com',
          `recipient${i}@example.com`
        );
      }

      const result = EmailRateLimiter.checkRateLimit(
        'test-org',
        'test@example.com',
        'new-recipient@example.com'
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('minute');
    });

    it('should block multiple emails to same recipient', () => {
      // Send 3 emails to same recipient
      for (let i = 0; i < 3; i++) {
        EmailRateLimiter.recordEmailSent(
          'test-org',
          'test@example.com',
          'same-recipient@example.com'
        );
      }

      const result = EmailRateLimiter.checkRateLimit(
        'test-org',
        'test@example.com',
        'same-recipient@example.com'
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('même destinataire');
    });

    it('should handle custom rate limits', () => {
      const customLimits = {
        maxEmailsPerMinute: 1,
        maxEmailsPerHour: 5,
        maxEmailsPerDay: 10,
      };

      // First email should be allowed
      let result = EmailRateLimiter.checkRateLimit(
        'test-org',
        'test@example.com',
        'recipient@example.com',
        customLimits
      );
      expect(result.allowed).toBe(true);

      // Record the email
      EmailRateLimiter.recordEmailSent(
        'test-org',
        'test@example.com',
        'recipient@example.com'
      );

      // Second email should be blocked due to per-minute limit
      result = EmailRateLimiter.checkRateLimit(
        'test-org',
        'test@example.com',
        'recipient2@example.com',
        customLimits
      );
      expect(result.allowed).toBe(false);
    });
  });

  describe('isEmailBlacklisted', () => {
    it('should detect blacklisted domains', () => {
      const blacklistedEmails = [
        'test@10minutemail.com',
        'test@tempmail.org',
        'test@guerrillamail.com',
        'test@mailinator.com',
      ];

      blacklistedEmails.forEach(email => {
        expect(EmailRateLimiter.isEmailBlacklisted(email)).toBe(true);
      });
    });

    it('should allow legitimate domains', () => {
      const legitimateEmails = [
        'test@gmail.com',
        'test@company.com',
        'test@university.edu',
      ];

      legitimateEmails.forEach(email => {
        expect(EmailRateLimiter.isEmailBlacklisted(email)).toBe(false);
      });
    });

    it('should handle invalid email formats', () => {
      expect(EmailRateLimiter.isEmailBlacklisted('invalid-email')).toBe(true);
      expect(EmailRateLimiter.isEmailBlacklisted('')).toBe(true);
      expect(EmailRateLimiter.isEmailBlacklisted('test@')).toBe(true);
    });
  });

  describe('detectSpamContent', () => {
    it('should detect spam keywords', () => {
      const spamTexts = [
        { subject: 'URGENT ACTION REQUIRED', body: 'Click here immediately!' },
        { subject: 'You won!', body: 'Congratulations! You have won $1,000,000' },
        { subject: 'Free money!', body: 'Get free money now! Limited time offer!' },
        { subject: 'ACT NOW!!!', body: 'Don\'t miss this 100% guarantee offer!' },
      ];

      spamTexts.forEach(({ subject, body }) => {
        const result = EmailRateLimiter.detectSpamContent(subject, body);
        expect(result.isSpam).toBe(true);
        expect(result.score).toBeGreaterThan(50);
        expect(result.reasons.length).toBeGreaterThan(0);
      });
    });

    it('should allow legitimate business emails', () => {
      const legitimateTexts = [
        { subject: 'Meeting Tomorrow', body: 'Hi, let\'s schedule our business meeting.' },
        { subject: 'Project Update', body: 'Here\'s the latest progress on our project.' },
        { subject: 'Invoice #1234', body: 'Please find attached the invoice for your recent order.' },
      ];

      legitimateTexts.forEach(({ subject, body }) => {
        const result = EmailRateLimiter.detectSpamContent(subject, body);
        expect(result.isSpam).toBe(false);
        expect(result.score).toBeLessThan(50);
      });
    });

    it('should penalize excessive uppercase', () => {
      const result = EmailRateLimiter.detectSpamContent(
        'URGENT MESSAGE',
        'THIS IS AN URGENT MESSAGE WITH LOTS OF CAPITALS!'
      );
      expect(result.score).toBeGreaterThan(0);
      expect(result.reasons.some(r => r.includes('majuscules'))).toBe(true);
    });

    it('should penalize excessive punctuation', () => {
      const result = EmailRateLimiter.detectSpamContent(
        'Amazing offer!!!',
        'Don\'t miss this!!! Act now!!! Limited time!!!'
      );
      expect(result.score).toBeGreaterThan(0);
      expect(result.reasons.some(r => r.includes('ponctuation'))).toBe(true);
    });
  });

  describe('getOrganizationStats', () => {
    it('should return correct organization statistics', () => {
      // Record some emails for different users in the same org
      EmailRateLimiter.recordEmailSent('test-org', 'user1@company.com', 'external1@example.com');
      EmailRateLimiter.recordEmailSent('test-org', 'user2@company.com', 'external2@example.com');
      EmailRateLimiter.recordEmailSent('other-org', 'user3@other.com', 'external3@example.com');

      const stats = EmailRateLimiter.getOrganizationStats('test-org');
      expect(stats.totalUsers).toBe(2);
      expect(stats.totalEmailsLastHour).toBe(2);
      expect(stats.totalEmailsLastDay).toBe(2);
    });
  });

});

describe('Integration Tests', () => {

  it('should handle complete email validation and rate limiting flow', () => {
    const email = {
      to: 'test@example.com',
      from: 'sender@company.com',
      subject: 'Business Proposal',
      body: 'Hello, I have a business proposal for you.',
    };

    // 1. Security validation
    const securityResult = EmailSecurityValidator.validateFullEmail(email);
    expect(securityResult.isValid).toBe(true);

    // 2. Rate limiting check
    const rateLimitResult = EmailRateLimiter.checkRateLimit(
      'test-org',
      email.from!,
      email.to
    );
    expect(rateLimitResult.allowed).toBe(true);

    // 3. Spam detection
    const spamResult = EmailRateLimiter.detectSpamContent(email.subject, email.body);
    expect(spamResult.isSpam).toBe(false);

    // 4. Blacklist check
    const isBlacklisted = EmailRateLimiter.isEmailBlacklisted(email.to);
    expect(isBlacklisted).toBe(false);

    // 5. Record sent email
    EmailRateLimiter.recordEmailSent('test-org', email.from!, email.to);

    // Verify recording
    const newRateLimitResult = EmailRateLimiter.checkRateLimit(
      'test-org',
      email.from!,
      email.to
    );
    expect(newRateLimitResult.currentUsage.perMinute).toBe(1);
  });

  it('should block malicious email attempts', () => {
    const maliciousEmail = {
      to: 'test@10minutemail.com',
      subject: 'URGENT!!! FREE MONEY!!! ACT NOW!!!',
      body: 'Click here immediately: bit.ly/malware.exe <script>alert("xss")</script>',
    };

    // Security validation should fail
    const securityResult = EmailSecurityValidator.validateFullEmail(maliciousEmail);
    expect(securityResult.riskLevel).toBe('CRITICAL');

    // Spam detection should trigger
    const spamResult = EmailRateLimiter.detectSpamContent(
      maliciousEmail.subject,
      maliciousEmail.body
    );
    expect(spamResult.isSpam).toBe(true);

    // Blacklist should trigger
    const isBlacklisted = EmailRateLimiter.isEmailBlacklisted(maliciousEmail.to);
    expect(isBlacklisted).toBe(true);
  });

});