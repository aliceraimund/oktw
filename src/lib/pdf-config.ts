export type CamposPdf = {
  cpf: boolean
  ctps: boolean
  cargo: boolean
  setor: boolean
  data: boolean
}

export type ConfigPdf = {
  empresa_nome: string
  empresa_cnpj: string
  campos: CamposPdf
  termo_paragrafos: string[]
}

// Texto padrão do Termo (entrega). Use {EMPRESA} e {CNPJ} como marcadores.
export const DEFAULT_TERMO_PARAGRAFOS: string[] = [
  'Recebi da empresa {EMPRESA}, CNPJ: {CNPJ}, a título de empréstimo, para meu uso exclusivo e obrigatório nas dependências da empresa, conforme determinado na NR-6 item 6.5.1, os equipamentos discriminados a seguir, comprometendo-me a mantê-los em perfeito estado de uso e conservação, ficando ciente de que:',
  "1- Recebi treinamento quanto à necessidade na utilização dos referidos EPI's, a maneira correta de usá-los, guardá-los e higienizá-los, bem como da minha responsabilidade quanto a seu uso, conforme determinado na NR-6 item 6.5.1;",
  '2- Se o equipamento foi danificado ou inutilizado por emprego inadequado, mau uso, negligência ou extravio, a empresa me fornecerá novo equipamento e cobrará o valor de um equipamento da mesma marca ou equivalente (Art. 462 em seu parágrafo 1º da C.L.T.);',
  '3- Fico proibido de dar ou emprestar o equipamento que estiver sob a minha responsabilidade, só podendo fazê-lo se receber ordem por escrito de pessoas autorizadas para tal fim;',
  '4- Em caso de dano, inutilização ou extravio do equipamento, deverei comunicar imediatamente ao setor competente;',
  '5- Terminados os serviços, ou no caso de rescisão do contrato de trabalho, devolverei o equipamento completo e em perfeito estado de conservação, considerando-se o tempo de uso do mesmo, ao setor competente;',
  '6- Estando os equipamentos em minha posse, estarei sujeito a inspeções sem prévio aviso.',
  '7- Fico ciente de que pela não utilização do equipamento de proteção individual em serviço, estarei sujeito às sanções disciplinares cabíveis, que irão desde a simples advertência até a dispensa por justa causa, nos termos do Art. 482 letra "h" da C.L.T., conforme NR-6 item 6.5.1.',
  '8- Declaro expressamente que consinto com a assinatura eletrônica do presente termo, nos termos da Lei nº 14.063/2020 e conforme NR-6 item 6.5.1, tendo plena ciência de que esta assinatura possui validade legal equivalente à assinatura manuscrita.',
]

export const DEFAULT_CONFIG_PDF: ConfigPdf = {
  empresa_nome: 'OKTW COMERCIO E SERVICOS LTDA',
  empresa_cnpj: '51.747.453/0001-17',
  campos: { cpf: true, ctps: true, cargo: true, setor: true, data: true },
  termo_paragrafos: DEFAULT_TERMO_PARAGRAFOS,
}

/** Substitui {EMPRESA} e {CNPJ} pelos valores da config. */
export function aplicarPlaceholders(texto: string, config: Pick<ConfigPdf, 'empresa_nome' | 'empresa_cnpj'>): string {
  return texto
    .replaceAll('{EMPRESA}', config.empresa_nome)
    .replaceAll('{CNPJ}', config.empresa_cnpj)
}
