'use strict';

// This intentionally supports a small, explicitly documented schema subset.
function checkBody(value, schema) {
  const errors = [];
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) throw new TypeError('schema harus berupa objek');
  const types = ['string', 'number', 'boolean', 'object', 'array', 'null'];
  function walk(v, s, path) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) throw new TypeError('aturan schema tidak valid');
    for (const k of Object.keys(s)) if (!['type','required','properties'].includes(k)) throw new TypeError('kata kunci schema tidak didukung: ' + k);
    if (!types.includes(s.type)) throw new TypeError('type schema tidak didukung');
    if ((s.required !== undefined || s.properties !== undefined) && s.type !== 'object') throw new TypeError('properties dan required hanya untuk object');
    const actual = v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;
    if (actual !== s.type || (actual === 'number' && !Number.isFinite(v))) { errors.push(path + ': expected ' + s.type + ', got ' + actual); return; }
    if (s.type === 'object') {
      const props = s.properties ?? {};
      if (!props || typeof props !== 'object' || Array.isArray(props)) throw new TypeError('properties harus objek');
      const required = s.required ?? [];
      if (!Array.isArray(required) || required.some(x => typeof x !== 'string')) throw new TypeError('required harus array string');
      for (const name of required) if (!Object.hasOwn(v,name)) errors.push(path + '.' + name + ': missing');
      for (const [name, rule] of Object.entries(props)) if (Object.hasOwn(v,name)) walk(v[name],rule,path + '.' + name);
    }
  }
  walk(value,schema,'$');
  return errors;
}
async function checkContract(url, contract, options = {}) {
  const parsed = new URL(url);
  if (!['http:','https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new TypeError('URL harus HTTP(S) tanpa kredensial');
  if (!contract || !Number.isInteger(contract.status) || contract.status < 100 || contract.status > 599) throw new TypeError('status kontrak tidak valid');
  const timeoutMs = options.timeoutMs ?? 3000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) throw new TypeError('timeout harus 1–30000 ms');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(),timeoutMs);
  try {
    const response = await (options.fetch ?? fetch)(url,{signal:controller.signal,redirect:'manual'});
    const errors = [];
    if (response.status !== contract.status) errors.push('status: expected ' + contract.status + ', got ' + response.status);
    for (const [key,value] of Object.entries(contract.headers ?? {})) {
      if (response.headers.get(key) !== value) errors.push('header ' + key + ': mismatch');
    }
    if (contract.schema) {
      let body;
      try { body = await response.json(); } catch(e) { if (controller.signal.aborted) throw e; errors.push('body: invalid JSON'); }
      if (body !== undefined) errors.push(...checkBody(body,contract.schema));
    }
    return { ok: errors.length === 0, errors };
  } catch (error) {
    return { ok:false, errors:[controller.signal.aborted ? 'request timeout' : 'request gagal'] };
  } finally { clearTimeout(timer); }
}
module.exports = { checkBody, checkContract };
