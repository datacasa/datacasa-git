export default async function handler(req, res) {
  const gistId = process.env.GIST_ID;
  const token = process.env.GITHUB_TOKEN;

  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Authorization: `token ${token}` },
    });
    const data = await response.json();
    const rawContent = JSON.parse(data.files['data.json'].content);

    // --- PROTEÇÃO DE DADOS ---
    // Criamos um novo objeto enviando apenas o que o site precisa
    const protectedData = {
      last_update: rawContent.last_update,
      locations: {}
    };

    for (const [name, loc] of Object.entries(rawContent.locations)) {
      protectedData.locations[name] = {
        current: {
          sales: {
            active_count: loc.current.sales.active_count,
            median_price: loc.current.sales.median_price,
            median_price_m2: loc.current.sales.median_price_m2,
            // Enviar tipologias (seguro)
            distributions: {
              typology: loc.current.sales.distributions.typology
            }
            // NOTA: Deixámos de fora 'agencies' e 'history'
          }
        }
      };
    }

    res.setHeader('Cache-Control', 's-maxage=3600'); // Cache de 1h para poupar recursos
    res.status(200).json(protectedData);
  } catch (e) {
    res.status(500).json({ error: "Erro ao processar dados" });
  }
}