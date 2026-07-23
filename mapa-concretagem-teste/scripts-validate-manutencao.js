const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "..", "mapa-concretagem", ".env");

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^"|"$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const table = "formas_manutencao";

if (!supabaseUrl || !supabaseKey) {
  console.error(`SUPABASE_URL e SUPABASE_KEY sao obrigatorios em ${envPath}`);
  process.exit(1);
}

async function main() {
  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}?select=id,setor,forma_numero,status,updated_at&limit=1`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  });

  const bodyText = await response.text();
  let body = null;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = bodyText;
  }

  if (!response.ok) {
    console.error(`Falha ao acessar ${table} via Supabase REST.`);
    console.error(`HTTP ${response.status}`);
    console.error(body);
    console.error("A chave anon nao consegue criar tabelas. Crie a tabela pelo SQL Editor do Supabase ou exponha uma Edge Function/backend administrativo para isso.");
    process.exit(1);
  }

  console.log(`${table} acessivel via Supabase REST. Registros retornados: ${Array.isArray(body) ? body.length : 0}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
