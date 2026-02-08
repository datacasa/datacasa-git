export default async function handler(req, res) {
  const gistId = process.env.GIST_ID;
  const token = process.env.GITHUB_TOKEN;

  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Authorization: `token ${token}` },
    });
    
    if (!response.ok) throw new Error('Erro ao aceder ao Gist');
    
    const data = await response.json();
    const rawContent = JSON.parse(data.files['data.json'].content);

    // Estrutura de resposta
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
            distributions: {
              typology: loc.current.sales.distributions.typology,
              // ENVIAR NOMES REAIS DAS AGÊNCIAS
              agencies: loc.current.sales.distributions.agencies 
            }
          },
          rent: loc.current.rent
        }
        // O histórico continua omitido aqui para proteger a tua base de dados a longo prazo
      };
    }

    // Cache de 1 hora para performance
    res.setHeader('Cache-Control', 's-maxage=3600');
    res.status(200).json(protectedData);
  } catch (e) {
    res.status(500).json({ error: "Erro na ponte de dados: " + e.message });
  }
}