import { URL } from 'url';

const ALLOWED_LOCAL_PORTS = new Set(['3000', '3001', '5000', '5173', '5174', '8080']);

/**
 * Validates a target URL against SSRF and private subnet exploits.
 */
export function validateUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { valid: false, reason: 'URL must be a non-empty string.' };
  }

  let parsed;
  try {
    parsed = new URL(inputUrl.trim());
  } catch {
    return { valid: false, reason: 'Invalid URL format.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, reason: 'Only HTTP and HTTPS protocols are permitted.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Allow-listed local demo hosts
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  if (isLocalhost) {
    if (ALLOWED_LOCAL_PORTS.has(parsed.port || '80')) {
      return { valid: true, sanitizedUrl: parsed.href };
    }
    return {
      valid: false,
      reason: `Localhost port ${parsed.port} is not in the demo allowlist. Permitted ports: ${Array.from(ALLOWED_LOCAL_PORTS).join(', ')}`
    };
  }

  // Block private and link-local IPv4 ranges (SSRF protection)
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [_, a, b] = ipv4Match.map(Number);
    if (a === 10) return { valid: false, reason: 'Access to private IP range (10.0.0.0/8) is forbidden.' };
    if (a === 127) return { valid: false, reason: 'Loopback range access is restricted.' };
    if (a === 169 && b === 254) return { valid: false, reason: 'Link-local addresses (169.254.0.0/16) are forbidden.' };
    if (a === 172 && b >= 16 && b <= 31) return { valid: false, reason: 'Access to private IP range (172.16.0.0/12) is forbidden.' };
    if (a === 192 && b === 168) return { valid: false, reason: 'Access to private IP range (192.168.0.0/16) is forbidden.' };
    if (a === 0 || a >= 224) return { valid: false, reason: 'Invalid IP address range.' };
  }

  // Block common metadata endpoints
  if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
    return { valid: false, reason: 'Cloud instance metadata endpoints are blocked.' };
  }

  return { valid: true, sanitizedUrl: parsed.href };
}
