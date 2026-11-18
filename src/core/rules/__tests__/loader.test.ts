import {
  getCatalogoInfracoes,
  getInfracaoPorId,
  getPerfisEstaduais,
  getPerfilPorUf,
} from '../loader';

describe('Fase 0 — Validação de Seeds e Loader de Regras', () => {
  test('deve carregar o catálogo de infrações com integridade', () => {
    const catalogo = getCatalogoInfracoes();
    expect(Array.isArray(catalogo)).toBe(true);
    expect(catalogo.length).toBeGreaterThanOrEqual(40);

    catalogo.forEach((inf) => {
      expect(inf.id).toBeDefined();
      expect(inf.artigo_ctb).toBeDefined();
      expect(inf.descricao).toBeDefined();
      expect(['leve', 'media', 'grave', 'gravissima']).toContain(inf.natureza);
      expect([1, 2, 4, 6]).toContain(inf.pontos);
      expect(Array.isArray(inf.categorias_aplicaveis)).toBe(true);
      expect(inf.agrupamento_ux).toBeDefined();
    });
  });

  test('deve conter a infração do Art. 169 do CTB como leve (1 ponto)', () => {
    const art169 = getInfracaoPorId('ctb_169');
    expect(art169).toBeDefined();
    expect(art169?.artigo_ctb).toBe('Art. 169');
    expect(art169?.natureza).toBe('leve');
    expect(art169?.pontos).toBe(1);
  });

  test('deve carregar perfis estaduais incluindo MA como padrão', () => {
    const perfis = getPerfisEstaduais();
    expect(perfis.length).toBeGreaterThanOrEqual(2);

    const perfilMA = getPerfilPorUf('MA');
    expect(perfilMA.uf).toBe('MA');
    expect(perfilMA.limite_aprovacao).toBe(10);
    expect(perfilMA.peso_leve).toBe(1);
    expect(perfilMA.peso_media).toBe(2);
    expect(perfilMA.peso_grave).toBe(4);
    expect(perfilMA.peso_gravissima).toBe(6);
    expect(perfilMA.limite_incapacidade_tecnica).toBe(2);
    expect(Boolean(perfilMA.primeira_incapacidade_gera_leve)).toBe(true);
  });

  test('deve fazer fallback para MA se a UF informada não existir', () => {
    const fallback = getPerfilPorUf('XX');
    expect(fallback.uf).toBe('MA');
  });
});

