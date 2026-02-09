export default async function handler(req, res) {
  const gistId = process.env.GIST_ID;
  const token = process.env.GITHUB_TOKEN;

  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Authorization: `token ${token}` },
    });
    
    if (!response.ok) throw new Error('Falha ao aceder ao GitHub Gist');
    
    const data = await response.json();
    
    // Identifica automaticamente o nome do ficheiro no Gist
    const fileName = Object.keys(data.files)[0]; 
    const rawContent = JSON.parse(data.files[fileName].content);

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
            affordability_index: loc.current.sales.affordability_index || 0,
            new_entries: loc.current.sales.new_entries || 0,
            distributions: {
              typology: loc.current.sales.distributions.typology,
              agencies: loc.current.sales.distributions.agencies 
            }
          },
          rent: loc.current.rent
        },
        // ATIVAÇÃO DOS GRÁFICOS DE EVOLUÇÃO
        // Enviamos apenas o essencial para os gráficos de linha e cálculos de variação
        history: loc.history.map(h => ({
          date: h.date,
          sales: {
            median_price: h.sales.median_price,
            median_price_m2: h.sales.median_price_m2
          },
          rent: {
            median_price: h.rent.median_price,
            median_price_m2: h.rent.median_price_m2
          }
        }))
      };
    }

    // Cache de 1 hora para não sobrecarregar a API do GitHub
    res.setHeader('Cache-Control', 's-maxage=3600');
    res.status(200).json(protectedData);
  } catch (e) {
    res.status(500).json({ error: "Erro: " + e.message });
  }
}