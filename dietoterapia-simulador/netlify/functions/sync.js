// Netlify Serverless Function para Sincronização em Nuvem do DietoCase
// Permite que qualquer alteração do professor seja sincronizada instantaneamente nos celulares dos alunos
let memoryStorage = null;

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Teacher-Password, Authorization",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  // GET: Retorna os dados mais recentes para os alunos
  if (event.httpMethod === "GET") {
    if (!memoryStorage) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          app: "DietoCase",
          version: 2,
          updatedAt: new Date().toISOString(),
          disciplinas: [],
          cases: []
        })
      };
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(memoryStorage)
    };
  }

  // POST: Atualização enviada pelo professor
  if (event.httpMethod === "POST") {
    try {
      const data = JSON.parse(event.body || "{}");
      const pwd = event.headers["x-teacher-password"] || data.password;

      if (pwd !== "Nutri2@26") {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ success: false, message: "Senha não autorizada." })
        };
      }

      const updatedAt = new Date().toISOString();
      memoryStorage = {
        app: "DietoCase",
        version: 2,
        updatedAt: updatedAt,
        disciplinas: data.disciplinas || [],
        cases: data.cases || []
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: "Sincronizado na nuvem com sucesso!",
          updatedAt: updatedAt
        })
      };
    } catch (err) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: "JSON inválido." })
      };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ message: "Método não permitido" }) };
};
