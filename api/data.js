export default async function handler(req, res) {
  const gistId = process.env.GIST_ID;
  const token = process.env.GITHUB_TOKEN;

  try {
    // 1. Vai buscar o Gist ao GitHub
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Authorization: `token ${token}` },
    });
    
    if (!response.ok) throw new Error('Falha ao aceder ao GitHub Gist. Verifica o Token e o Gist ID.');
    
    const data = await response.json();
    
    // 2. Identifica o ficheiro dentro do Gist e extrai o conteúdo
    const fileName = Object.keys(data.files)[0]; 
    const rawContent = JSON.parse(data.files[fileName].content);

    // 3. ENVIAR TUDO: Sem filtros, sem mapeamento. 
    // O site recebe o JSON exatamente como o teu scraper o gerou.
    res.setHeader('Cache-Control', 's-maxage=3600'); // Mantém cache de 1h para performance
    res.status(200).json(rawContent);

  } catch (e) {
    // Caso algo falhe, envia o erro para diagnóstico
    res.status(500).json({ error: "Erro na API: " + e.message });
  }
}