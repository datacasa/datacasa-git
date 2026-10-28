// Serve os dados do dashboard a partir do Gist secreto.
// Lê o ficheiro "raw" do Gist, que não precisa de token: assim nenhum token
// do GitHub fica guardado na Vercel e revogar tokens nunca parte o site.
const GIST_OWNER = 'datacasa';
const GIST_ID = process.env.GIST_ID || '02aa02671f3041bbdf065396806b56c9';
const GIST_FILE = 'data.json';

export default async function handler(req, res) {
  // O CDN do GitHub guarda cópias em cache, por isso pedimos uma versão
  // nova no máximo a cada 5 minutos.
  const bucket = Math.floor(Date.now() / 300000);
  const url = `https://gist.githubusercontent.com/${GIST_OWNER}/${GIST_ID}/raw/${GIST_FILE}?v=${bucket}`;

  try {
    const response = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
    if (!response.ok) throw new Error(`Gist respondeu ${response.status}`);
    const data = await response.json();

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
    res.status(200).json(data);
  } catch (e) {
    console.error('Erro na API de dados:', e);
    res.status(502).json({ error: 'Não foi possível carregar os dados. Tenta novamente dentro de minutos.' });
  }
}
