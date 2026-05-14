const fs = require('fs');

const SUPABASE_URL = "https://fbvvdyirhtgvycullsqy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidnZkeWlyaHRndnljdWxsc3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3Njc5MTksImV4cCI6MjA5NDM0MzkxOX0.vzudcEhAwdAutU0g-Mra818fd8_DciepjqvU8Z-C4wc";
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzhygWG5lMginoFtswVUO3CRhQv-xDTbQ2tRQXHYJY-Ul3w6vhJoISgTSPCC9h2JTo2UA/exec";

async function supabaseInsert(table, data) {
    const url = `${SUPABASE_URL}/rest/v1/${table}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const err = await res.text();
        console.error(`Erro inserindo em ${table}:`, err);
    }
}

async function gasPost(action, payload = {}) {
    const body = new URLSearchParams();
    body.set("action", action);
    body.set("payload", JSON.stringify(payload));

    const res = await fetch(GAS_API_URL, {
        method: 'POST',
        body: body
    });
    
    return await res.json();
}

async function migrateUsers() {
    console.log("Migrando usuários...");
    const res = await gasPost("listar_usuarios");
    if (res.ok && res.users) {
        for (const user of res.users) {
            await supabaseInsert("usuarios", {
                id: user.id,
                nome: user.name,
                perfil: user.role,
                senha: user.password || '1234', // Assuming we might need to set a default if not returned
                ativo: user.active
            });
        }
        console.log(`Migrados ${res.users.length} usuários.`);
    } else {
        console.error("Erro ao migrar usuários:", res);
    }
}

async function migrateProducao() {
    console.log("Atenção: A migração completa de produção exigiria ler toda a planilha.");
    console.log("Listando pendentes para demonstração de carga inicial...");
    
    const res = await gasPost("listar_inspecao_pendentes", {});
    if (res.ok && res.pendentes) {
        for (const p of res.pendentes) {
            await supabaseInsert("producao", {
                setor: p.setor,
                forma: p.forma,
                modelo: p.modelo,
                tipo_concreto: p.tipoConcreto || 'Padrão',
                data_fabricacao: p.dataProducao,
                status: 'LIBERADO'
            });
        }
        console.log(`Migrados ${res.pendentes.length} pendentes.`);
    }
}

async function run() {
    await migrateUsers();
    await migrateProducao();
    console.log("Migração de carga de dados concluída!");
}

run();
