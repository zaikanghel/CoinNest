import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create a DOM window object for DOMPurify to use on the server
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Sanitizes a string to prevent XSS attacks
 * @param input - The string to be sanitized
 * @returns Sanitized string with potentially harmful HTML/JS removed
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return purify.sanitize(input, { 
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'style', 'iframe', 'frame', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
}

/**
 * Sanitizes an object's string properties recursively
 * @param obj - The object with properties to sanitize
 * @returns A new object with all string properties sanitized
 */
export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result: Record<string, any> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        result[key] = sanitizeInput(value);
      } else if (value !== null && typeof value === 'object') {
        result[key] = sanitizeObject(value);
      } else {
        result[key] = value;
      }
    }
  }
  
  return result;
}