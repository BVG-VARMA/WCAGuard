export function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return [0, 0, 0];
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length >= 6) {
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return [r, g, b];
  }
  return [0, 0, 0];
}

export function rgbToHex([r, g, b]) {
  const toHex = (c) => {
    const val = Math.max(0, Math.min(255, Math.round(c * 255)));
    return val.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getRelativeLuminance([r, g, b]) {
  const transform = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const R = transform(r);
  const G = transform(g);
  const B = transform(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function getContrastRatio(rgb1, rgb2) {
  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function rgbToHsl([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

export function hslToRgb([h, s, l]) {
  h = (h % 360) / 360;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r, g, b];
}

export function fixContrastHex(textHex, bgHex = '#ffffff', targetRatio = 4.5) {
  const textRgb = hexToRgb(textHex);
  const bgRgb = hexToRgb(bgHex);
  const currentRatio = getContrastRatio(textRgb, bgRgb);

  if (currentRatio >= targetRatio) {
    return { fixedHex: textHex, ratio: currentRatio, modified: false };
  }

  const bgLum = getRelativeLuminance(bgRgb);
  const isLightBg = bgLum >= 0.5;

  let [h, s, l] = rgbToHsl(textRgb);
  let adjustedRgb = textRgb;
  let newRatio = currentRatio;

  for (let step = 0; step < 50; step++) {
    if (isLightBg) {
      l = Math.max(0, l - 0.02);
    } else {
      l = Math.min(1, l + 0.02);
    }

    adjustedRgb = hslToRgb([h, s, l]);
    newRatio = getContrastRatio(adjustedRgb, bgRgb);

    if (newRatio >= targetRatio) break;
  }

  return {
    fixedHex: rgbToHex(adjustedRgb),
    ratio: Number(newRatio.toFixed(2)),
    previousRatio: Number(currentRatio.toFixed(2)),
    modified: true
  };
}
