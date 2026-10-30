import jwt from "jsonwebtoken";

// Verifica se o utilizador possui um token válido
export function autenticarToken(req, res, next) {
  try {
    const cabecalho = req.headers.authorization;

    // Verifica se o token foi enviado
    if (!cabecalho || !cabecalho.startsWith("Bearer ")) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Acesso não autorizado. Token não fornecido."
      });
    }

    // Retira a palavra Bearer e obtém apenas o token
    const token = cabecalho.split(" ")[1];

    // Verifica se o token é válido
    const dadosUtilizador = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Guarda os dados do utilizador no pedido
    req.utilizador = dadosUtilizador;

    next();

  } catch (error) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Token inválido ou expirado."
    });
  }
}


// Verifica se o perfil tem autorização para aceder à rota
export function autorizarPerfil(...perfisPermitidos) {
  return (req, res, next) => {

    console.log("Perfil do utilizador:", req.utilizador?.perfil);
    console.log("Perfis permitidos:", perfisPermitidos);

    if (!req.utilizador) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "É necessário realizar a autenticação."
      });
    }

    if (!perfisPermitidos.includes(req.utilizador.perfil)) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Não tens permissão para realizar esta operação."
      });
    }

    next();
  };
}
