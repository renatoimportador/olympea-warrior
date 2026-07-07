import { useState, useEffect } from 'react'
import {useAuth } from '@/context/AuthContext'
import { GlassCard } from '@/components/ui/GlassCard'
import { Trophy, Medal } from 'lucide-react'

import { listarResultados, listarUsuarios } from '@/lib/api'
import type { Resultado, Usuario } from '@/data/types'
const categorias = ['RX', 'Scaling', 'Beginner'] as const
const periodos = ['Semanal', 'Mensal', 'Anual'] as const


export function RankingsAluno() {
  const { user } = useAuth()
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('RX')
  const [periodoAtivo, setPeriodoAtivo] = useState<string>('Semanal')
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  const ranking = usuarios
  .map((usuario) => {
    const resultadosAluno = resultados.filter(
      (r) =>
        r.aluno_id === usuario.id &&
        r.categoria?.toUpperCase() === categoriaAtiva.toUpperCase()
    )

    return {
      id: usuario.id,
      nome: usuario.nome,
      categoria: categoriaAtiva,
      treinos: resultadosAluno.length,
      pontos: resultadosAluno.length * 100,
      ultimoTreino:
        resultadosAluno.length > 0
      ? resultadosAluno[resultadoAluno.length - 1].data
        : null,
    }
  })
  .filter((a) => a.treinos > 0)
  .sort((a, b) => b.pontos - a.pontos)
  .map((a, index) => ({
    ...a,
    posicao: index + 1,
  }))
useEffect(() => {
  async function load() {
    const resultadosBanco = await listarResultados()
    const usuariosBanco = await listarUsuarios()

    setResultados(resultadosBanco || [])
    setUsuarios(usuariosBanco || [])
  }

  load()
}, [])
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Rankings</h1>
        <p className="text-sm text-text-secondary">Veja sua posicao e compare com outros atletas</p>
      </div>

      {/* Filtros */}
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

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {periodos.map((p) => (
          <button
            key={p}
            onClick={() => setPeriodoAtivo(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              periodoAtivo === p
                ? 'bg-success/15 text-success border border-success/20'
                : 'bg-white/[0.03] text-text-secondary border border-white/[0.05]'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {ranking
          .filter((r) => r.categoria === categoriaAtiva)
          .map((r) => (
            <GlassCard
  key={r.id}
  className={`p-4 flex items-center gap-4 ${
    r.id === user?.id
      ? 'border border-accent bg-accent/5'
      : ''
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

  {r.id === user?.id && (
    <span className="ml-2 text-xs text-accent">
      (Você)
    </span>
  )}
</p>
                <p className="text-xs text-text-secondary">{r.treinos} treinos concluidos</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-accent">{r.pontos}<span className="text-xs text-text-secondary">pts</span></p>
              </div>
            </GlassCard>
          ))}
      </div>

      {/* Destaque */}
      <GlassCard className="p-5 text-center space-y-3">
        <Trophy size={28} className="mx-auto text-warning" />
        <p className="text-lg font-bold text-text-primary">Voce esta em 1o lugar!</p>
        <p className="text-sm text-text-secondary">Na categoria RX - Semanal</p>
        <div className="w-full h-2 rounded-full bg-white/[0.05] mt-2">
          <div className="h-full rounded-full bg-gradient-accent" style={{ width: '85%' }} />
        </div>
        <p className="text-xs text-text-secondary">850 / 1000 pontos para o proximo nivel</p>
      </GlassCard>
    </div>
  )
}
