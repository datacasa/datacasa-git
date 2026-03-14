export default async function handler(req, res) {
  const gistId = process.env.GIST_ID;
  const token = process.env.GITHUB_TOKEN;

  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Authorization: `token ${token}` },
    });
    
    if (!response.ok) throw new Error('Falha ao aceder ao GitHub Gist. Verifica o Token e o Gist ID.');
    
    const data = await response.json();
    
    const fileName = Object.keys(data.files)[0]; 
    const fileInfo = data.files[fileName];

    let rawContent;

    if (fileInfo.truncated) {
        const rawResponse = await fetch(fileInfo.raw_url, {
            headers: { Authorization: `token ${token}` } // Necessário se o Gist for privado
        });
        
        if (!rawResponse.ok) throw new Error('Falha ao descarregar o ficheiro raw do Gist.');
        rawContent = await rawResponse.json();
    } else {
        rawContent = JSON.parse(fileInfo.content);
    }

    res.setHeader('Cache-Control', 's-maxage=3600'); 
    res.status(200).json(rawContent);

  } catch (e) {
    res.status(500).json({ error: "Erro na API: " + e.message });
  }
}