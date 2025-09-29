import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create a virtual DOM for DOMPurify
const window = new JSDOM('').window;
const dompurify = DOMPurify(window);

// Sanitize HTML content to prevent XSS attacks
export function sanitizeHtml(html: string): string {
  return dompurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'title', 'target'],
  });
}

// Sanitize text content by removing potentially dangerous characters
export function sanitizeText(text: string): string {
  if (!text) return '';

  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[\u2028\u2029]/g, '') // Remove line/paragraph separators
    .trim();
}

// Sanitize strings that will be used in SQL queries to prevent injection
export function sanitizeSqlString(value: string): string {
  if (!value) return '';

  // Replace single quotes with double quotes
  return value.replace(/'/g, "''");
}

// Sanitize product data
export function sanitizeProductData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };

  // Sanitize string fields
  if (sanitized.title) sanitized.title = sanitizeText(sanitized.title);
  if (sanitized.description) sanitized.description = sanitizeHtml(sanitized.description);
  if (sanitized.vendor) sanitized.vendor = sanitizeText(sanitized.vendor);
  if (sanitized.productType) sanitized.productType = sanitizeText(sanitized.productType);
  if (sanitized.seoTitle) sanitized.seoTitle = sanitizeText(sanitized.seoTitle);
  if (sanitized.seoDescription) sanitized.seoDescription = sanitizeText(sanitized.seoDescription);
  if (sanitized.optimizedDescription) sanitized.optimizedDescription = sanitizeHtml(sanitized.optimizedDescription);

  // Sanitize arrays
  if (Array.isArray(sanitized.tags)) {
    sanitized.tags = sanitized.tags.map(tag => sanitizeText(tag));
  }

  // Handle nested objects
  if (Array.isArray(sanitized.variants)) {
    sanitized.variants = sanitized.variants.map((variant: any) => ({
      ...variant,
      title: variant.title ? sanitizeText(variant.title) : '',
      sku: variant.sku ? sanitizeText(variant.sku) : '',
    }));
  }

  if (Array.isArray(sanitized.images)) {
    sanitized.images = sanitized.images.map((image: any) => ({
      ...image,
      src: image.src ? sanitizeText(image.src) : '',
      altText: image.altText ? sanitizeText(image.altText) : undefined,
    }));
  }

  return sanitized;
}

// Sanitize optimization version data
export function sanitizeOptimizationVersionData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };

  // Sanitize string fields
  if (sanitized.originalTitle) sanitized.originalTitle = sanitizeText(sanitized.originalTitle);
  if (sanitized.originalDescription) sanitized.originalDescription = sanitizeHtml(sanitized.originalDescription);
  if (sanitized.originalSeoTitle) sanitized.originalSeoTitle = sanitizeText(sanitized.originalSeoTitle);
  if (sanitized.originalSeoDescription) sanitized.originalSeoDescription = sanitizeText(sanitized.originalSeoDescription);
  if (sanitized.optimizedTitle) sanitized.optimizedTitle = sanitizeText(sanitized.optimizedTitle);
  if (sanitized.optimizedDescription) sanitized.optimizedDescription = sanitizeHtml(sanitized.optimizedDescription);
  if (sanitized.optimizedSeoTitle) sanitized.optimizedSeoTitle = sanitizeText(sanitized.optimizedSeoTitle);
  if (sanitized.optimizedSeoDescription) sanitized.optimizedSeoDescription = sanitizeText(sanitized.optimizedSeoDescription);
  if (sanitized.aiProvider) sanitized.aiProvider = sanitizeText(sanitized.aiProvider);

  return sanitized;
}

// Sanitize content review data
export function sanitizeContentReviewData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };

  // Sanitize string fields
  if (sanitized.reviewer) sanitized.reviewer = sanitizeText(sanitized.reviewer);
  if (sanitized.feedback) sanitized.feedback = sanitizeHtml(sanitized.feedback);

  return sanitized;
}

// Sanitize AI provider data
export function sanitizeAiProviderData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };

  // Sanitize string fields
  if (sanitized.name) sanitized.name = sanitizeText(sanitized.name);
  if (sanitized.baseUrl) sanitized.baseUrl = sanitizeText(sanitized.baseUrl);

  return sanitized;
}

// Validate and sanitize email addresses
export function sanitizeEmail(email: string): string {
  if (!email) return '';

  // Basic email sanitization
  return email
    .toLowerCase()
    .trim()
    .replace(/[^\w.@-]/g, '');
}

// Validate and sanitize URLs
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  try {
    // Try to create a URL object to validate
    new URL(url);
    return url;
  } catch {
    return '';
  }
}

// Sanitize file paths to prevent directory traversal
export function sanitizeFilePath(path: string): string {
  if (!path) return '';

  // Remove directory traversal attempts
  return path.replace(/\.\.\//g, '').replace(/\.\//g, '');
}

// Utility function to validate file extensions
export function isValidFileExtension(filename: string, allowedExtensions: string[]): boolean {
  if (!filename) return false;

  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedExtensions.includes(extension) : false;
}

// Deep sanitize nested objects
export function deepSanitize(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = deepSanitize(value);
    }
    return sanitized;
  }

  return obj;
}