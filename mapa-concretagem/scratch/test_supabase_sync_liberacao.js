const SUPABASE_URL = "https://fbvvdyirhtgvycullsqy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidnZkeWlyaHRndnljdWxsc3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3Njc5MTksImV4cCI6MjA5NDM0MzkxOX0.vzudcEhAwdAutU0g-Mra818fd8_DciepjqvU8Z-C4wc";

async function testSync() {
    try {
        const data = "2026-05-14"; // Using a date that has data
        const res = await fetch(`${SUPABASE_URL}/rest/v1/producao?data_fabricacao=eq.${data}`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        if (!res.ok) {
            console.error("Error:", await res.text());
            return;
        }
        const rows = await res.json();
        console.log(`Fetched ${rows.length} rows for date ${data}`);
        
        // Mocking getClickedFormsToday format
        const clicked = {
            dia: "28/05/2026",
            formas: {}
        };
        
        rows.forEach(row => {
            if (row.forma && row.setor) {
                const key = row.setor + "||" + String(row.forma).toUpperCase();
                clicked.formas[key] = true;
            }
        });
        
        console.log("Sync output example keys count:", Object.keys(clicked.formas).length);
        console.log("Example keys:", Object.keys(clicked.formas).slice(0, 10));
    } catch (e) {
        console.error(e);
    }
}
testSync();
