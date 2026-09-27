import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import Resposta from './Resposta';

test('trocar de pergunta recarrega os dados e ignora a resposta da rota anterior', async () => {
  const fetchAnterior = global.fetch;
  let resolverAntiga;
  global.fetch = jest.fn()
    .mockReturnValueOnce(new Promise(resolve => { resolverAntiga = resolve; }))
    .mockResolvedValueOnce({ json: async () => ({ pergunta: { texto: 'Pergunta nova' }, respostas: [] }) });
  try {
    render(<MemoryRouter initialEntries={['/resposta/1']}>
      <Link to="/resposta/2">Próxima</Link>
      <Routes><Route path="/resposta/:id_pergunta" element={<Resposta />} /></Routes>
    </MemoryRouter>);
    fireEvent.click(screen.getByRole('link', { name: 'Próxima' }));
    await screen.findByText('Pergunta nova');
    expect(global.fetch).toHaveBeenLastCalledWith('http://localhost:5000/respostas/2');
    await act(async () => {
      resolverAntiga({ json: async () => ({ pergunta: { texto: 'Pergunta antiga' }, respostas: [] }) });
    });
    expect(screen.getByText('Pergunta nova')).toBeInTheDocument();
    expect(screen.queryByText('Pergunta antiga')).not.toBeInTheDocument();
  } finally { global.fetch = fetchAnterior; }
});
