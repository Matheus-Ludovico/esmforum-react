import React from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Pergunta from './Pergunta';

test.each(['sucesso', 'falha'])('ignora %s de busca antiga após resultado recente', async tipo => {
  let resolver, rejeitar;
  const antiga = new Promise((resolve, reject) => { resolver = resolve; rejeitar = reject; });
  const buscar = jest.fn().mockReturnValueOnce(antiga).mockResolvedValueOnce([
    { id_pergunta: 2, texto: 'Resultado recente', num_respostas: 0 }
  ]);
  render(<MemoryRouter><Pergunta buscar={buscar} /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Buscar perguntas por palavra-chave'), { target: { value: 'recente' } });
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
  await screen.findByText('Resultado recente');
  await act(async () => {
    if (tipo === 'sucesso') resolver([{ id_pergunta: 1, texto: 'Resultado antigo', num_respostas: 0 }]);
    else rejeitar(new Error('Falha antiga'));
  });
  expect(screen.getByText('Resultado recente')).toBeInTheDocument();
  expect(screen.queryByText('Resultado antigo')).not.toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('cadastro reaplica o filtro executado mesmo com edição pendente no campo', async () => {
  const fetchAnterior = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ id_pergunta: 2 }) });
  try {
    const buscar = jest.fn().mockResolvedValue([{ id_pergunta: 1, texto: 'JavaScript', num_respostas: 0 }]);
    const { container } = render(<MemoryRouter><Pergunta buscar={buscar} /></MemoryRouter>);
    await screen.findByText('JavaScript');
    const campo = screen.getByLabelText('Buscar perguntas por palavra-chave');
    fireEvent.change(campo, { target: { value: 'Java' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await screen.findByText('JavaScript');
    fireEvent.change(campo, { target: { value: 'Python' } });
    fireEvent.change(container.querySelector('#textarea-pergunta'), { target: { value: 'Java novo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await waitFor(() => expect(buscar).toHaveBeenCalledTimes(3));
    expect(buscar).toHaveBeenLastCalledWith('Java');
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/perguntas', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ pergunta: 'Java novo' })
    }));
    await screen.findByText('JavaScript');
  } finally { global.fetch = fetchAnterior; }
});

test('busca, resultado vazio, falha, repetição e limpeza', async () => {
  const buscar = jest.fn().mockResolvedValue([{ id_pergunta: 1, texto: 'JavaScript', num_respostas: 0 }]);
  render(<MemoryRouter><Pergunta buscar={buscar} /></MemoryRouter>);
  expect(screen.getByRole('status')).toHaveTextContent('Carregando');
  await screen.findByText('JavaScript');
  const campo = screen.getByLabelText('Buscar perguntas por palavra-chave');
  fireEvent.change(campo, { target: { value: 'Python' } });
  buscar.mockResolvedValueOnce([]);
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
  await screen.findByText('Nenhuma pergunta encontrada');
  expect(buscar).toHaveBeenLastCalledWith('Python');
  buscar.mockRejectedValueOnce(new Error('offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
  await screen.findByRole('alert');
  expect(screen.queryByText('Nenhuma pergunta encontrada')).not.toBeInTheDocument();
  expect(campo).toHaveValue('Python');
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await screen.findByText('JavaScript');
  expect(buscar).toHaveBeenLastCalledWith('Python');
  fireEvent.click(screen.getByRole('button', { name: 'Limpar' }));
  await waitFor(() => expect(buscar).toHaveBeenLastCalledWith(''));
  await screen.findByText('JavaScript');
  expect(campo).toHaveValue('');
});
