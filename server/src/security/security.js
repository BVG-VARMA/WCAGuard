import { URL } from 'url';
import rateLimit from 'express-rate-limit';

const ALLOWED_LOCAL_PORTS = new Set(['3000', '3001', '5000', '5173', '5174', '8080']);

/**
 * Validates URLs according to scan environment mode ('public' or 'local').
 * Defends against SSRF, loopback probes, file:// schemas, and cloud metadata.
 */
export function validateTargetUrl(inputUrl, environment = 'public') {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { valid: false, reason: 'Target URL is required.' };
  }

  const trimmed = inputUrl.trim();

  // Explicitly block file://, gopher://, javascript:, etc.
  if (/^(file|gopher|ftp|data|javascript|vbscript):/i.test(trimmed)) {
    return { valid: false, reason: 'Unsafe protocol detected. Only http:// and https:// URLs are allowed.' };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, reason: 'Invalid URL format. Please include protocol, e.g. https://example.com' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, reason: 'Only HTTP and HTTPS protocols are permitted.' };
  }

  const hostname = parsed.hostname.toLowerCase();
  const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

  // Handle Local Development Environment
  if (environment === 'local') {
    if (!isLoopback) {
      return {
        valid: false,
        reason: 'Local Development mode allows only localhost or 127.0.0.1 targets. Use Public Website mode for external domains.'
      };
    }
    const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
    if (!ALLOWED_LOCAL_PORTS.has(port)) {
      return {
        valid: false,
        reason: `Port ${port} is not in the allowed local development ports (${Array.from(ALLOWED_LOCAL_PORTS).join(', ')}).`
      };
    }
    return { valid: true, sanitizedUrl: parsed.href };
  }

  // Handle Public Website Environment (STRICT SSRF PREVENTION)
  if (isLoopback) {
    return {
      valid: false,
      reason: 'Localhost and 127.0.0.1 are forbidden in Public Website mode. Please switch to "Local Development" mode.'
    };
  }

  // Check IPv4 ranges
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [_, a, b] = ipv4Match.map(Number);
    if (a === 10) return { valid: false, reason: 'Private IP subnet 10.0.0.0/8 is blocked for security.' };
    if (a === 127) return { valid: false, reason: 'Loopback 127.0.0.0/8 range is forbidden.' };
    if (a === 169 && b === 254) return { valid: false, reason: 'Link-local 169.254.0.0/16 address space is blocked.' };
    if (a === 172 && b >= 16 && b <= 31) return { valid: false, reason: 'Private IP subnet 172.16.0.0/12 is blocked.' };
    if (a === 192 && b === 168) return { valid: false, reason: 'Private IP subnet 192.168.0.0/16 is blocked.' };
    if (a === 0 || a >= 224) return { valid: false, reason: 'Invalid or multicast IP range.' };
  }

  // Block Cloud metadata endpoints
  if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal' || hostname === 'instance-data') {
    return { valid: false, reason: 'Cloud instance metadata endpoints are strictly blocked.' };
  }

  return { valid: true, sanitizedUrl: parsed.href };
}

/**
 * Standard Express Rate Limiter for audit, scan and repair endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Rate limit exceeded. Please wait a minute before sending further accessibility scan requests.'
  }
});
