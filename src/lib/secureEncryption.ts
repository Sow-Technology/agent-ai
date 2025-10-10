// Client-side encryption utilities for secure data transmission
// This ensures data is encrypted before leaving the user's device

export interface SecureAuditRequest {
  encryptedData: string;
  dataKey: string;
  metadata: {
    userId: string;
    timestamp: string;
    integrityHash: string;
    dataType: 'audio' | 'text';
  };
}

export interface SecureAuditResponse {
  success: boolean;
  encryptedResult?: string;
  metadata?: {
    processedAt: string;
    dataIntegrity: string;
  };
  error?: string;
}

/**
 * Encrypts audit data before sending to secure API
 */
export async function encryptAuditData(
  auditData: any,
  userId: string
): Promise<SecureAuditRequest> {
  // Generate a random encryption key for this session
  const key = await generateEncryptionKey();

  // Encrypt the audit data
  const encryptedData = await encryptData(JSON.stringify(auditData), key);

  // Create integrity hash
  const integrityHash = await generateIntegrityHash(encryptedData);

  return {
    encryptedData,
    dataKey: key,
    metadata: {
      userId,
      timestamp: new Date().toISOString(),
      integrityHash,
      dataType: auditData.audioDataUri ? 'audio' : 'text'
    }
  };
}

/**
 * Decrypts audit results received from secure API
 */
export async function decryptAuditResult(
  response: SecureAuditResponse,
  originalKey: string
): Promise<any> {
  if (!response.success || !response.encryptedResult) {
    throw new Error(response.error || 'Decryption failed');
  }

  // Decrypt the result
  const decryptedResult = await decryptData(response.encryptedResult, originalKey);

  // Verify integrity
  const expectedHash = response.metadata?.dataIntegrity;
  const actualHash = await generateIntegrityHash(decryptedResult);

  if (expectedHash !== actualHash) {
    throw new Error('Result integrity check failed');
  }

  return JSON.parse(decryptedResult);
}

/**
 * Secure API call with automatic encryption/decryption
 */
export async function callSecureQAAudit(
  auditData: any,
  userId: string
): Promise<any> {
  // Encrypt data before sending
  const secureRequest = await encryptAuditData(auditData, userId);

  // Make secure API call
  const response = await fetch('/api/ai/qa-audit-secure', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Security-Level': 'maximum'
    },
    body: JSON.stringify(secureRequest)
  });

  if (!response.ok) {
    throw new Error(`Secure API call failed: ${response.statusText}`);
  }

  const secureResponse: SecureAuditResponse = await response.json();

  // Decrypt result
  return await decryptAuditResult(secureResponse, secureRequest.dataKey);
}

// Cryptographic helper functions
async function generateEncryptionKey(): Promise<string> {
  // Generate a random 256-bit key
  const keyBytes = new Uint8Array(32);
  crypto.getRandomValues(keyBytes);

  // Convert to base64 for transmission
  return btoa(String.fromCharCode(...keyBytes));
}

async function encryptData(data: string, key: string): Promise<string> {
  // Convert base64 key back to bytes
  const keyBytes = new Uint8Array(atob(key).split('').map(c => c.charCodeAt(0)));

  // Import key for Web Crypto API
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt data
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    new TextEncoder().encode(data)
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

async function decryptData(encryptedData: string, key: string): Promise<string> {
  // Convert base64 key back to bytes
  const keyBytes = new Uint8Array(atob(key).split('').map(c => c.charCodeAt(0)));

  // Convert encrypted data back to bytes
  const encryptedBytes = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));

  // Extract IV (first 12 bytes) and encrypted data
  const iv = encryptedBytes.slice(0, 12);
  const data = encryptedBytes.slice(12);

  // Import key for Web Crypto API
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // Decrypt data
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );

  return new TextDecoder().decode(decrypted);
}

async function generateIntegrityHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = new Uint8Array(hashBuffer);

  // Convert to hex string
  return Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Utility to check if Web Crypto API is available
export function isSecureEncryptionAvailable(): boolean {
  return typeof crypto !== 'undefined' &&
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.getRandomValues === 'function';
}

// Fallback for environments without Web Crypto API
export function getEncryptionFallback(): string {
  return 'Web Crypto API not available. Please use a modern browser with HTTPS.';
}