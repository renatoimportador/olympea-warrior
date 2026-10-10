import { useState, useEffect, useCallback } from 'react'
import { useProgramacao } from '@/context/ProgramacaoContext'
import { getProgramacoesByAluno } from '@/lib/api'
import { selecionarProgramacaoAtiva, precisaSelecionarProgramacao } from '@/lib/programacao'
import type { Programacao } from '@/data/types'

interface UseProgramacaoAtivaResult {
  programacao: Programacao | null
  programacoes: Programacao[]
  precisaSelecionar: boolean
  loading: boolean
  erro: string | null
  selecionar: (p: Programacao) => void
}

export function useProgramacaoAtiva(
  alunoId: string | undefined,
  programacaoFallback: Programacao | null = null
): UseProgramacaoAtivaResult {
  const { programacaoAtiva, setProgramacaoAtiva } = useProgramacao()
  const [programacoes, setProgramacoes] = useState<Programacao[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Carrega as inscricoes do aluno sempre que o aluno logado muda.
  // Enquanto alunoId nao foi resolvido, mantem loading (nao expoe nada).
  useEffect(() => {
    if (!alunoId) {
      setLoading(true)
      return
    }

    let cancelado = false
    const alunoIdAtual = alunoId

    async function carregar() {
      setLoading(true)
      setErro(null)
      try {
        const progs = await getProgramacoesByAluno(alunoIdAtual)
        if (cancelado) return
        setProgramacoes(progs)
      } catch (e) {
        if (cancelado) return
        console.error('Erro ao carregar programacoes do aluno:', e)
        setErro('Não foi possível carregar suas programações.')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [alunoId])

  // Reconcilia o contexto com as inscricoes carregadas:
  // - entra automaticamente quando ha exatamente uma inscricao;
  // - limpa selecao persistida que deixou de ser valida (ex.: inscricao removida);
  // - com multiplas inscricoes, aguarda escolha do aluno (sem redirecionar).
  // Nao persiste o fallback no contexto: ele e apenas derivado na renderizacao.
  useEffect(() => {
    if (loading || erro) return
    if (programacaoAtiva) {
      const aindaInscrito = programacoes.some((p) => p.id === programacaoAtiva.id)
      if (aindaInscrito) return
      setProgramacaoAtiva(programacoes.length === 1 ? programacoes[0] : null)
    } else if (programacoes.length === 1) {
      setProgramacaoAtiva(programacoes[0])
    }
  }, [programacoes, programacaoAtiva, loading, erro, setProgramacaoAtiva])

  const selecionar = useCallback(
    (p: Programacao) => {
      setProgramacaoAtiva(p)
    },
    [setProgramacaoAtiva]
  )

  // Enquanto carrega ou em caso de falha na consulta, nenhuma programacao e
  // apresentada. Somente apos carga bem-sucedida aplica-se a regra de selecao
  // (inscricoes > fallback legado da Planilha para alunos sem inscricao).
  const programacao =
    loading || erro
      ? null
      : selecionarProgramacaoAtiva(programacoes, programacaoAtiva, programacaoFallback)

  return {
    programacao,
    programacoes,
    precisaSelecionar: !loading && !erro && precisaSelecionarProgramacao(programacoes),
    loading,
    erro,
    selecionar,
  }
}
