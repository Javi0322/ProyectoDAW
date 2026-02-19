const crypto = require("crypto");
const { promisify } = require("util");

const scryptAsync = promisify(crypto.scrypt);

/**
 * Genera un hash seguro para una contraseña usando scrypt.
 */
async function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString("hex"); 
  const derivedKey = await scryptAsync(plainPassword, salt, 64); 
  const hash = derivedKey.toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifica una contraseña comparando con el valor guardado "salt:hash".
 * Usamos timingSafeEqual para evitar ataques de tiempo (timing attacks).
 */
async function verifyPassword(plainPassword, storedValue) {
  const [salt, storedHash] = storedValue.split(":");
  if (!salt || !storedHash) return false;

  const derivedKey = await scryptAsync(plainPassword, salt, 64);
  const hash = derivedKey.toString("hex");

  // Comparación segura en tiempo constante
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
}

module.exports = { hashPassword, verifyPassword };
