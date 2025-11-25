
export const uxExtra_hashPin = async (pin: string, salt: string = 'uxExtra_salt'): Promise<string> => {
  const enc = new TextEncoder();
  const msgUint8 = enc.encode(pin + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
