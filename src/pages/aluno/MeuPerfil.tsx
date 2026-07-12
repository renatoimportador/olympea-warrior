import { useAuth } from '@/context/AuthContext'
import { useState, useEffect } from 'react'
import type { Aluno } from '@/data/types'
import { getAlunoByUsuarioId, atualizarPerfilAluno, atualizarUsuario } from '@/lib/api'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Edit3, Phone, AlertTriangle, Shield, Target, User, Ruler, Weight, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

function parseContatoEmergencia(valor: string | undefined): { nome: string; telefone: string } {
  if (!valor) return { nome: '', telefone: '' }
  const partes = valor.split('|').map(s => s.trim())
  return { nome: partes[0] || '', telefone: partes[1] || '' }
}

function formatContatoEmergencia(nome: string, telefone: string): string {
  if (!nome && !telefone) return ''
  if (!telefone) return nome
  if (!nome) return telefone
  return `${nome} | ${telefone}`
}

export function MeuPerfil() {
  const { user } = useAuth()
  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const [form, setForm] = useState({
    telefone: '',
    lesoes: '',
    restricoes: '',
    emergencia_nome: '',
    emergencia_telefone: '',
  })

  useEffect(() => {
    async function loadAluno() {
      if (!user) return
      const a = await getAlunoByUsuarioId(user.id)
      if (a) {
        setAluno(a)
        const contato = parseContatoEmergencia(a.contato_emergencia)
        setForm({
          telefone: user.telefone || '',
          lesoes: a.lesoes || '',
          restricoes: a.restricoes || '',
          emergencia_nome: contato.nome,
          emergencia_telefone: contato.telefone,
        })
      }
    }
    loadAluno()
  }, [user])

  function handleEditar() {
    setEditando(true)
  }

  function handleCancelar() {
    setEditando(false)
    if (aluno && user) {
      const contato = parseContatoEmergencia(aluno.contato_emergencia)
      setForm({
        telefone: user.telefone || '',
        lesoes: aluno.lesoes || '',
        restricoes: aluno.restricoes || '',
        emergencia_nome: contato.nome,
        emergencia_telefone: contato.telefone,
      })
    }
  }

  async function handleSalvar() {
    if (!aluno || !user) return
    setSalvando(true)

    try {
      if (form.telefone !== (user.telefone || '')) {
        await atualizarUsuario(user.id, { telefone: form.telefone || undefined })
      }

      const contatoEmergencia = formatContatoEmergencia(form.emergencia_nome, form.emergencia_telefone)

      await atualizarPerfilAluno(aluno.id, {
        lesoes: form.lesoes || undefined,
        restricoes: form.restricoes || undefined,
        contato_emergencia: contatoEmergencia || undefined,
      })

      const alunoAtualizado = await getAlunoByUsuarioId(user.id)
      if (alunoAtualizado) setAluno(alunoAtualizado)

      setEditando(false)
      toast.success('Perfil atualizado!')
    } catch (e: any) {
      console.error('Erro ao salvar perfil:', e)
      toast.error(e?.message || 'Erro ao salvar perfil')
    } finally {
      setSalvando(false)
    }
  }

  const contatoExibicao = parseContatoEmergencia(aluno?.contato_emergencia)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Meu Perfil</h1>
        <p className="text-sm text-text-secondary">Seus dados pessoais e preferencias</p>
      </div>

      <GlassCard className="p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center text-bg-primary font-bold text-2xl">
          {user?.nome?.charAt(0) || 'A'}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-text-primary">{user?.nome}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="accent">{aluno?.categoria || 'BEGINNER'}</Badge>
            <span className="text-xs text-text-secondary">{user?.email}</span>
          </div>
        </div>
        <button
          onClick={editando ? handleCancelar : handleEditar}
          className="p-2 rounded-xl hover:bg-white/[0.03] transition-colors"
        >
          {editando ? <X size={18} className="text-error" /> : <Edit3 size={18} className="text-text-secondary" />}
        </button>
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Ruler size={16} className="text-accent" />
          Dados Fisicos
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.02] space-y-1">
            <div className="flex items-center gap-1.5">
              <Weight size={14} className="text-accent" />
              <p className="text-xs text-text-secondary">Peso</p>
            </div>
            <p className="text-lg font-bold text-text-primary">{aluno?.peso_atual || '--'}<span className="text-sm text-text-secondary">kg</span></p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] space-y-1">
            <div className="flex items-center gap-1.5">
              <Ruler size={14} className="text-accent" />
              <p className="text-xs text-text-secondary">Altura</p>
            </div>
            <p className="text-lg font-bold text-text-primary">{aluno?.altura || '--'}<span className="text-sm text-text-secondary">cm</span></p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Phone size={16} className="text-accent" />
          Telefone
        </h3>
        {editando ? (
          <Input
            placeholder="(00) 00000-0000"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          />
        ) : (
          <p className="text-sm text-text-primary">{form.telefone || user?.telefone || 'Nao cadastrado'}</p>
        )}
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Target size={16} className="text-success" />
          Objetivos
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {aluno?.objetivos || 'Nenhum objetivo cadastrado. Fale com seu coach!'}
        </p>
        <p className="text-[10px] text-text-secondary italic">Objetivos sao definidos pelo Coach/Admin</p>
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <AlertTriangle size={16} className="text-warning" />
          Saude e Lesoes
        </h3>
        {editando ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Lesoes</label>
              <textarea
                rows={2}
                value={form.lesoes}
                onChange={(e) => setForm({ ...form, lesoes: e.target.value })}
                className="glass-input w-full resize-none text-sm"
                placeholder="Descreva lesoes atuais ou anteriores..."
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Restricoes</label>
              <textarea
                rows={2}
                value={form.restricoes}
                onChange={(e) => setForm({ ...form, restricoes: e.target.value })}
                className="glass-input w-full resize-none text-sm"
                placeholder="Restricoes medicas ou fisicas..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <p className="text-xs text-text-secondary mb-0.5">Lesoes</p>
              <p className="text-sm text-text-primary">{aluno?.lesoes || 'Nenhuma lesao registrada'}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-0.5">Restricoes</p>
              <p className="text-sm text-text-primary">{aluno?.restricoes || 'Nenhuma restricao'}</p>
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Shield size={16} className="text-error" />
          Contato de Emergencia
        </h3>
        {editando ? (
          <div className="space-y-3">
            <Input
              placeholder="Nome do contato"
              value={form.emergencia_nome}
              onChange={(e) => setForm({ ...form, emergencia_nome: e.target.value })}
            />
            <Input
              placeholder="Telefone do contato"
              value={form.emergencia_telefone}
              onChange={(e) => setForm({ ...form, emergencia_telefone: e.target.value })}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
              <User size={16} className="text-text-secondary" />
              <div>
                <p className="text-sm text-text-primary">{contatoExibicao.nome || 'Nao cadastrado'}</p>
                <p className="text-xs text-text-secondary">Contato principal</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
              <Phone size={16} className="text-text-secondary" />
              <div>
                <p className="text-sm text-text-primary">{contatoExibicao.telefone || 'Nao cadastrado'}</p>
                <p className="text-xs text-text-secondary">Telefone</p>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {editando && (
        <div className="flex gap-3">
          <Button onClick={handleSalvar} disabled={salvando} className="flex-1">
            <Save size={16} className="mr-2" />
            {salvando ? 'Salvando...' : 'Salvar Alteracoes'}
          </Button>
          <Button variant="ghost" onClick={handleCancelar}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}
