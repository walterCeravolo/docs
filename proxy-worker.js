// PROXY per Tivù Player (Cloudflare Workers, piano gratuito).
// A cosa serve: i canali con indirizzo http non si aprono da una pagina https, e alcuni server non permettono la lettura
// da un sito web (CORS). Il proxy li legge al posto del browser e li restituisce in https.
//
// Come si attiva:
//   1. dash.cloudflare.com > Workers & Pages > Create > Worker > incolla questo file > Deploy
//   2. cambia CHIAVE qui sotto con una parola segreta tua (cosi' il proxy lo usi solo tu)
//   3. in Tivù Player > Impostazioni > Proxy scrivi:  https://NOME.workers.dev/?key=CHIAVE&url=
// Nota: tutto il video passa dal proxy; il piano gratuito ha un limite di richieste al giorno.
const CHIAVE = "cambia-questa-chiave";

export default {
  async fetch(req) {
    const u = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });
    if (u.searchParams.get("key") !== CHIAVE) return new Response("chiave errata", { status: 403, headers: cors() });
    const target = u.searchParams.get("url") || "";
    if (!/^https?:\/\//i.test(target)) return new Response("manca url", { status: 400, headers: cors() });
    const fwd = new Headers();
    for (const k of ["range", "user-agent", "accept"]) { const v = req.headers.get(k); if (v) fwd.set(k, v); }
    const r = await fetch(target, { headers: fwd, redirect: "follow" });
    const out = new Headers(r.headers);
    for (const [k, v] of Object.entries(cors())) out.set(k, v);
    ["content-security-policy", "x-frame-options", "set-cookie"].forEach(k => out.delete(k));
    const type = (r.headers.get("content-type") || "").toLowerCase();
    // playlist HLS: gli indirizzi relativi diventano completi, cosi' il lettore puo' passarli di nuovo dal proxy
    if (/mpegurl/.test(type) || /\.m3u8?(\?|$)/i.test(new URL(r.url).pathname)) {
      const base = r.url, txt = await r.text();
      const abs = s => { try { return new URL(s, base).href; } catch (e) { return s; } };
      const body = txt.split(/\r?\n/).map(l => !l || l[0] === "#" ? l.replace(/URI="([^"]+)"/g, (_, x) => 'URI="' + abs(x) + '"') : abs(l.trim())).join("\n");
      out.delete("content-length"); out.delete("content-encoding");
      return new Response(body, { status: r.status, headers: out });
    }
    return new Response(r.body, { status: r.status, headers: out });
  },
};
function cors() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS", "Access-Control-Expose-Headers": "*" }; }
