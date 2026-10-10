import type { Programacao } from '@/data/types'

function isModalidadePlanilha(p: Programacao): boolean {
  // Regra: somente programacoes da Planilha podem ser usadas como fallback.
  // BOX_PRESENCIAL nunca e apresentada a alunos sem inscricao.
  return p.modalidade !== 'BOX_PRESENCIAL'
}

export function selecionarProgramacaoAtiva(
  programacoesInscritas: Programacao[],
  programacaoContexto: Programacao | null,
  programacaoFallback: Programacao | null
): Programacao | null {
  // Se o contexto ja tem uma programacao valida e inscrita, mantem
  if (programacaoContexto) {
    const aindaInscrito = programacoesInscritas.some((p) => p.id === programacaoContexto.id)
    if (aindaInscrito) return programacaoContexto
  }

  // Se ha apenas uma programacao inscrita, entra nela automaticamente
  if (programacoesInscritas.length === 1) {
    return programacoesInscritas[0]
  }

  // Se ha multiplas inscricoes, nao escolhe automaticamente (usuario precisa selecionar)
  if (programacoesInscritas.length > 1) {
    return null
  }

  // Fallback de compatibilidade: exclusivamente para programacoes da Planilha
  if (programacaoFallback && isModalidadePlanilha(programacaoFallback)) {
    return programacaoFallback
  }

  return null
}

export function precisaSelecionarProgramacao(programacoesInscritas: Programacao[]): boolean {
  return programacoesInscritas.length > 1
}

/**
 * Fallback legado da Planilha: primeira programacao ativa, dentro da vigencia
 * e da modalidade PLANILHA. Usado apenas para alunos sem nenhuma inscricao.
 */
export function encontrarFallbackPlanilha(
  programacoes: Programacao[],
  dataAtual: string
): Programacao | null {
  const vigente = programacoes.find((p) => {
    if (!p.ativa) return false
    if (!isModalidadePlanilha(p)) return false
    if (!p.data_inicio) return false
    return dataAtual >= p.data_inicio && (!p.data_fim || dataAtual <= p.data_fim)
  })
  return vigente || null
}
