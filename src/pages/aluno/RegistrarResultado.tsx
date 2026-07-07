import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/context/AuthContext'
import { criarResultado, getAlunoByUsuarioId, getTreinoById } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Timer, Hash, Weight, Ruler, Camera, MessageSquare,
  Target, Brain, Smile, Save, ChevronRight,
} from 'lucide-react'

type TipoResultado = 'TEMPO' | 'ROUNDS_REPS' | 'CARGA'

export function RegistrarResultado() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const treinoId = (location.state as any)?.treinoId || ''
  const tituloTreino = (location.state as any)?.tituloTreino || 'Treino do dia'
  const [alunoId, setAlunoId] = useState<string>('')

  const [tipo, setTipo] = useState<TipoResultado>('TEMPO')
  const [categoria, setCategoria] = useState<'RX' | 'SCALING' | 'BEGINNER'>('RX')
  const [rpe, setRpe] = useState(5)
  const [form, setForm] = useState({
    tempo: '', rounds: '', repeticoes: '', carga: '', pesoCorporal: '',
    reflexao: '', meta: '', comoSeSentiu: '', foto_url: '', video_url: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
  if (!user?.id || !treinoId) return

  async function load() {
    const aluno = await getAlunoByUsuarioId(user.id)

    if (aluno) {
      setAlunoId(aluno.id)
    }

    const treino = await getTreinoById(treinoId)

    if (treino?.tipo_wod === 'FOR_TIME') {
      setTipo('TEMPO')
    }

    if (treino?.tipo_wod === 'AMRAP') {
      setTipo('ROUNDS_REPS')
    }

    if (treino?.tipo_wod === 'CARGA') {
      setTipo('CARGA')
    }
  }

  load()
}, [user?.id, treinoId])

  function onChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!alunoId) { toast.error('Aluno nao encontrado'); return }
    if (!treinoId) { toast.error('Treino nao informado'); return }
    setLoading(true)
    try {
      await criarResultado({
        aluno_id: alunoId,
        treino_id: treinoId,
        categoria,
        data: new Date().toISOString(),
        tempo: tipo === 'TEMPO' ? form.tempo || undefined : undefined,
        rounds: tipo === 'ROUNDS_REPS' ? (form.rounds ? parseInt(form.rounds) : undefined) : undefined,
        repeticoes: tipo === 'ROUNDS_REPS' ? (form.repeticoes ? parseInt(form.repeticoes) : undefined) : undefined,
        carga: tipo === 'CARGA' ? (form.carga ? parseFloat(form.carga) : undefined) : undefined,
        rpe,
        reflexao: form.reflexao || form.comoSeSentiu || undefined,
        meta_proxima: form.meta || undefined,
        peso_corporal: form.pesoCorporal ? parseFloat(form.pesoCorporal) : undefined,
        foto_url: form.foto_url || undefined,
        video_url: form.video_url || undefined,
      })
      toast.success('Resultado registrado com sucesso!')
      navigate('/aluno/historico')
    } catch (e: any) {
      toast.error('Erro ao registrar resultado: ' + (e.message || 'Tente novamente'))
    } finally {
      setLoading(false)
    }
  }

  const categorias: Array<{ id: 'RX' | 'SCALING' | 'BEGINNER'; label: string }> = [
    { id: 'RX', label: 'RX' },
    { id: 'SCALING', label: 'Scaling' },
    { id: 'BEGINNER', label: 'Beginner' },
  ]

  const tiposResultado: Array<{ id: TipoResultado; label: string }> = [
    { id: 'TEMPO', label: 'Tempo' },
    { id: 'ROUNDS_REPS', label: 'Rounds / Reps' },
    { id: 'CARGA', label: 'Carga' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <p className="text-xs text-text-secondary">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}</p>
        <h1 className="text-2xl font-bold text-text-primary">Registrar Resultado</h1>
        <p className="text-sm text-text-secondary">{tituloTreino}</p>
      </div>

      <GlassCard className="p-5 space-y-5">
        {/* Categoria */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Categoria</label>
          <div className="flex gap-2">
            {categorias.map(c => (
              <button
                key={c.id}
                onClick={() => setCategoria(c.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  categoria === c.id
                    ? 'bg-accent/15 text-accent border border-accent/20'
                    : 'bg-white/[0.02] text-text-secondary border border-white/[0.05]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tipo de resultado */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Tipo de Resultado</label>
          <div className="flex gap-2">
            {tiposResultado.map(t => (
              <button
                key={t.id}
                onClick={() => setTipo(t.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  tipo === t.id
                    ? 'bg-success/15 text-success border border-success/20'
                    : 'bg-white/[0.02] text-text-secondary border border-white/[0.05]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Campos condicionais */}
        {tipo === 'TEMPO' && (
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
              <Timer size={14} className="text-accent" />
              Tempo
            </label>
            <Input value={form.tempo} onChange={e => onChange('tempo', e.target.value)} placeholder="MM:SS" />
          </div>
        )}

        {tipo === 'ROUNDS_REPS' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
                <Hash size={14} className="text-accent" />
                Rounds
              </label>
              <Input type="number" value={form.rounds} onChange={e => onChange('rounds', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
                <Hash size={14} className="text-accent" />
                Repeticoes
              </label>
              <Input type="number" value={form.repeticoes} onChange={e => onChange('repeticoes', e.target.value)} placeholder="0" />
            </div>
          </div>
        )}

        {tipo === 'CARGA' && (
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
              <Weight size={14} className="text-accent" />
              Carga (kg)
            </label>
            <Input type="number" value={form.carga} onChange={e => onChange('carga', e.target.value)} placeholder="0" />
          </div>
        )}

        {/* RPE */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <Smile size={14} className="text-accent" />
            RPE (0 a 10) — {rpe}
          </label>
          <div className="flex gap-1">
            {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
              <button
                key={n}
                onClick={() => setRpe(n)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  rpe === n
                    ? 'bg-accent/15 text-accent border border-accent/20'
                    : 'bg-white/[0.02] text-text-secondary border border-white/[0.03]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Como se sentiu */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
            <Target size={14} className="text-accent" />
            Como se sentiu / O que aprendeu
          </label>
          <textarea
            rows={3}
            value={form.comoSeSentiu}
            onChange={e => onChange('comoSeSentiu', e.target.value)}
            placeholder="Descreva como foi o treino..."
            className="glass-input w-full resize-none text-sm"
          />
        </div>

        {/* Meta proxima */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
            <Target size={14} className="text-warning" />
            Meta para o proximo treino
          </label>
          <Input value={form.meta} onChange={e => onChange('meta', e.target.value)} placeholder="Ex: Manter ritmo consistente" />
        </div>

        {/* Peso corporal */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
            <Ruler size={14} className="text-success" />
            Peso Corporal (opcional)
          </label>
          <Input type="number" value={form.pesoCorporal} onChange={e => onChange('pesoCorporal', e.target.value)} placeholder="kg" />
        </div>

        {/* Foto e Video */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
              <Camera size={14} className="text-accent" />
              Foto (opcional)
            </label>
            <Input value={form.foto_url} onChange={e => onChange('foto_url', e.target.value)} placeholder="URL da imagem" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
              <Brain size={14} className="text-accent" />
              Video (opcional)
            </label>
            <Input value={form.video_url} onChange={e => onChange('video_url', e.target.value)} placeholder="URL do video" />
          </div>
        </div>

        <Button className="w-full" onClick={handleSave} disabled={loading}>
          <Save size={18} className="mr-2" />
          {loading ? 'Salvando...' : 'Salvar Resultado'}
        </Button>
      </GlassCard>
    </div>
  )
}
