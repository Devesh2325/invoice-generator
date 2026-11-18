'use client';

import React, { useMemo } from 'react';

// Code 128 character set patterns (widths of 6 alternating bars/spaces, stop character has 7)
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];

/**
 * Calculates a valid EAN-13 barcode with standard Modulo-10 checksum.
 * @param prefix Optional 3-digit country/business prefix (defaults to '890' for India GS1 standard)
 */
export function generateValidEan13(prefix: string = '890'): string {
  const cleanPrefix = prefix.replace(/\D/g, '').slice(0, 3).padEnd(3, '8');
  // Generate 9 random digits to form 12 digits
  let base12 = cleanPrefix;
  for (let i = 0; i < 9; i++) {
    base12 += Math.floor(Math.random() * 10).toString();
  }
  // Calculate checksum for the 13th digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base12[i], 10);
    sum += i % 2 === 0 ? digit * 1 : digit * 3;
  }
  const checksum = (10 - (sum % 10)) % 10;
  return `${base12}${checksum}`;
}

/**
 * Encodes ASCII string to Code 128 (Set B) bit pattern.
 */
function encodeCode128(text: string) {
  const clean = text.replace(/[^\x20-\x7E]/g, '');
  if (!clean) return null;

  const startCode = 104; // Code 128B Start
  let checksum = startCode;
  const codes = [startCode];

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i) - 32;
    codes.push(code);
    checksum += code * (i + 1);
  }

  const checkCode = checksum % 103;
  codes.push(checkCode);
  codes.push(106); // Stop symbol

  const pattern = codes.map((c) => CODE128_PATTERNS[c] || '111111').join('');
  return { pattern, text: clean };
}

interface BarcodeVisualProps {
  code: string;
  height?: number;
  moduleWidth?: number;
  showText?: boolean;
  className?: string;
  barColor?: string;
}

export const BarcodeVisual: React.FC<BarcodeVisualProps> = ({
  code,
  height = 42,
  moduleWidth = 2,
  showText = true,
  className = '',
  barColor = 'currentColor',
}) => {
  const barcodeData = useMemo(() => {
    if (!code || !code.trim()) return null;
    const encoded = encodeCode128(code.trim());
    if (!encoded) return null;

    let isBar = true;
    let x = 8 * moduleWidth; // quiet zone
    const rects: { x: number; width: number }[] = [];

    for (let i = 0; i < encoded.pattern.length; i++) {
      const w = parseInt(encoded.pattern[i], 10) * moduleWidth;
      if (isBar) {
        rects.push({ x, width: w });
      }
      x += w;
      isBar = !isBar;
    }

    const totalWidth = x + 8 * moduleWidth;
    return {
      rects,
      totalWidth,
      text: encoded.text,
    };
  }, [code, moduleWidth]);

  if (!barcodeData) {
    return (
      <div className={`flex flex-col items-center justify-center p-2 text-slate-400 text-xs italic ${className}`}>
        No Barcode
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${barcodeData.totalWidth} ${height}`}
        className="h-full w-auto max-w-full"
        style={{ minHeight: `${height}px` }}
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`Barcode: ${barcodeData.text}`}
      >
        {barcodeData.rects.map((r, idx) => (
          <rect
            key={idx}
            x={r.x}
            y={0}
            width={r.width}
            height={height}
            fill={barColor}
          />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[10px] tracking-wider text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
          {barcodeData.text}
        </span>
      )}
    </div>
  );
};
