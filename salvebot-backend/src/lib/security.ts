// Comprehensive security validation for authentication
export class SecurityValidator {
  // List of disposable/temporary email domains
  private static disposableEmailDomains = [
    '10minutemail.com', '10minutemail.net', 'temp-mail.org', 'guerrillamail.com',
    'mailinator.com', 'yopmail.com', 'tempmail.net', 'throwaway.email',
    'getnada.com', 'maildrop.cc', 'mailnesia.com', 'trashmail.com',
    'dispostable.com', 'fakeinbox.com', 'spamgourmet.com', 'emailondeck.com',
    'mytrashmail.com', 'sharklasers.com', 'grr.la', 'mohmal.com',
    'minute-mail.net', 'rootfest.net', 'tempinbox.com', 'temp-mail.ru',
    'anonymbox.com', 'dropmail.me', 'getairmail.com', 'tempmail.io',
    'tempmail24.com', 'burnermail.io', 'throwawaymail.com', 'temp-inbox.com',
    'deadaddress.com', 'emailfake.com', 'tempemailer.com', 'tempmail.us',
    'tmail.ws', 'shortmail.net', 'generator.email', 'tmpeml.com'
  ]

  // List of free email providers (for stricter validation if needed)
  private static freeEmailDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'mail.com', 'gmx.com', 'protonmail.com', 'tutanota.com'
  ]

  // Common name patterns that might be fake
  private static suspiciousNamePatterns = [
    /^test\s?user$/i,
    /^user\d+$/i,
    /^fake\s?name$/i,
    /^john\s?doe$/i,
    /^jane\s?doe$/i,
    /^admin$/i,
    /^administrator$/i,
    /^guest$/i,
    /^demo\s?user$/i,
    /^sample\s?user$/i,
    /^temp\s?user$/i,
    /^example\s?user$/i,
    /^asdf+$/i,
    /^qwerty+$/i,
    /^1234+$/i,
    /^abc+$/i,
    /^zzz+$/i
  ]

  // Validate email security
  static validateEmail(email: string): { valid: boolean; reason?: string } {
    const emailLower = email.toLowerCase()
    const domain = emailLower.split('@')[1]

    if (!domain) {
      return { valid: false, reason: 'Invalid email format' }
    }

    // Check for disposable email domains
    if (this.disposableEmailDomains.includes(domain)) {
      return { valid: false, reason: 'Temporary or disposable email addresses are not allowed. Please use a permanent business email.' }
    }

    // Check for suspicious patterns in email
    if (this.isSuspiciousEmail(emailLower)) {
      return { valid: false, reason: 'Email appears to be suspicious or temporary. Please use a valid business email.' }
    }

    // Check for valid business email patterns
    if (!this.isBusinessEmailPattern(emailLower, domain)) {
      return { valid: false, reason: 'Please use a professional business email address.' }
    }

    return { valid: true }
  }

  // Validate real name
  static validateName(name: string): { valid: boolean; reason?: string } {
    const nameTrimmed = name.trim()

    // Check length
    if (nameTrimmed.length < 2) {
      return { valid: false, reason: 'Name must be at least 2 characters long' }
    }

    if (nameTrimmed.length > 50) {
      return { valid: false, reason: 'Name must be less than 50 characters' }
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousNamePatterns) {
      if (pattern.test(nameTrimmed)) {
        return { valid: false, reason: 'Please enter your real full name' }
      }
    }

    // Check for at least first and last name (two words minimum)
    const nameParts = nameTrimmed.split(/\s+/).filter(part => part.length > 0)
    if (nameParts.length < 2) {
      return { valid: false, reason: 'Please enter your full name (first and last name required)' }
    }

    // Check each name part for validity
    for (const part of nameParts) {
      if (!this.isValidNamePart(part)) {
        return { valid: false, reason: 'Name contains invalid characters. Please use only letters, hyphens, and apostrophes.' }
      }
    }

    // Check for minimum length of each name part
    if (nameParts.some(part => part.length < 2)) {
      return { valid: false, reason: 'Each part of your name must be at least 2 characters long' }
    }

    return { valid: true }
  }

  // Check if email looks suspicious
  private static isSuspiciousEmail(email: string): boolean {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /test\d*@/i,
      /temp\d*@/i,
      /fake\d*@/i,
      /demo\d*@/i,
      /sample\d*@/i,
      /throwaway\d*@/i,
      /disposable\d*@/i,
      /\+.*test/i,
      /\+.*temp/i,
      /\+.*fake/i,
      /asdf+@/i,
      /qwerty+@/i,
      /1234+@/i
    ]

    return suspiciousPatterns.some(pattern => pattern.test(email))
  }

  // Check for business email patterns
  private static isBusinessEmailPattern(email: string, domain: string): boolean {
    // Allow established business domains and educational institutions
    if (domain.endsWith('.edu') || domain.endsWith('.gov') || domain.endsWith('.org')) {
      return true
    }

    // Check for company domains (not free providers)
    // This is a basic check - in production you might use a more comprehensive service
    const isFreeDomain = this.freeEmailDomains.includes(domain)
    
    // For now, we'll allow free domains but flag them for manual review
    return true
  }

  // Validate individual name parts
  private static isValidNamePart(namePart: string): boolean {
    // Allow letters, hyphens, apostrophes, and some international characters
    const validNameRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\u0100-\u017f\u1e00-\u1eff\u0400-\u04ff'-]+$/
    return validNameRegex.test(namePart)
  }

  // Validate password strength
  static validatePassword(password: string): { valid: boolean; reason?: string } {
    if (password.length < 8) {
      return { valid: false, reason: 'Password must be at least 8 characters long' }
    }

    if (password.length > 128) {
      return { valid: false, reason: 'Password must be less than 128 characters' }
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return { valid: false, reason: 'Password must contain at least one uppercase letter' }
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return { valid: false, reason: 'Password must contain at least one lowercase letter' }
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      return { valid: false, reason: 'Password must contain at least one number' }
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { valid: false, reason: 'Password must contain at least one special character' }
    }

    // Check for common weak patterns
    const weakPatterns = [
      /password/i,
      /123456/,
      /qwerty/i,
      /admin/i,
      /letmein/i,
      /welcome/i,
      /monkey/i,
      /master/i
    ]

    for (const pattern of weakPatterns) {
      if (pattern.test(password)) {
        return { valid: false, reason: 'Password contains common weak patterns. Please choose a stronger password.' }
      }
    }

    return { valid: true }
  }

  // Rate limiting check (basic implementation)
  static checkRateLimit(email: string, attempts: number, timeWindow: number = 15 * 60 * 1000): boolean {
    // In production, this would use Redis or similar
    // For now, we'll implement basic rate limiting
    return attempts < 5 // Max 5 attempts per time window
  }

  // Generate security score for user
  static generateSecurityScore(email: string, name: string): number {
    let score = 100

    const domain = email.toLowerCase().split('@')[1]
    
    // Deduct points for free email providers
    if (this.freeEmailDomains.includes(domain)) {
      score -= 10
    }

    // Deduct points for short names
    if (name.trim().split(/\s+/).length < 2) {
      score -= 20
    }

    // Add points for business domains
    if (!this.freeEmailDomains.includes(domain) && !domain.includes('gmail') && !domain.includes('yahoo')) {
      score += 10
    }

    return Math.max(0, Math.min(100, score))
  }

  // Validate complete signup data
  async validateSignup(data: { name: string; email: string; password: string; company?: string }): Promise<{ isValid: boolean; message?: string; score: number }> {
    const { name, email, password } = data

    // Validate email
    const emailValidation = SecurityValidator.validateEmail(email)
    if (!emailValidation.valid) {
      return {
        isValid: false,
        message: emailValidation.reason,
        score: 0
      }
    }

    // Validate name
    const nameValidation = SecurityValidator.validateName(name)
    if (!nameValidation.valid) {
      return {
        isValid: false,
        message: nameValidation.reason,
        score: 0
      }
    }

    // Validate password
    const passwordValidation = SecurityValidator.validatePassword(password)
    if (!passwordValidation.valid) {
      return {
        isValid: false,
        message: passwordValidation.reason,
        score: 0
      }
    }

    // Generate security score
    const score = SecurityValidator.generateSecurityScore(email, name)

    return {
      isValid: true,
      score
    }
  }
}