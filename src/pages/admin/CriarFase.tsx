import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  listarFasesByProg,
  listarSemanasByFase,
  criarFase,
  atualizarFase,
  excluirFase,
  listarProgramacoes,
} from '@/lib/api'
import type { Fase, Semana, Programacao } from '@/data/types'
import { useAuth } from '@/context/AuthContext'
import { Layers, Plus, Edit2, Copy, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function CriarFase() {
  const { user } = useAuth()

  const [showForm, setShowForm] = useState(false)
  const [fases, setFases] = useState<Fase[]>([])
  const [semanasMap, setSemanasMap] = useState<Record<string, Semana[]>>({})
  const [programacoes, setProgramacoes] = useState<Programacao[]>([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    nome: '',
    ordem: 1,
    descricao: '',
    programacao_id: '',
  })

  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    try {
      const progs = (await listarProgramacoes()) || []
      setProgramacoes(progs)

      const allFases: Fase[] = []
      const semanasPorFase: Record<string, Semana[]> = {}

      for (const prog of progs) {
        const fasesProg = (await listarFasesByProg(prog.id)) || []
        allFases.push(...fasesProg)

        for (const fase of fasesProg) {
          const semanas = (await listarSemanasByFase(fase.id)) || []
          semanasPorFase[fase.id] = semanas
        }
      }

      setFases(allFases)
      setSemanasMap(semanasPorFase)
    } catch (e) {
      console.error('Erro ao carregar fases:', e)
      toast.error('Erro ao carregar fases')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      toast.error('Digite o nome da fase')
      return
    }

    if (!form.programacao_id) {
      toast.error('Selecione a programação')
      return
    }

    if (!user?.id) {
      toast.error('Usuário não autenticado')
      return
    }

    try {
      if (editId) {
        await atualizarFase(editId, {
          nome: form.nome,
          ordem: form.ordem,
          descricao: form.descricao,
          programacao_id: form.programacao_id,
        } as any)

        toast.success('Fase atualizada!')
        await loadData()
      } else {
        console.log('PROGRAMACAO SELECIONADA:', form.programacao_id)
        console.log('PROGRAMACOES:', programacoes)

        const novaFase = await criarFase({
          nome: form.nome,
          ordem: form.ordem,
          descricao: form.descricao,
          programacao_id: form.programacao_id,
          ativa: true,
          duracao_semanas: 1,
          created_by: user.id,
        } as any)

        console.log('FASE CRIADA:', novaFase)

        if (novaFase) {
          setFases((prev) => [...prev, novaFase as Fase])
        }

        toast.success('Fase criada!')
      }

      setShowForm(false)
      setForm({
        nome: '',
        ordem: 1,
        descricao: '',
        programacao_id: '',
      })

      setEditId(null)
    } catch (e: any) {
      console.error('Erro ao salvar fase:', e)
      toast.error('Erro ao salvar: ' + (e?.message || 'Verifique os dados'))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir esta fase?')) return

    try {
      await excluirFase(id)
      setFases((prev) => prev.filter((f) => f.id !== id))
      toast.success('Fase excluída!')
    } catch {
      toast.error('Erro ao excluir fase')
    }
  }

  function handleEdit(fase: Fase) {
    setForm({
      nome: fase.nome,
      ordem: fase.ordem,
      descricao: fase.descricao || '',
      programacao_id: fase.programacao_id,
    })

    setEditId(fase.id)
    setShowForm(true)
  }

  const fasesAtivas = fases.filter((f) => f.ativa !== false)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* resto do render permanece igual */}
    </div>
  )
}
