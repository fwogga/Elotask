// Gera uma chave AES-256 aleatória para CHAMADAS_CHAVE. Guarde-a no .env (nunca no Git).
console.log(require('crypto').randomBytes(32).toString('base64'));