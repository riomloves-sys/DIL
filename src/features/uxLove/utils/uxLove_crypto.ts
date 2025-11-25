
/**
 * uxLove_crypto.ts
 * Client-side AES-GCM encryption helpers.
 * 
 * SECURITY NOTE:
 * Keys are derived from user passphrases using PBKDF2.
 * Encryption happens entirely in the browser.
 * Passphrases are NEVER sent to the server.
 * If a passphrase is lost, the content is permanently unrecoverable.
 */

const SALT_LEN = 16;
const IV_LEN = 12;
const ITERATIONS = 100000;

// Convert string to Uint8Array
const enc = new TextEncoder();
const dec = new TextDecoder();

// Derive a CryptoKey from a password and salt
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function uxLove_encryptText(plainText: string, passphrase: string) {
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LEN));
  
  const key = await deriveKey(passphrase, salt);
  
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plainText)
  );

  // Convert to base64 for storage
  const cipherText = btoa(String.fromCharCode(...new Uint8Array(encryptedContent)));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    cipherText,
    meta: { salt: saltHex, iv: ivHex }
  };
}

export async function uxLove_decryptText(cipherText: string, passphrase: string, meta: { salt: string, iv: string }) {
  try {
    // Hex to Uint8Array
    const salt = new Uint8Array(meta.salt.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const iv = new Uint8Array(meta.iv.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    
    // Base64 to Uint8Array
    const cipherBytes = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0));

    const key = await deriveKey(passphrase, salt);

    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipherBytes
    );

    return dec.decode(decryptedContent);
  } catch (e) {
    console.error("Decryption failed", e);
    throw new Error("Incorrect passphrase or corrupted data");
  }
}

export async function uxLove_hashPin(pin: string): Promise<string> {
  const msgUint8 = enc.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
