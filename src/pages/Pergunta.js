import React from 'react';
import { buscarPerguntas } from '../servicos/perguntas';
import { Link } from "react-router-dom";
import { Container, Table, Form, Button } from 'react-bootstrap';

function postPergunta(pergunta, update) {
  const request = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pergunta: pergunta })
  };
  fetch('http://localhost:5000/perguntas', request)
    .then(response => response.json())
    .then(data => update(data.id_pergunta, pergunta));
}

function NovaPergunta(props) {
  const [texto, setTexto] = React.useState('');
  
  function handleChange (event) {
    setTexto(event.target.value);
  }

  function handleClick(event) {
    postPergunta(texto, props.update);
    setTexto('');
  }

  return (
    <Container>
      <Form>
        <Form.Group>
          <Form.Label> Faça a sua pergunta: </Form.Label>
          <Form.Control id="textarea-pergunta" as="textarea" value={texto} onChange={handleChange}/>
        </Form.Group>
        <Button id="btn-pergunta" onClick={handleClick}>Enviar</Button>
      </Form>
    </Container>
  );
}

function Pergunta({ buscar = buscarPerguntas }) {
  const [listaPerguntas, setListaPerguntas] = React.useState([]);

  const [consulta, setConsulta] = React.useState('');
  const [carregando, setCarregando] = React.useState(true);
  const [erro, setErro] = React.useState(false);
  const ultimaBusca = React.useRef(0);
  const consultaAplicada = React.useRef('');

  const pesquisar = React.useCallback(async (texto) => {
    const numero = ++ultimaBusca.current;
    consultaAplicada.current = texto;
    setCarregando(true);
    setErro(false);
    try {
      const perguntas = await buscar(texto);
      if (numero === ultimaBusca.current) setListaPerguntas(perguntas);
    } catch {
      if (numero === ultimaBusca.current) setErro(true);
    } finally {
      if (numero === ultimaBusca.current) setCarregando(false);
    }
  }, [buscar]);

  function adicionarNovaPergunta() {
    pesquisar(consultaAplicada.current);
  }

  function TabelaPerguntas() {   

    function LinhaTabela({ pergunta }) {
      return (
        <tr>
          <td className="text-center"> {pergunta.id_pergunta} </td>
          <td> {pergunta.texto} </td>
          <td className="text-center"> 
              <Link to = {`/resposta/${pergunta.id_pergunta}`}> 
                 {pergunta.num_respostas}
              </Link>
          </td>
        </tr>
      );
    }

    function TabelaPrincipal() {
      const linhas = listaPerguntas.map(p => ( <LinhaTabela pergunta={p} key={p.id_pergunta} /> ));  
      return (
        <div className="container">
          <center><h5>Peguntas Atuais</h5></center>
          <Table id="tabela-perguntas" striped bordered>
            <thead>
              <tr>
                <th className="text-center">ID</th>
                <th className="text-center">Pergunta</th>
                <th className="text-center"># Respostas</th>
              </tr>
            </thead>
            <tbody>
              {linhas}
            </tbody>
          </Table>
        </div>
      );
    }

    return (
      <div>
        <TabelaPrincipal />
        <NovaPergunta update={adicionarNovaPergunta}/>
      </div> 
    );
  }
    
  React.useEffect(() => {
    pesquisar('');
    return () => { ultimaBusca.current += 1; };
  }, [pesquisar]);

  return (
    <div className="container">
      <Form onSubmit={event => { event.preventDefault(); pesquisar(consulta); }}>
        <Form.Group controlId="busca-perguntas">
          <Form.Label>Buscar perguntas por palavra-chave</Form.Label>
          <Form.Control value={consulta} onChange={event => setConsulta(event.target.value)} />
        </Form.Group>
        <Button type="submit">Buscar</Button>{' '}
        <Button type="button" onClick={() => { setConsulta(''); pesquisar(''); }}>Limpar</Button>
      </Form>
      {carregando && <p role="status">Carregando perguntas...</p>}
      {!carregando && erro && <div role="alert">
        <p>Não foi possível buscar perguntas. Tente novamente.</p>
        <Button onClick={() => pesquisar(consultaAplicada.current)}>Tentar novamente</Button>
      </div>}
      {!carregando && !erro && <>
        {listaPerguntas.length === 0 && <p role="status">Nenhuma pergunta encontrada</p>}
        <TabelaPerguntas />
      </>}
    </div>
  );
}

export default Pergunta;
