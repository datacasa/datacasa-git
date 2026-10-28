// Serve os dados do dashboard a partir do Gist secreto.
// 1.º tenta o ficheiro "raw" do Gist (não precisa de token).
// 2.º se falhar, usa a API do GitHub (com GITHUB_TOKEN se existir na Vercel).
// Assim revogar tokens nunca parte o site.
const GIST_OWNER = 'datacasa';
const GIST_ID = process.env.GIST_ID || '02aa02671f3041bbdf065396806b56c9';
const GIST_FILE = 'data.json';

async function viaRaw() {
  // O CDN do GitHub guarda cópias em cache: pedimos uma versão nova no máximo a cada 5 minutos.
  const bucket = Math.floor(Date.now() / 300000);
  const r = await fetch(`https://gist.githubusercontent.com/${GIST_OWNER}/${GIST_ID}/raw/${GIST_FILE}?v=${bucket}`);
  if (!r.ok) throw new Error(`raw ${r.status}`);
  return r.json();
}

async function viaApi() {
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  let r = await fetch(`https://api.github.com/gists/${GIST_ID}`, { headers });
  if (r.status === 401 && headers.Authorization) {
    // token revogado: tenta sem token (o Gist secreto é legível sem autenticação)
    delete headers.Authorization;
    r = await fetch(`https://api.github.com/gists/${GIST_ID}`, { headers });
  }
  if (!r.ok) throw new Error(`api ${r.status}`);
  const gist = await r.json();
  const file = gist.files[GIST_FILE] || Object.values(gist.files)[0];
  if (!file.truncated) return JSON.parse(file.content);
  const raw = await fetch(file.raw_url);
  if (!raw.ok) throw new Error(`raw_url ${raw.status}`);
  return raw.json();
}

export default async function handler(req, res) {
  try {
    let data;
    try {
      data = await viaRaw();
    } catch (e) {
      console.warn('Gist raw falhou, a usar a API:', e.message);
      data = await viaApi();
    }
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
    res.status(200).json(data);
  } catch (e) {
    console.error('Erro na API de dados:', e);
    res.status(502).json({ error: 'Não foi possível carregar os dados. Tenta novamente dentro de minutos.' });
  }
}
