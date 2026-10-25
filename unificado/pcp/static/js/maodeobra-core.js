/* Regras e transporte compartilhados pelas vistas desktop e mobile de Mão de Obra. */
(() => {
  'use strict';

  function parseQuantity(value) {
    const text = String(value ?? '').trim().replace(',', '.');
    if (!text) return 0;
    if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(text)) return NaN;
    const number = Number(text);
    return Number.isFinite(number) && number <= 999.99 &&
      Math.abs(number * 2 - Math.round(number * 2)) < 0.000001 ? number : NaN;
  }

  function formatQuantity(value) {
    return Number(value || 0).toLocaleString('pt-BR', {maximumFractionDigits: 2});
  }

  function sortActivities(activities) {
    return [...activities].sort((a, b) => a.tipo === b.tipo
      ? a.ordem - b.ordem || a.id - b.id : a.tipo === 'MOD' ? -1 : 1);
  }

  function calculate(entries) {
    const totals = {MOD: 0, MOI: 0};
    const invalid = [];
    for (const entry of entries) {
      const number = parseQuantity(entry.value);
      if (!['MOD', 'MOI'].includes(entry.tipo) || Number.isNaN(number)) {
        invalid.push(entry.atividade_id);
      } else {
        totals[entry.tipo] += number;
      }
    }
    return {MOD: totals.MOD, MOI: totals.MOI,
      total: totals.MOD + totals.MOI, valid: invalid.length === 0, invalid};
  }

  function hasEdits(activities, values, day) {
    if (!day?.lancado) return true;
    const previous = new Map((day.itens || []).map(item =>
      [Number(item.atividade_id), Number(item.quantidade_pessoas)]));
    return activities.some(activity =>
      parseQuantity(values[activity.id] ?? '') !== (previous.get(Number(activity.id)) ?? 0));
  }

  async function loadDay(api, data, grupo) {
    const [activities, day] = await Promise.all([
      api.get(`/api/atividades-maodeobra?grupo_setor=${grupo}&ativo=true`),
      api.get(`/api/maodeobra/dia?data=${data}&grupo_setor=${grupo}`),
    ]);
    return {activities: sortActivities(activities), day};
  }

  function prepareSubmission({data, grupo_setor, activities, values, sem_producao = false, motivo = null, confirmar = false}) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data || '') || !['12', '34'].includes(grupo_setor) ||
        !Array.isArray(activities) || !activities.length) {
      throw new Error('Informe a data e aguarde as atividades');
    }
    const entries = activities.map(activity => ({
      atividade_id: Number(activity.id), tipo: activity.tipo,
      value: values[activity.id] ?? '',
    }));
    const totals = calculate(entries);
    if (!sem_producao && !totals.valid) {
      throw new Error('Use quantidades de 0,5 em 0,5, com ponto ou vírgula');
    }
    const items = entries.map(entry => ({
      atividade_id: entry.atividade_id,
      quantidade_pessoas: sem_producao ? 0 : parseQuantity(entry.value),
    }));
    const payload = {data, grupo_setor, sem_producao, itens: items};
    if (sem_producao && motivo?.trim()) payload.motivo = motivo.trim();
    if (confirmar) payload.confirmar = true;
    return {payload, totals};
  }

  async function saveGroup(api, options) {
    const {payload, totals} = prepareSubmission(options);
    try {
      const response = await api.post('/api/maodeobra/grupo', payload);
      return {response, payload, totals, confirmedAfterTimeout: false};
    } catch (error) {
      if (error?.name !== 'TypeError' && error?.name !== 'AbortError') throw error;
      try {
        const check = await readBeforeRetry(api, payload);
        if (check.matches) return {response: check.day, payload, totals, confirmedAfterTimeout: true};
      } catch (_) {
        // Preserva o erro original e os valores digitados; nenhum reenvio automático.
      }
      throw error;
    }
  }

  async function readBeforeRetry(api, payload) {
    const day = await api.get(`/api/maodeobra/dia?data=${payload.data}&grupo_setor=${payload.grupo_setor}`);
    const actual = new Map((day.itens || []).map(item => [Number(item.atividade_id), Number(item.quantidade_pessoas)]));
    const matches = day.lancado && day.sem_producao === payload.sem_producao &&
      Boolean(day.confirmado) === Boolean(payload.confirmar) &&
      (!payload.sem_producao || (day.motivo || null) === (payload.motivo || null)) &&
      actual.size === payload.itens.length && payload.itens.every(item =>
        actual.get(item.atividade_id) === item.quantidade_pessoas);
    return {day, matches};
  }

  async function confirmGroup(api, {data, grupo_setor, salvo_em}) {
    if (!salvo_em) throw new Error('Recarregue o dia antes de confirmar');
    const response = await api.post('/api/maodeobra/grupo/confirmar',
      {data, grupo_setor, salvo_em});
    return response;
  }

  window.MaoDeObraCore = Object.freeze({
    parseQuantity, formatQuantity, sortActivities, calculate, hasEdits,
    loadDay, prepareSubmission, saveGroup, readBeforeRetry, confirmGroup,
  });
})();
