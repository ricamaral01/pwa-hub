const SUPABASE_URL = "https://fbvvdyirhtgvycullsqy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidnZkeWlyaHRndnljdWxsc3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3Njc5MTksImV4cCI6MjA5NDM0MzkxOX0.vzudcEhAwdAutU0g-Mra818fd8_DciepjqvU8Z-C4wc";

async function testQuery() {
    try {
        // Test query with filtering by date
        const dateRes = await fetch(`${SUPABASE_URL}/rest/v1/producao?data_fabricacao=eq.2026-05-14`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        const dateData = await dateRes.json();
        console.log("Filtered by 2026-05-14 count:", dateData.length);

        // Test query with order descending
        const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/producao?order=data_fabricacao.desc,data_hora.desc&limit=5`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        const orderData = await orderRes.json();
        console.log("Ordered descending first 5 rows:", JSON.stringify(orderData.map(r => ({id: r.id, date: r.data_fabricacao, time: r.data_hora})), null, 2));

    } catch (e) {
        console.error(e);
    }
}
testQuery();
