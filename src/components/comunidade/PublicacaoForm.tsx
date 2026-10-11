import { useEffect, useRef, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { ImagePlus, Loader2, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  atualizarLegenda,
  cancelarRascunho,
  criarRascunho,
  enviarFotoRascunho,
  publicarPublicacao,
  removerFotoRascunho,
  traduzirErroComunidade,
  COMUNIDADE_MAX_FOTOS,
  type PublicacaoFeed,
} from '@/lib/comunidade'
import type { Publicacao, PublicacaoFoto } from '@/data/types'

interface ArquivoNovo {
  file: File
  preview: string
}

interface PublicacaoFormProps {
  boxId: string
  autorId: string
  /* Rascunho existente (continuar edicao) ou undefined (nova publicacao). */
  rascunho?: PublicacaoFeed | null
  urls: Record<string, string>
  /* Chamado ao publicar, salvar rascunho ou excluir — o pai recarrega. */
  onConcluido: () => void
  /* Fecha o formulario sem alterar nada (rascunho criado permanece salvo). */
  onFechar: () => void
}

/* Formulario de criacao/continuacao de publicacao (staff).
   Fluxo do banco (migration 4.1): RASCUNHO -> upload das fotos ->
   registro em publicacao_fotos -> PUBLICADA. Chamadas sequenciais nao
   sao atomicas; falhas parciais mantem o rascunho para nova tentativa. */
export function PublicacaoForm({
  boxId,
  autorId,
  rascunho,
  urls,
  onConcluido,
  onFechar,
}: PublicacaoFormProps) {
  const [legenda, setLegenda] = useState(rascunho?.legenda ?? '')
  const [novosArquivos, setNovosArquivos] = useState<ArquivoNovo[]>([])
  const [fotosExistentes, setFotosExistentes] = useState<PublicacaoFoto[]>(
    rascunho?.fotos ?? []
  )
  const [rascunhoAtual, setRascunhoAtual] = useState<Pick<
    Publicacao,
    'id' | 'box_id'
  > | null>(rascunho ? { id: rascunho.id, box_id: rascunho.box_id } : null)
  const [enviando, setEnviando] = useState(false)
  const [etapa, setEtapa] = useState('')
  const [removendoId, setRemovendoId] = useState<string | null>(null)
  const [cancelando, setCancelando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const totalFotos = fotosExistentes.length + novosArquivos.length

  /* Libera os object URLs ao desmontar. */
  useEffect(() => {
    return () => {
      novosArquivos.forEach((a) => URL.revokeObjectURL(a.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selecionarArquivos = (lista: FileList | null) => {
    if (!lista) return
    const disponiveis = COMUNIDADE_MAX_FOTOS - totalFotos
    const selecionados = Array.from(lista).filter((f) =>
      f.type.startsWith('image/')
    )

    if (selecionados.length > disponiveis) {
      toast.error(`Maximo de ${COMUNIDADE_MAX_FOTOS} fotos por publicacao.`)
    }

    const aceitos = selecionados.slice(0, Math.max(0, disponiveis))
    setNovosArquivos((prev) => [
      ...prev,
      ...aceitos.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ])

    if (inputRef.current) inputRef.current.value = ''
  }

  const removerNovo = (index: number) => {
    setNovosArquivos((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const removerExistente = async (foto: PublicacaoFoto) => {
    if (removendoId || enviando) return
    if (!window.confirm('Remover esta foto do rascunho?')) return
    setRemovendoId(foto.id)
    try {
      await removerFotoRascunho(foto)
      setFotosExistentes((prev) => prev.filter((f) => f.id !== foto.id))
      toast.success('Foto removida.')
    } catch (e) {
      toast.error(traduzirErroComunidade(e))
    } finally {
      setRemovendoId(null)
    }
  }

  /* Garante um rascunho existente com a legenda atual. */
  const garantirRascunho = async (): Promise<Pick<Publicacao, 'id' | 'box_id'>> => {
    if (rascunhoAtual) {
      if (rascunho && legenda !== rascunho.legenda) {
        await atualizarLegenda(rascunhoAtual.id, legenda.trim())
      }
      return rascunhoAtual
    }
    const novo = await criarRascunho({
      box_id: boxId,
      autor_id: autorId,
      legenda: legenda.trim(),
    })
    const ref = { id: novo.id, box_id: novo.box_id }
    setRascunhoAtual(ref)
    return ref
  }

  /* Envia as fotos novas, atualizando o estado a cada sucesso para que
     uma falha parcial nao perca o que ja foi enviado. */
  const enviarNovasFotos = async (
    rasc: Pick<Publicacao, 'id' | 'box_id'>
  ): Promise<number> => {
    let enviadas = 0
    let ordemBase = fotosExistentes.length

    for (let i = 0; i < novosArquivos.length; i++) {
      setEtapa(
        `Enviando foto ${enviadas + 1} de ${novosArquivos.length}...`
      )
      const foto = await enviarFotoRascunho(
        rasc,
        novosArquivos[i].file,
        ordemBase + enviadas
      )
      setFotosExistentes((prev) => [...prev, foto])
      enviadas++
    }

    setNovosArquivos((prev) => {
      prev.slice(0, enviadas).forEach((a) => URL.revokeObjectURL(a.preview))
      return prev.slice(enviadas)
    })

    return enviadas
  }

  const executar = async (publicar: boolean) => {
    if (enviando || cancelando) return

    if (!legenda.trim() && totalFotos === 0) {
      toast.error('Escreva uma legenda ou adicione ao menos uma foto.')
      return
    }

    setEnviando(true)
    try {
      setEtapa('Salvando rascunho...')
      const rasc = await garantirRascunho()

      if (novosArquivos.length > 0) {
        await enviarNovasFotos(rasc)
      }

      if (publicar) {
        setEtapa('Publicando...')
        await publicarPublicacao(rasc.id)
        toast.success('Publicacao publicada na Comunidade!')
      } else {
        toast.success('Rascunho salvo. Voce pode publicar depois.')
      }

      onConcluido()
    } catch (e) {
      console.error('Erro no fluxo de publicacao:', e)
      toast.error(traduzirErroComunidade(e))
      toast(
        'O rascunho foi preservado — voce pode continuar em "Rascunhos".',
        { icon: 'i' }
      )
    } finally {
      setEnviando(false)
      setEtapa('')
    }
  }

  const excluirRascunho = async () => {
    if (!rascunhoAtual || enviando || cancelando) return
    if (
      !window.confirm(
        'Excluir este rascunho? As fotos enviadas serao removidas do storage.'
      )
    )
      return

    setCancelando(true)
    try {
      await cancelarRascunho(rascunhoAtual)
      toast.success('Rascunho excluido.')
      onConcluido()
    } catch (e) {
      toast.error(traduzirErroComunidade(e))
    } finally {
      setCancelando(false)
    }
  }

  return (
    <GlassCard className="p-4 space-y-4 border-accent/20">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-text-primary">
          {rascunho ? 'Continuar rascunho' : 'Nova publicacao'}
        </h2>
        <button
          onClick={onFechar}
          disabled={enviando || cancelando}
          className="text-text-secondary hover:text-text-primary p-1 disabled:opacity-40"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      </div>

      <textarea
        value={legenda}
        onChange={(e) => setLegenda(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Escreva uma legenda para a publicacao..."
        className="glass-input w-full resize-none text-sm"
        disabled={enviando}
      />

      {/* Fotos existentes no rascunho */}
      {fotosExistentes.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {fotosExistentes.map((foto, i) => (
            <div
              key={foto.id}
              className="relative aspect-square rounded-xl overflow-hidden bg-white/[0.02]"
            >
              {urls[foto.storage_path] ? (
                <img
                  src={urls[foto.storage_path]}
                  alt={`Foto ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-text-secondary">
                  ...
                </div>
              )}
              <button
                onClick={() => removerExistente(foto)}
                disabled={removendoId === foto.id || enviando}
                className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 text-white/80 hover:text-error disabled:opacity-40"
                aria-label="Remover foto"
              >
                {removendoId === foto.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Trash2 size={12} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pre-visualizacao das fotos novas */}
      {novosArquivos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {novosArquivos.map((a, i) => (
            <div
              key={a.preview}
              className="relative aspect-square rounded-xl overflow-hidden bg-white/[0.02]"
            >
              <img
                src={a.preview}
                alt={`Nova foto ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removerNovo(i)}
                disabled={enviando}
                className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 text-white/80 hover:text-error disabled:opacity-40"
                aria-label="Remover foto"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Seletor de fotos */}
      {totalFotos < COMUNIDADE_MAX_FOTOS && (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.12] py-3 text-sm text-text-secondary hover:text-accent hover:border-accent/40 transition disabled:opacity-40"
        >
          <ImagePlus size={16} />
          Adicionar fotos ({totalFotos}/{COMUNIDADE_MAX_FOTOS})
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => selecionarArquivos(e.target.files)}
      />

      <p className="text-[11px] text-text-secondary">
        As imagens sao comprimidas no navegador (max. 2 MB cada) antes do envio.
      </p>

      {etapa && (
        <p className="text-xs text-accent flex items-center gap-2">
          <Loader2 size={12} className="animate-spin" />
          {etapa}
        </p>
      )}

      {/* Acoes */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          size="sm"
          disabled={enviando || cancelando}
          onClick={() => executar(true)}
        >
          {enviando ? 'Enviando...' : 'Publicar'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={enviando || cancelando}
          onClick={() => executar(false)}
        >
          Salvar rascunho
        </Button>
        {rascunhoAtual && (
          <Button
            variant="danger"
            size="sm"
            disabled={enviando || cancelando}
            onClick={excluirRascunho}
          >
            {cancelando ? 'Excluindo...' : 'Excluir rascunho'}
          </Button>
        )}
      </div>
    </GlassCard>
  )
}
