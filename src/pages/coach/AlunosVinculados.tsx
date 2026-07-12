import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { listarAlunos } from '@/lib/api'
import { Users, Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'

export function AlunosVinculados() {
  const [alunos, setAlunos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  useEffect(() => {
    async function carregar() {
      try {
        const data = await listarAlunos()
        console.log('ALUNOS >>>', data)
        setAlunos((data || []).filter((a: any) => a.ativo))
      } catch (e) {
        console.error('Erro ao carregar alunos:', e)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  const filtrados = alunos.filter((a: any) => {
    const nome = a.usuario?.nome || ''
    return nome.toLowerCase().includes(busca.toLowerCase())
  })

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <h1 className="text-2xl font-bold text-text-primary">Alunos Vinculados</h1>
        <p className="text-sm text-text-secondary">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Alunos Vinculados</h1>
        <p className="text-sm text-text-secondary">{alunos.length} alunos ativos</p>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <Input className="pl-10" placeholder="Buscar aluno..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtrados.length === 0 && (
          <GlassCard className="p-8 text-center">
            <Users size={32} className="mx-auto text-text-secondary mb-2" />
            <p className="text-sm text-text-secondary">Nenhum aluno encontrado.</p>
          </GlassCard>
        )}
        {filtrados.map((a: any) => (
          <GlassCard key={a.id} className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center font-bold text-accent text-sm">
              {a.usuario?.nome?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{a.usuario?.nome || 'Sem nome'}</p>
              <p className="text-xs text-text-secondary">{a.usuario?.email || ''}</p>
            </div>
            <Badge variant="accent">{a.categoria || '--'}</Badge>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
