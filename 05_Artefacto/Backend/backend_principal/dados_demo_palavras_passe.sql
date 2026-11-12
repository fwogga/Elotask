-- Só para testes: põe a palavra-passe "elotask123" nos utilizadores de exemplo,
-- que vêm na base de dados com um hash falso e por isso não conseguem fazer login.
UPDATE utilizadores
SET password_hash = '$2b$10$uI7sdOSTE6vAh11J.UOJuOcnoRni8XnDaRGwAqZG9wconHdIT9J5q'
WHERE password_hash LIKE 'HASH_DE_TESTE%' OR password_hash = 'DEV_SEM_PALAVRA_PASSE';
