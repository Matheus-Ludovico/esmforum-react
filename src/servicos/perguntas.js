export async function buscarPerguntas(consulta = '') {
  const resposta = await fetch(`http://localhost:5000/?q=${encodeURIComponent(consulta)}`);
  if (!resposta.ok) throw new Error('Falha na busca');
  return resposta.json();
}
