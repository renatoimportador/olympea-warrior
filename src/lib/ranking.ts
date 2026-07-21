import type { Resultado } from '@/data/types'
import { listarTreinosDoDia, listarResultadosByTreino, listarAlunos } from './api'

export type TipoWodRanking = 'FOR_TIME' | 'AMRAP' | 'CARGA'

export interface RankingItem {
  id: string
  nome: string
  categoria: string
  resultado: Resultado
  posicao: number
}

export async function carregarRankingDoDia(boxId?: string): Promise<{
  treino: any
  ranking: RankingItem[]
}> {
  const treinos = await listarTreinosDoDia(boxId)

  if (treinos.length === 0) {
    return { treino: null, ranking: [] }
  }

  // Usa o primeiro treino do dia como referencia de tipo e titulo
  const treinoPrincipal = treinos[0]
  const tipoWod = treinoPrincipal.tipo_wod

  const [resultadosHoje, alunosData] = await Promise.all([
    Promise.all(treinos.map((t) => listarResultadosByTreino(t.id))).then((listas) => listas.flat()),
    listarAlunos(),
  ])

  const alunosAtivos = (alunosData || []).filter((a) => a.ativo)

  const rankingData: Omit<RankingItem, 'posicao'>[] = []
  const alunosProcessados = new Set<string>()

  for (const aluno of alunosAtivos) {
    // Evitar duplicar se o aluno tiver resultado em mais de um treino do dia
    if (alunosProcessados.has(aluno.id)) continue

    const resultadosAluno = resultadosHoje.filter(
      (r: any) => r.aluno_id === aluno.id
    )

    // Se houver mais de um resultado para o mesmo aluno, priorizar o mais recente
    const resultado = resultadosAluno.sort(
      (a: any, b: any) => new Date(b.created_at || b.data).getTime() - new Date(a.created_at || a.data).getTime()
    )[0]

    if (resultado && isResultadoValido(resultado, tipoWod)) {
      rankingData.push({
        id: aluno.id,
        nome: aluno.usuario?.nome || aluno.nome || 'Atleta',
        categoria: aluno.categoria || 'Sem categoria',
        resultado,
      })
      alunosProcessados.add(aluno.id)
    }
  }

  const ranking = rankingData
    .sort((a, b) => compararResultados(a.resultado, b.resultado, tipoWod))
    .map((item, index) => ({ ...item, posicao: index + 1 }))

  return { treino: treinoPrincipal, ranking }
}

export function tempoParaSegundos(tempo: string): number {
  if (!tempo || typeof tempo !== 'string') return Infinity

  const tempoRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
  const match = tempo.trim().match(tempoRegex)

  if (!match) return Infinity

  const horas = parseInt(match[1] || '0', 10)
  const minutos = parseInt(match[2] || '0', 10)
  const segundos = match[3] ? parseInt(match[3], 10) : 0

  // Caso seja HH:MM:SS, o primeiro grupo sao as horas
  if (match[3]) {
    return horas * 3600 + minutos * 60 + segundos
  }

  // MM:SS
  return horas * 60 + minutos
}

export function isTempoValido(tempo: string | undefined | null): boolean {
  if (!tempo || typeof tempo !== 'string') return false
  const regex = /^(\d{1,2}):(\d{2})$/
  const regexHMS = /^(\d{1,2}):(\d{2}):(\d{2})$/

  if (!regex.test(tempo.trim()) && !regexHMS.test(tempo.trim())) return false

  const partes = tempo.trim().split(':').map((p) => parseInt(p, 10))
  return partes.every((n) => !isNaN(n) && n >= 0)
}

export function isResultadoValido(
  resultado: Resultado | null | undefined,
  tipoWod: TipoWodRanking | string | undefined
): boolean {
  if (!resultado) return false

  const tipo = (tipoWod || '').toUpperCase()

  if (tipo === 'FOR_TIME') {
    return isTempoValido(resultado.tempo)
  }

  if (tipo === 'AMRAP') {
    const rounds = typeof resultado.rounds === 'string' ? parseInt(resultado.rounds, 10) : resultado.rounds
    const reps = typeof resultado.repeticoes === 'string' ? parseInt(resultado.repeticoes, 10) : resultado.repeticoes
    return (rounds != null && !isNaN(rounds) && rounds > 0) || (reps != null && !isNaN(reps) && reps > 0)
  }

  if (tipo === 'CARGA' || tipo === 'STRENGTH') {
    const carga = typeof resultado.carga === 'string' ? parseFloat(resultado.carga) : resultado.carga
    return carga != null && !isNaN(carga) && carga > 0
  }

  // Fallback generico: considera valido se tiver tempo, rounds/reps ou carga
  return (
    isTempoValido(resultado.tempo) ||
    (resultado.rounds != null && resultado.rounds > 0) ||
    (resultado.repeticoes != null && resultado.repeticoes > 0) ||
    (resultado.carga != null && resultado.carga > 0)
  )
}

export function compararResultados(
  a: Resultado,
  b: Resultado,
  tipoWod: TipoWodRanking | string | undefined
): number {
  const tipo = (tipoWod || '').toUpperCase()

  if (tipo === 'FOR_TIME') {
    return tempoParaSegundos(a.tempo || '') - tempoParaSegundos(b.tempo || '')
  }

  if (tipo === 'AMRAP') {
    const roundsA = typeof a.rounds === 'string' ? parseInt(a.rounds, 10) : (a.rounds || 0)
    const roundsB = typeof b.rounds === 'string' ? parseInt(b.rounds, 10) : (b.rounds || 0)
    if (roundsB !== roundsA) return roundsB - roundsA

    const repsA = typeof a.repeticoes === 'string' ? parseInt(a.repeticoes, 10) : (a.repeticoes || 0)
    const repsB = typeof b.repeticoes === 'string' ? parseInt(b.repeticoes, 10) : (b.repeticoes || 0)
    return repsB - repsA
  }

  // CARGA ou padrao
  const cargaA = typeof a.carga === 'string' ? parseFloat(a.carga) : (a.carga || 0)
  const cargaB = typeof b.carga === 'string' ? parseFloat(b.carga) : (b.carga || 0)
  return cargaB - cargaA
}

export function formatarResultadoRanking(
  resultado: Resultado | null | undefined,
  tipoWod: TipoWodRanking | string | undefined
): string {
  if (!resultado || !isResultadoValido(resultado, tipoWod)) return '-'

  const tipo = (tipoWod || '').toUpperCase()

  if (tipo === 'FOR_TIME') {
    return resultado.tempo || '-'
  }

  if (tipo === 'AMRAP') {
    const rounds = typeof resultado.rounds === 'string' ? parseInt(resultado.rounds, 10) : (resultado.rounds || 0)
    const reps = typeof resultado.repeticoes === 'string' ? parseInt(resultado.repeticoes, 10) : (resultado.repeticoes || 0)
    if (rounds > 0 && reps > 0) return `${rounds} rounds + ${reps} reps`
    if (rounds > 0) return `${rounds} rounds`
    return `${reps} reps`
  }

  if (tipo === 'CARGA' || tipo === 'STRENGTH') {
    const carga = typeof resultado.carga === 'string' ? parseFloat(resultado.carga) : resultado.carga
    return carga ? `${carga} kg` : '-'
  }

  // Fallback
  if (resultado.tempo) return resultado.tempo
  if (resultado.carga) return `${resultado.carga} kg`
  if (resultado.rounds != null || resultado.repeticoes != null) {
    return `${resultado.rounds || 0} rounds + ${resultado.repeticoes || 0} reps`
  }

  return '-'
}

export function ordenarRanking(
  itens: { resultado: Resultado }[],
  tipoWod: TipoWodRanking | string | undefined
): { resultado: Resultado; posicao: number }[] {
  return itens
    .filter((item) => isResultadoValido(item.resultado, tipoWod))
    .sort((a, b) => compararResultados(a.resultado, b.resultado, tipoWod))
    .map((item, index) => ({ ...item, posicao: index + 1 }))
}
