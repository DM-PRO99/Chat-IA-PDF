// Variables de entorno (simuladas desde .env.local)
const envUser = "admin_Diego";
const envPass = "password123";

// Credenciales a validar
const username = "admin_Diego";
const password = "password123";

console.log("=== Validación de Credenciales ===");
console.log(`Username esperado: "${envUser}"`);
console.log(`Username ingresado: "${username}"`);
console.log(`¿Coinciden? ${username === envUser}`);
console.log();
console.log(`Password esperada: "${envPass}"`);
console.log(`Password ingresada: "${password}"`);
console.log(`¿Coinciden? ${password === envPass}`);
console.log();

const isValid = username === envUser && password === envPass;
console.log(`✅ Credenciales válidas: ${isValid}`);
