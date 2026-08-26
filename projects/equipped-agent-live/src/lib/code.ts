// Shareable codes for a deployed assistant. No 0/O/1/I/L — these get read
// aloud in a room and typed by strangers off a rider sign.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function mintCode(len = 6): string {
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}
