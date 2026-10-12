import { supabase } from './supabase'
import type { ModalidadeProgramacao, Programacao } from '@/data/types'

/* =============================================================
   Modalidades do aluno (Etapa 4.4)
   Um aluno participa de PLANILHA, BOX_PRESENCIAL ou ambas. A fonte de
   verdade sao as INSCRICOES reais (inscricoes.ativa) — nunca campos
   visuais. Cada modalidade aponta para a programacao ativa do Box.

   Regras:
   - Nunca excluir inscricoes: desativar (ativa=false) preserva
     historico de treinos, resultados e reservas.
   - Nunca duplicar: UNIQUE(aluno_id, programacao_id); inscricao
     inexistente e inserida, inativa e reativada.
   - Uma unica inscricao ATIVA por modalidade: ao ativar uma
     programacao, as demais da mesma modalidade sao desativadas.
   - Coluna correta: inscricoes.ativa (nunca "ativo").
   ============================================================= */

export const MODALIDADES: Array<{
  id: ModalidadeProgramacao
  label: string
  descricao: string
}> = [
  {
    id: 'BOX_PRESENCIAL',
    label: 'Box Presencial',
    descricao: 'Aulas presenciais com check-in e reservas de vagas',
  },
  {
    id: 'PLANILHA',
    label: 'Planilha',
    descricao: 'Treinos online com navegação semanal e registro de resultados',
  },
]

/* Programacoes ATIVAS do Box, agrupadas por modalidade. */
export async function listarProgramacoesPorModalidade(
  boxId: string
): Promise<Record<ModalidadeProgramacao, Programacao[]>> {
  const { data, error } = await supabase
    .from('programacoes')
    .select('*')
    .eq('box_id', boxId)
    .eq('ativa', true)
    .order('nome')

  if (error) throw error

  const grupos: Record<ModalidadeProgramacao, Programacao[]> = {
    PLANILHA: [],
    BOX_PRESENCIAL: [],
  }
  for (const p of (data || []) as Programacao[]) {
    if (p.modalidade === 'PLANILHA' || p.modalidade === 'BOX_PRESENCIAL') {
      grupos[p.modalidade].push(p)
    }
  }
  return grupos
}

export interface InscricaoAluno {
  id: string
  aluno_id: string
  programacao_id: string
  ativa: boolean
  programacao: Pick<Programacao, 'id' | 'nome' | 'modalidade'> | null
}

/* TODAS as inscricoes do aluno (ativas e inativas) com a programacao.
   Inativas sao necessarias para reativar sem violar o UNIQUE. */
export async function obterInscricoesAluno(
  alunoId: string
): Promise<InscricaoAluno[]> {
  const { data, error } = await supabase
    .from('inscricoes')
    .select(
      'id, aluno_id, programacao_id, ativa, programacao:programacoes ( id, nome, modalidade )'
    )
    .eq('aluno_id', alunoId)

  if (error) throw error

  return ((data || []) as unknown as Array<any>).map((i) => ({
    id: i.id,
    aluno_id: i.aluno_id,
    programacao_id: i.programacao_id,
    ativa: i.ativa === true,
    programacao:
      i.programacao && !Array.isArray(i.programacao)
        ? {
            id: i.programacao.id,
            nome: i.programacao.nome,
            modalidade: i.programacao.modalidade,
          }
        : null,
  }))
}

/* Estado atual das modalidades do aluno para preencher o formulario. */
export interface EstadoModalidades {
  /* Programacao ativa selecionada por modalidade (null = desativada). */
  selecionada: Partial<Record<ModalidadeProgramacao, string | null>>
}

export function derivarEstadoModalidades(
  inscricoes: InscricaoAluno[]
): EstadoModalidades {
  const estado: EstadoModalidades = { selecionada: {} }
  for (const m of MODALIDADES) {
    const ativa = inscricoes.find(
      (i) => i.ativa && i.programacao?.modalidade === m.id
    )
    estado.selecionada[m.id] = ativa ? ativa.programacao_id : null
  }
  return estado
}

/* Inscricoes ativas de uma lista de alunos nos programas do Box — usado
   pela listagem para exibir as modalidades de cada aluno. */
export async function obterModalidadesPorAluno(
  programacoesIds: string[]
): Promise<Map<string, Set<ModalidadeProgramacao>>> {
  const mapa = new Map<string, Set<ModalidadeProgramacao>>()
  if (programacoesIds.length === 0) return mapa

  const { data, error } = await supabase
    .from('inscricoes')
    .select('aluno_id, programacao:programacoes ( modalidade )')
    .eq('ativa', true)
    .in('programacao_id', programacoesIds)

  if (error) throw error

  for (const row of (data || []) as unknown as Array<any>) {
    const modalidade = row.programacao?.modalidade as
      | ModalidadeProgramacao
      | undefined
    if (!modalidade) continue
    const set = mapa.get(row.aluno_id) ?? new Set()
    set.add(modalidade)
    mapa.set(row.aluno_id, set)
  }
  return mapa
}

export interface SelecaoModalidade {
  /* true = modalidade marcada no formulario */
  marcada: boolean
  /* Programacao escolhida (obrigatoria quando marcada). Com uma unica
     programacao elegivel a UI pre-seleciona automaticamente. */
  programacaoId: string | null
}

export type SelecaoModalidades = Record<ModalidadeProgramacao, SelecaoModalidade>

/* Aplica a selecao do formulario as inscricoes do aluno:
   - marcada  -> inscricao ATIVA na programacao escolhida (insere se nao
                 existir, reativa se inativa) e desativa as demais da
                 mesma modalidade (evita duplicadas ativas);
   - desmarcada -> desativa TODAS as inscricoes dessa modalidade.
   Nada e excluido; falha em qualquer etapa interrompe com erro claro. */
export async function aplicarModalidades(
  alunoId: string,
  selecao: SelecaoModalidades,
  inscricoesAtuais: InscricaoAluno[]
): Promise<void> {
  for (const m of MODALIDADES) {
    const escolha = selecao[m.id]

    if (escolha.marcada) {
      if (!escolha.programacaoId) {
        throw new Error(
          `Selecione a programacao de ${m.label} (ou desmarque a modalidade).`
        )
      }

      const existente = inscricoesAtuais.find(
        (i) => i.programacao_id === escolha.programacaoId
      )

      if (existente) {
        if (!existente.ativa) {
          const { error } = await supabase
            .from('inscricoes')
            .update({ ativa: true, data_fim: null })
            .eq('id', existente.id)
          if (error) throw new Error(`Falha ao ativar inscricao: ${error.message}`)
        }
      } else {
        const { error } = await supabase.from('inscricoes').insert({
          aluno_id: alunoId,
          programacao_id: escolha.programacaoId,
          ativa: true,
        })
        if (error) throw new Error(`Falha ao criar inscricao: ${error.message}`)
      }

      /* Desativa as DEMAIS inscricoes ativas da mesma modalidade
         (uma unica ativa por modalidade). */
      const outrasAtivas = inscricoesAtuais.filter(
        (i) =>
          i.ativa &&
          i.programacao?.modalidade === m.id &&
          i.programacao_id !== escolha.programacaoId
      )
      for (const outra of outrasAtivas) {
        const { error } = await supabase
          .from('inscricoes')
          .update({ ativa: false })
          .eq('id', outra.id)
        if (error)
          throw new Error(
            `Falha ao desativar inscricao anterior: ${error.message}`
          )
      }
    } else {
      /* Modalidade desmarcada: desativa todas as inscricoes dessa
         modalidade, preservando o historico. */
      const ativas = inscricoesAtuais.filter(
        (i) => i.ativa && i.programacao?.modalidade === m.id
      )
      for (const i of ativas) {
        const { error } = await supabase
          .from('inscricoes')
          .update({ ativa: false })
          .eq('id', i.id)
        if (error)
          throw new Error(`Falha ao desativar inscricao: ${error.message}`)
      }
    }
  }
}

/* Rotulo curto para a listagem: "Box", "Planilha", "Box + Planilha". */
export function rotuloModalidades(
  modalidades: Set<ModalidadeProgramacao> | undefined
): string | null {
  if (!modalidades || modalidades.size === 0) return null
  const partes: string[] = []
  if (modalidades.has('BOX_PRESENCIAL')) partes.push('Box')
  if (modalidades.has('PLANILHA')) partes.push('Planilha')
  return partes.length > 0 ? partes.join(' + ') : null
}
