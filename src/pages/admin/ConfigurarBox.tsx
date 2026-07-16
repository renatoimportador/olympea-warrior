import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useBox } from '@/context/BoxContext'
import { atualizarBox } from '@/lib/api'
import { Building2, Save, Palette, Globe, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export function ConfigurarBox() {
  const { box, setBox } = useBox()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome: box.nome,
    cor_primaria: box.cor_primaria,
    cor_secundaria: box.cor_secundaria,
    cor_sucesso: box.cor_sucesso,
    cor_alerta: box.cor_alerta,
    cor_erro: box.cor_erro,
    dominio_customizado: box.dominio_customizado,
  })

  async function handleSave() {
    if (saving) return
    if (!box.id) {
      toast.error('Box nao identificado')
      return
    }

    setSaving(true)
    try {
      const updated = await atualizarBox(box.id, {
        nome: form.nome,
        cor_primaria: form.cor_primaria,
        cor_secundaria: form.cor_secundaria,
        cor_sucesso: form.cor_sucesso,
        cor_alerta: form.cor_alerta,
        cor_erro: form.cor_erro,
        dominio_customizado: form.dominio_customizado || null,
      })

      setBox({ ...box, ...updated })
      toast.success('Configuracoes do box salvas!')
    } catch (err: any) {
      console.error('Erro ao salvar box:', err)
      toast.error(err?.message || 'Erro ao salvar configuracoes')
    } finally {
      setSaving(false)
    }
  }

  const cores = [
    { label: 'Primaria', campo: 'cor_primaria' as const, valor: form.cor_primaria },
    { label: 'Secundaria', campo: 'cor_secundaria' as const, valor: form.cor_secundaria },
    { label: 'Sucesso', campo: 'cor_sucesso' as const, valor: form.cor_sucesso },
    { label: 'Alerta', campo: 'cor_alerta' as const, valor: form.cor_alerta },
    { label: 'Erro', campo: 'cor_erro' as const, valor: form.cor_erro },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">Configurar Box</h1>
        <p className="text-sm text-text-secondary">Personalize a identidade visual do seu box</p>
      </div>

      <GlassCard className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center text-bg-primary font-bold text-2xl">
            {form.nome.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">{form.nome || 'Meu Box'}</h2>
            <p className="text-xs text-text-secondary">Slug: {box.slug}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
              <Building2 size={14} className="text-accent" />
              Nome do Box
            </label>
            <Input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
              <Palette size={14} className="text-accent" />
              Paleta de Cores
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cores.map((c) => (
                <div key={c.campo} className="space-y-1">
                  <p className="text-xs text-text-secondary">{c.label}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={c.valor}
                      onChange={(e) => setForm({ ...form, [c.campo]: e.target.value })}
                      className="w-8 h-8 rounded border-0 cursor-pointer"
                    />
                    <span className="text-xs text-text-secondary font-mono">{c.valor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
              <Globe size={14} className="text-accent" />
              Dominio Customizado
            </label>
            <Input
              value={form.dominio_customizado || ''}
              onChange={(e) => setForm({ ...form, dominio_customizado: e.target.value })}
              placeholder="meubox.olympea.com"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          <Save size={18} className="mr-2" />
          {saving ? 'Salvando...' : 'Salvar Configuracoes'}
        </Button>
      </GlassCard>

      <GlassCard className="p-5 space-y-3">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Check size={16} className="text-success" />
          Status do Whitelabel
        </h3>
        <div className="space-y-2">
          {[
            { label: 'Nome customizado', ok: !!form.nome },
            { label: 'Logo propria', ok: false },
            { label: 'Cores customizadas', ok: true },
            { label: 'Dominio proprio', ok: !!form.dominio_customizado },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
              <span className="text-sm text-text-primary">{s.label}</span>
              <span className={`text-xs ${s.ok ? 'text-success' : 'text-text-secondary'}`}>
                {s.ok ? 'Ativo' : 'Padrao'}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
