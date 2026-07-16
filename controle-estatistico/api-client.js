(function(global){
  var API_URL = window.location.hostname === 'usina.concretrack.com.br'
    ? 'https://concretrack.com.br/api/controle-estatistico/v2/rompimentos-grupos'
    : '/api/controle-estatistico/v2/rompimentos-grupos';
  var DEFAULT_TIMEOUT_MS = 15000;

  function buildUrl(filters){
    var url = new URL(API_URL, window.location.origin);
    var params = Object.assign({ limit: 1000, offset: 0 }, filters || {});
    Object.keys(params).forEach(function(key){
      var value = params[key];
      if(value !== null && value !== undefined && value !== '') url.searchParams.set(key, value);
    });
    return url.toString();
  }

  function readCache(cacheKey){
    try{
      var raw = localStorage.getItem(cacheKey);
      if(!raw) return null;
      var payload = JSON.parse(raw);
      if(!payload || !Array.isArray(payload.rows)) return null;
      return payload;
    }catch(e){
      return null;
    }
  }

  function writeCache(cacheKey, payload){
    try{
      localStorage.setItem(cacheKey, JSON.stringify({
        ts: Date.now(),
        generated_at: payload.generated_at || new Date().toISOString(),
        source: payload.source || 'unknown',
        rows: payload.rows || []
      }));
    }catch(e){}
  }

  function mapGroupsToLegacyRows(v2Groups) {
    var rows = [];
    v2Groups.forEach(function(g) {
      rows.push({
        data_moldagem: g.data_moldagem,
        data_ruptura: g.data_ruptura,
        traco_id: g.traco_id,
        idade_dias: g.idade_dias,
        cp: '1',
        mpa: g.mpa_cp1 !== null && g.mpa_cp1 !== undefined ? g.mpa_cp1 : null
      });
      rows.push({
        data_moldagem: g.data_moldagem,
        data_ruptura: g.data_ruptura,
        traco_id: g.traco_id,
        idade_dias: g.idade_dias,
        cp: '2',
        mpa: g.mpa_cp2 !== null && g.mpa_cp2 !== undefined ? g.mpa_cp2 : null
      });
    });
    return rows;
  }

  async function fetchJson(url, timeoutMs){
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, timeoutMs || DEFAULT_TIMEOUT_MS);
    try{
      var response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      var data = await response.json().catch(function(){ return null; });
      if(!response.ok || !data || data.success !== true){
        var message = data && data.error && data.error.message ? data.error.message : 'Falha ao carregar dados.';
        var err = new Error(message);
        err.status = response.status;
        err.code = data && data.error && data.error.code;
        throw err;
      }
      return data;
    }finally{
      clearTimeout(timer);
    }
  }

  async function loadRows(options){
    var opts = options || {};
    var cacheKey = opts.cacheKey;
    try{
      var payload = await fetchJson(buildUrl(opts.filters), opts.timeoutMs);
      if (payload && payload.success === true && Array.isArray(payload.rows)) {
        if (payload.rows.length > 0 && payload.rows[0].mpa_cp1 !== undefined) {
          payload.rows = mapGroupsToLegacyRows(payload.rows);
        }
      }
      writeCache(cacheKey, payload);
      return {
        state: payload.rows && payload.rows.length ? 'SUCCESS' : 'EMPTY',
        rows: payload.rows || [],
        meta: payload
      };
    }catch(error){
      var cached = cacheKey ? readCache(cacheKey) : null;
      if(cached && cached.rows && cached.rows.length){
        return {
          state: 'OFFLINE_CACHE',
          rows: cached.rows,
          meta: {
            source: 'local_storage',
            generated_at: cached.generated_at || new Date(cached.ts || Date.now()).toISOString(),
            cached_at: cached.ts || null
          },
          error: error
        };
      }
      return {
        state: 'ERROR',
        rows: [],
        meta: null,
        error: error
      };
    }
  }

  function formatDateTime(value){
    if(!value) return '--';
    var d = new Date(value);
    if(isNaN(d.getTime())) return String(value);
    return d.toLocaleString('pt-BR');
  }

  global.ControleEstatisticoApi = {
    API_URL: API_URL,
    loadRows: loadRows,
    formatDateTime: formatDateTime
  };
})(window);
