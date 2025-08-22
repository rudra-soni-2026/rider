declare module 'jsqr' {
  interface QRLocationPoint {
    x: number;
    y: number;
  }
  interface QRLocation {
    topLeftCorner: QRLocationPoint;
    topRightCorner: QRLocationPoint;
    bottomLeftCorner: QRLocationPoint;
    bottomRightCorner: QRLocationPoint;
  }
  interface QRCode {
    binaryData: Uint8ClampedArray;
    data: string;
    chunks: any[];
    version: number;
    location: QRLocation;
  }
  export default function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: { inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst' }
  ): QRCode | null;
}
