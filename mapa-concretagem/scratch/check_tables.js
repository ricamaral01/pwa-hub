const SUPABASE_URL = "https://fbvvdyirhtgvycullsqy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidnZkeWlyaHRndnljdWxsc3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3Njc5MTksImV4cCI6MjA5NDM0MzkxOX0.vzudcEhAwdAutU0g-Mra818fd8_DciepjqvU8Z-C4wc";

async function testTable(table) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?limit=1`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  if (res.ok) {
    const data = await res.json();
    console.log(`Tabela '${table}' EXISTE! Primeiro item:`, data);
    return true;
  } else {
    const text = await res.text();
    console.log(`Tabela '${table}' NÃO existe. Erro:`, text);
    return false;
  }
}

async function run() {
  await testTable('programacao');
  await testTable('programacoes');
  await testTable('produto');
  await testTable('produtos');
}

run();
