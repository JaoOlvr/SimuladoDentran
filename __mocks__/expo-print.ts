export const printToFileAsync = jest.fn(async ({ html }: { html: string }) => ({
  uri: 'file:///data/user/0/com.examesimulado.detran/cache/Simulado_Relatorio.pdf',
  numberOfPages: 1,
}));

export const printAsync = jest.fn();

export default {
  printToFileAsync,
  printAsync,
};

