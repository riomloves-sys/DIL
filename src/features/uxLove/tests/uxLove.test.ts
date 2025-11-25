
// @ts-nocheck
import { uxLove_encryptText, uxLove_decryptText, uxLove_hashPin } from '../utils/uxLove_crypto';

describe('Love Letters Crypto', () => {
  
  test('Encryption and Decryption roundtrip', async () => {
    const text = "My deepest secret";
    const pass = "supersecret123";
    
    const { cipherText, meta } = await uxLove_encryptText(text, pass);
    expect(cipherText).toBeDefined();
    expect(meta.salt).toBeDefined();
    
    const decrypted = await uxLove_decryptText(cipherText, pass, meta);
    expect(decrypted).toBe(text);
  });

  test('Decrypt fails with wrong pass', async () => {
    const text = "Secret";
    const pass = "correct";
    const { cipherText, meta } = await uxLove_encryptText(text, pass);
    
    await expect(uxLove_decryptText(cipherText, "wrong", meta)).rejects.toThrow();
  });

  test('PIN Hashing is consistent', async () => {
    const pin = "1234";
    const hash1 = await uxLove_hashPin(pin);
    const hash2 = await uxLove_hashPin(pin);
    expect(hash1).toBe(hash2);
  });

});
