import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Trophy, Medal } from 'lucide-react'
import {
  listarResultadosByTreino,
  listarAlunos,
  getTreinoDoDia,
  getAlunoByUsuarioId,
} from '@/lib/api'
import { formatarResultadoRanking, isResultadoValido, compararResultados } from '@/lib/ranking'
import type { Resultado } from '@/data/types'

export function RankingsAluno() {
  const { user } = useAuth()
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('RX')
  const [treinoHoje, setTreinoHoje] = useState<any>(null)
  const [rankings, setRankings] = useState<any[]>([])
  const [meuAlunoId, setMeuAlunoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [categorias, setCategorias] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      try {
        // Buscar meu aluno_id
        if (user?.id) {
          const meuAluno = await getAlunoByUsuarioId(user.id)
          if (meuAluno) setMeuAlunoId(meuAluno.id)
        }

        const treino = await getTreinoDoDia()
        setTreinoHoje(treino)

        if (!treino) { setLoading(false); return }

        const resultadosBanco = await listarResultadosByTreino(treino.id)
        const alunosData = await listarAlunos()
        const alunosAtivos = (alunosData || []).filter((a: any) => a.ativo)

        // Extrair categorias dos alunos que têm resultado
        const catsSet = new Set<string>()
        const rankingData: any[] = []

        for (const aluno of alunosAtivos) {
          const resAluno = resultadosBanco.filter((r: any) => r.aluno_id === aluno.id)
          const resultado = resAluno[0]
          if (resultado && isResultadoValido(resultado, treino.tipo_wod)) {
            const cat = aluno.categoria || 'Sem categoria'
            catsSet.add(cat)
            rankingData.push({
              id: aluno.id,
              nome: aluno.usuario?.nome || aluno.nome || 'Atleta',
              categoria: cat,
              resultado,
            })
          }
        }

        const catsArr = Array.from(catsSet)
        setCategorias(catsArr)
        if (catsArr.length > 0 && !catsArr.includes(categoriaAtiva)) {
          setCategoriaAtiva(catsArr[0])
        }

        // Ordenar pelo tipo do treino
        const sorted = rankingData
          .sort((a: any, b: any) => compararResultados(a.resultado, b.resultado, treino.tipo_wod))
          .map((r, index) => ({ ...r, posicao: index + 1 }))

        setRankings(sorted)
      } catch (err) {
        console.error('Erro ao carregar rankings:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  const rankingFiltrado = rankings
    .filter((r) => r.categoria === categoriaAtiva)
    .map((r, i) => ({ ...r, posicao: i + 1 }))

  const minhaPosicao = rankingFiltrado.find((r) => r.id === meuAlunoId)

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <p className="text-sm text-text-secondary">Carregando rankings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Rankings</h1>
        <p className="text-sm text-text-secondary">
          {treinoHoje
            ? `Ranking do treino: ${treinoHoje.titulo || treinoHoje.tipo_wod || 'Hoje'}`
            : 'Veja sua posicao e compare com outros atletas'}
        </p>
      </div>

      {/* Filtros de categoria */}
      {categorias.length > 0 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {categorias.map((c) => (
            <button
              key={c}
              onClick={() => setCategoriaAtiva(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoriaAtiva === c
                  ? 'bg-accent/15 text-accent border border-accent/20'
                  : 'bg-white/[0.03] text-text-secondary border border-white/[0.05]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {rankingFiltrado.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-text-secondary">
              Nenhum resultado registrado para esta categoria no treino de hoje.
            </p>
          </GlassCard>
        ) : (
          rankingFiltrado.map((r) => (
            <GlassCard
              key={r.id}
              className={`p-4 flex items-center gap-4 ${
                r.id === meuAlunoId ? 'border border-accent bg-accent/5' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                r.posicao === 1 ? 'bg-warning/15 text-warning' :
                r.posicao === 2 ? 'bg-text-secondary/15 text-text-secondary' :
                r.posicao === 3 ? 'bg-orange-500/15 text-orange-500' :
                'bg-white/[0.03] text-text-secondary'
              }`}>
                {r.posicao <= 3 ? <Medal size={16} /> : r.posicao}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {r.nome}
                  {r.id === meuAlunoId && (
                    <span className="ml-2 text-xs text-accent">(Voce)</span>
                  )}
                </p>
                <p className="text-xs text-text-secondary">
                  {formatarResultadoRanking(r.resultado, treinoHoje?.tipo_wod)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-accent">
                  {formatarResultadoRanking(r.resultado, treinoHoje?.tipo_wod)}
                </p>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Destaque */}
      {minhaPosicao && (
        <GlassCard className="p-5 text-center space-y-2">
          <Trophy size={28} className="mx-auto text-warning" />
          <p className="text-lg font-bold text-text-primary">
            Voce esta em {minhaPosicao.posicao}o lugar!
          </p>
          <p className="text-sm text-text-secondary">
            Na categoria {categoriaAtiva}
          </p>
          <p className="text-xs text-accent">
            {formatarResultadoRanking(minhaPosicao.resultado, treinoHoje?.tipo_wod)}
          </p>
        </GlassCard>
      )}
    </div>
  )
}
