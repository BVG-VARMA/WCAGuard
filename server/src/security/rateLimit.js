const ipRequestMap = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

export function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  const record = ipRequestMap.get(ip) || { count: 0, resetTime: now + WINDOW_MS };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + WINDOW_MS;
  } else {
    record.count += 1;
  }

  ipRequestMap.set(ip, record);

  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait a minute before sending more audit requests.'
    });
  }

  next();
}
