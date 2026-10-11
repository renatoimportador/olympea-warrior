import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { atualizarLegenda, traduzirErroComunidade } from '@/lib/comunidade'
import type { PublicacaoFeed } from '@/lib/comunidade'

interface EditarLegendaModalProps {
  post: PublicacaoFeed
  onSalvo: () => void
  onFechar: () => void
}

/* Edicao de legenda (autor ou admin). Fotos de publicacao PUBLICADA nao
   podem ser alteradas — protecao do banco (migration 4.1). */
export function EditarLegendaModal({
  post,
  onSalvo,
  onFechar,
}: EditarLegendaModalProps) {
  const [legenda, setLegenda] = useState(post.legenda)
  const [salvando, setSalvando] = useState(false)

  const salvar = async () => {
    if (salvando) return
    setSalvando(true)
    try {
      await atualizarLegenda(post.id, legenda.trim())
      toast.success('Legenda atualizada.')
      onSalvo()
    } catch (e) {
      toast.error(traduzirErroComunidade(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onFechar}
    >
      <GlassCard
        className="w-full max-w-lg p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-text-primary">Editar legenda</h2>
          <button
            onClick={onFechar}
            className="text-text-secondary hover:text-text-primary p-1"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <textarea
          value={legenda}
          onChange={(e) => setLegenda(e.target.value)}
          rows={4}
          maxLength={2000}
          className="glass-input w-full resize-none text-sm"
          autoFocus
        />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button size="sm" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}
