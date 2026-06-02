const SUPABASE_URL = "https://fbvvdyirhtgvycullsqy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidnZkeWlyaHRndnljdWxsc3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3Njc5MTksImV4cCI6MjA5NDM0MzkxOX0.vzudcEhAwdAutU0g-Mra818fd8_DciepjqvU8Z-C4wc";

async function queryCount() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/producao?select=count`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'count=exact'
            }
        });
        if (!res.ok) {
            console.error("Error:", await res.text());
            return;
        }
        console.log("Headers:", res.headers.get("content-range"));
    } catch (e) {
        console.error(e);
    }
}
queryCount();
