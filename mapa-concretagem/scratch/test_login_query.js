const SUPABASE_URL = "https://fbvvdyirhtgvycullsqy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidnZkeWlyaHRndnljdWxsc3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3Njc5MTksImV4cCI6MjA5NDM0MzkxOX0.vzudcEhAwdAutU0g-Mra818fd8_DciepjqvU8Z-C4wc";

async function testRicardo() {
  const name = "Ricardo";
  const password = "1520";
  
  const url = `${SUPABASE_URL}/rest/v1/usuarios?ativo=eq.true&or=(id.ilike.${encodeURIComponent(name)},nome.ilike.${encodeURIComponent(name)})&senha=eq.${encodeURIComponent(password)}&limit=1`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  if (res.ok) {
    const data = await res.json();
    console.log("Resultado para Ricardo:", data);
  } else {
    const text = await res.text();
    console.error("ERRO:", text);
  }
}

testRicardo();
