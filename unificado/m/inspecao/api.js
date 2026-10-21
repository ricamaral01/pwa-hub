/* Minimal PostgREST adapter for the shared inspection form. No API response is cached. */
const supabaseClient = {
  from(table) {
    if (table !== 'inspecao_defeitos') throw new Error('Tabela não permitida');
    const endpoint = '/unificado/mapa/api/rest/v1/inspecao_defeitos';
    const request = async (method, query = '', body) => {
      try {
        const response = await fetch(endpoint + query, {
          method, credentials:'same-origin', cache:'no-store',
          headers:{'X-Unificado-Screen':'inspecao', 'Content-Type':'application/json',
            ...(method === 'GET' ? {} : {'Prefer':'return=minimal'})},
          ...(body === undefined ? {} : {body:JSON.stringify(body)})
        });
        if (response.status === 401) {
          location.replace('/unificado/m/inspecao/login.html');
          return {data:null,error:{message:'Sessão expirada'}};
        }
        if (!response.ok) {
          const detail = await response.json().catch(() => ({}));
          return {data:null,error:{message:detail.message || detail.error || `Erro ${response.status}`,code:detail.code}};
        }
        return {data:method === 'GET' ? await response.json() : null,error:null};
      } catch (error) {
        return {data:null,error:{message:error.message || 'Sem conexão com o banco'}};
      }
    };
    return {
      select(columns) {
        return {order(column,{ascending = true} = {}) {
          return {range(from,to) {
            const query = new URLSearchParams({select:columns,order:`${column}.${ascending ? 'asc' : 'desc'}`,offset:String(from),limit:String(to-from+1)});
            return request('GET',`?${query}`);
          }};
        }};
      },
      insert(data) { return request('POST','',data); },
      update(data) { return {eq(column,value) { return request('PATCH',`?${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`,data); }}; },
      delete() { return {eq(column,value) { return request('DELETE',`?${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`); }}; }
    };
  }
};
