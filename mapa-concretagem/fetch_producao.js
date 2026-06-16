const fs = require('fs');

const SUPABASE_URL = "https://fbvvdyirhtgvycullsqy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidnZkeWlyaHRndnljdWxsc3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3Njc5MTksImV4cCI6MjA5NDM0MzkxOX0.vzudcEhAwdAutU0g-Mra818fd8_DciepjqvU8Z-C4wc";

async function fetchTable(table) {
    let allRows = [];
    let page = 0;
    const pageSize = 1000;
    let keepFetching = true;
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    while (keepFetching) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&data_fabricacao=gte.2026-06-10&data_fabricacao=lte.2026-06-16&order=data_fabricacao.desc&offset=${from}&limit=${pageSize}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (res.ok) {
            const data = await res.json();
            allRows = allRows.concat(data);
            if (data.length < pageSize || page >= 5) {
                keepFetching = false;
            } else {
                page++;
            }
        } else {
            const err = await res.text();
            console.error(`Erro ao buscar ${table}:`, err);
            keepFetching = false;
            return;
        }
    }
    
    fs.writeFileSync(`${table}_export.json`, JSON.stringify(allRows, null, 2));
    console.log(`Salvos ${allRows.length} registros da tabela '${table}' no arquivo ${table}_export.json`);
}

async function run() {
    console.log("Buscando dados de produção no Supabase...");
    await fetchTable("producao");
    await fetchTable("inspecao_lote");
    await fetchTable("montagem_postes");
}

run();
