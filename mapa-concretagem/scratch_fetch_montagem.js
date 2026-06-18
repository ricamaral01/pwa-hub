const https = require('https');

const SUPABASE_URL = "https://fbvvdyirhtgvycullsqy.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidnZkeWlyaHRndnljdWxsc3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3Njc5MTksImV4cCI6MjA5NDM0MzkxOX0.vzudcEhAwdAutU0g-Mra818fd8_DciepjqvU8Z-C4wc";

const options = {
  hostname: 'fbvvdyirhtgvycullsqy.supabase.co',
  port: 443,
  path: '/rest/v1/montagem_poste?data_fabricacao=eq.2026-06-17',
  method: 'GET',
  headers: {
    'apikey': KEY,
    'Authorization': 'Bearer ' + KEY,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("Status Code:", res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log(`Encontrados ${json.length} postes montados em 2026-06-17:`);
      
      let aprovados = 0;
      let reprovados = 0;
      
      json.forEach(item => {
        if (item.status_montagem === 'Aprovado' || item.status_montagem === 'A') aprovados++;
        else if (item.status_montagem === 'Reprovado' || item.status_montagem === 'R' || item.status_montagem === 'RR') reprovados++;
        
        console.log(`- Forma ${item.forma_numero} (Setor ${item.setor}): Status ${item.status_montagem}, Inspecionado às ${item.finalizado_em || item.inicio_inspecao_montagem || 'N/A'}`);
      });
      
      console.log(`\nResumo: ${json.length} Inspecionados | ${aprovados} Aprovados | ${reprovados} Reprovados`);
      
    } catch(e) {
      console.log("Error parsing JSON", data);
    }
  });
});

req.on('error', (e) => {
  console.error(e);
});
req.end();
