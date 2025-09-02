import crypto from 'node:crypto';

/**
 * Verify HMAC signature for webhook security
 */
export function verifyHmacSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    const providedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}

/**
 * Generate HMAC signature for testing
 */
export function generateHmacSignature(payload: string | Buffer, secret: string): string {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return `sha256=${signature}`;
}
