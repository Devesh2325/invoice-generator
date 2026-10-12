/**
 * Standards-compliant ISO/IEC 18004 QR Code Matrix & SVG Generator (Byte Mode, ECC Level L).
 * Produces scannable QR codes compatible with all mobile cameras and UPI apps (GPay, PhonePe, Paytm, BHIM).
 */
export declare function encodeQrMatrix(text: string): boolean[][];
export declare function renderQrSvgDataUrl(text: string): string;
