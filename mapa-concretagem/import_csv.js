const fs = require('fs');

const SUPABASE_URL = "https://fbvvdyirhtgvycullsqy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidnZkeWlyaHRndnljdWxsc3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3Njc5MTksImV4cCI6MjA5NDM0MzkxOX0.vzudcEhAwdAutU0g-Mra818fd8_DciepjqvU8Z-C4wc";

async function supabaseInsert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) console.error(`Error in ${table}:`, await res.text());
}

function parseCSVLine(text) {
    let result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
            result.push(cur);
            cur = '';
        } else {
            cur += c;
        }
    }
    result.push(cur);
    return result;
}

async function fetchAndMigrateProducao() {
    console.log("Baixando Pagina1...");
    const url = "https://docs.google.com/spreadsheets/d/1uV-H5hGRyqR04xb9wKF8__xl5-XLt68CEKKkM30JF1o/gviz/tq?tqx=out:csv&sheet=Pagina1";
    
    const response = await fetch(url);
    const text = await response.text();
    const rows = text.split('\n').filter(r => r.trim());
    
    if (rows.length <= 1) {
        console.log("Nenhum dado na Pagina1.");
        return;
    }
    
    const headers = parseCSVLine(rows[0]);
    let batch = [];
    let count = 0;
    
    for (let i = 1; i < rows.length; i++) {
        const row = parseCSVLine(rows[i]);
        if (row.length < headers.length) continue;
        
        let record = {};
        headers.forEach((h, idx) => {
            record[h] = row[idx];
        });
        
        if (record.liberacao_status !== '1') continue;

        let statusFinal = 'LIBERADO';
        if (record.ins_status && record.ins_status.trim() !== '') {
            statusFinal = 'INSPECIONADO';
        }

        batch.push({
            id: record.record_id || undefined,
            setor: record.setor,
            forma: record.forma_numero,
            modelo: record.modelo,
            tipo_concreto: 'Padrão',
            colaborador: record.lib_colaborador || '',
            data_fabricacao: record.data_fabricacao,
            status: statusFinal
        });

        if (batch.length >= 50) {
            await supabaseInsert("producao", batch);
            count += batch.length;
            batch.length = 0;
            console.log(`Producao: inseridas ${count} linhas...`);
        }
    }
    
    if (batch.length > 0) {
        await supabaseInsert("producao", batch);
        count += batch.length;
    }
    console.log(`Migração Produção concluída: ${count} registros inseridos.`);
}

async function fetchAndMigrateMontagem() {
    console.log("Baixando montagem_poste...");
    const url = "https://docs.google.com/spreadsheets/d/1uV-H5hGRyqR04xb9wKF8__xl5-XLt68CEKKkM30JF1o/gviz/tq?tqx=out:csv&sheet=montagem_poste";
    
    const response = await fetch(url);
    const text = await response.text();
    const rows = text.split('\n').filter(r => r.trim());
    
    if (rows.length <= 1) {
        console.log("Nenhum dado na montagem_poste.");
        return;
    }
    
    const headers = parseCSVLine(rows[0]);
    let batch = [];
    let count = 0;
    
    for (let i = 1; i < rows.length; i++) {
        const row = parseCSVLine(rows[i]);
        if (row.length < headers.length) continue;
        
        let record = {};
        headers.forEach((h, idx) => {
            record[h] = row[idx];
        });
        
        // Colunas montagem_poste no GAS backend: key, recordId, dataFabricacao, setor, formaNumero, modelo, statusMontagem, motivoRecusa, etapa, inicio, fim, checklists, banco, observacoes, montador
        
        if (!record.key) continue;

        let checklists = {};
        try { if(record.checklists) checklists = JSON.parse(record.checklists); } catch(e){}

        batch.push({
            id: record.key,
            record_id: record.recordId,
            data_fabricacao: record.dataFabricacao,
            setor: record.setor,
            forma_numero: record.formaNumero,
            modelo: record.modelo,
            status_montagem: record.statusMontagem,
            motivo_recusa: record.motivoRecusa,
            etapa: record.etapa,
            checklists: checklists,
            observacoes_montagem: record.observacoes,
            montador_nome: record.montador
        });

        if (batch.length >= 50) {
            await supabaseInsert("montagem_poste", batch);
            count += batch.length;
            batch.length = 0;
            console.log(`Montagem: inseridas ${count} linhas...`);
        }
    }
    
    if (batch.length > 0) {
        await supabaseInsert("montagem_poste", batch);
        count += batch.length;
    }
    console.log(`Migração Montagem concluída: ${count} registros inseridos.`);
}

async function run() {
    await fetchAndMigrateProducao();
    await fetchAndMigrateMontagem();
    console.log("Migração completa!");
}

run();
