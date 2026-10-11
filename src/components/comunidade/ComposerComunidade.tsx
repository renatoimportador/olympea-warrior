import { GlassCard } from '@/components/ui/GlassCard'
import { ImagePlus } from 'lucide-react'
import { useState } from 'react'

interface ComposerComunidadeProps {
  nome: string
  fotoUrl?: string
  /* Abre o formulario de publicacao (com foco em texto ou em fotos). */
  onNovaPublicacao: () => void
  disabled?: boolean
}

/* Composer estilo rede social: foto do perfil + texto de chamada +
   atalho para selecionar fotos. Qualquer clique abre o formulario. */
export function ComposerComunidade({
  nome,
  fotoUrl,
  onNovaPublicacao,
  disabled = false,
}: ComposerComunidadeProps) {
  const [erroFoto, setErroFoto] = useState(false)
  const inicial = (nome || '?').trim().charAt(0).toUpperCase()

  return (
    <GlassCard className="p-3">
      <div className="flex items-center gap-3">
        {fotoUrl && !erroFoto ? (
          <img
            src={fotoUrl}
            alt={nome}
            onError={() => setErroFoto(true)}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-white/10"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold flex-shrink-0">
            {inicial}
          </div>
        )}

        <button
          onClick={onNovaPublicacao}
          disabled={disabled}
          className="flex-1 text-left px-4 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-sm text-text-secondary hover:border-accent/30 hover:text-text-primary transition disabled:opacity-40"
        >
          O que voce quer compartilhar hoje?
        </button>

        <button
          onClick={onNovaPublicacao}
          disabled={disabled}
          className="p-2.5 rounded-full text-accent hover:bg-accent/10 transition disabled:opacity-40"
          aria-label="Adicionar fotos"
          title="Adicionar fotos"
        >
          <ImagePlus size={20} />
        </button>
      </div>
    </GlassCard>
  )
}
