import { useCallback, useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { FileEdit, Image, Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  cancelarRascunho,
  listarPublicacoes,
  obterUrlsAssinadas,
  tempoRelativo,
  traduzirErroComunidade,
  type PublicacaoFeed,
} from '@/lib/comunidade'
import type { UserRole } from '@/data/types'

interface RascunhosListProps {
  usuarioId: string
  papel: UserRole
  refreshKey?: number
  /* Abre o formulario para continuar/publicar o rascunho (somente autor). */
  onContinuar: (
    rascunho: PublicacaoFeed,
    urls: Record<string, string>
  ) => void
  /* Chamado apos exclusao para o pai atualizar contagens/feed. */
  onAlterado?: () => void
}

/* Lista de rascunhos visiveis pela RLS: coach ve os proprios; admin ve
   todos os do Box (para limpeza/moderacao). */
export function RascunhosList({
  usuarioId,
  papel,
  refreshKey = 0,
  onContinuar,
  onAlterado,
}: RascunhosListProps) {
  const [rascunhos, setRascunhos] = useState<PublicacaoFeed[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const lista = await listarPublicacoes({ pagina: 0, status: 'RASCUNHO' })
      setRascunhos(lista)
      const paths = lista.flatMap((r) => r.fotos.map((f) => f.storage_path))
      if (paths.length > 0) {
        setUrls(await obterUrlsAssinadas(paths))
      } else {
        setUrls({})
      }
    } catch (e) {
      console.error('Erro ao carregar rascunhos:', e)
      toast.error(traduzirErroComunidade(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar, refreshKey])

  const excluir = async (r: PublicacaoFeed) => {
    if (excluindoId) return
    if (
      !window.confirm(
        'Excluir este rascunho? Os arquivos serao removidos do storage antes da exclusao.'
      )
    )
      return

    setExcluindoId(r.id)
    try {
      await cancelarRascunho({ id: r.id, box_id: r.box_id })
      setRascunhos((prev) => prev.filter((x) => x.id !== r.id))
      toast.success('Rascunho excluido.')
      onAlterado?.()
    } catch (e) {
      toast.error(traduzirErroComunidade(e))
    } finally {
      setExcluindoId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-text-secondary">Carregando rascunhos...</p>
  }

  if (rascunhos.length === 0) {
    return (
      <GlassCard className="p-6 text-center space-y-2">
        <FileEdit size={28} className="mx-auto text-text-secondary" />
        <p className="text-text-primary font-medium">Nenhum rascunho</p>
        <p className="text-sm text-text-secondary">
          Rascunhos de publicacoes em preparacao aparecem aqui.
        </p>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-3">
      {rascunhos.map((r) => {
        const ehAutor = r.autor_id === usuarioId
        return (
          <GlassCard key={r.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="warning">Rascunho</Badge>
                  <span className="text-xs text-text-secondary">
                    {r.autor?.nome || 'Autor'} — {tempoRelativo(r.created_at)}
                  </span>
                </div>
                <p className="text-sm text-text-primary line-clamp-2 break-words">
                  {r.legenda || '(sem legenda)'}
                </p>
                <p className="text-xs text-text-secondary flex items-center gap-1">
                  <Image size={11} />
                  {r.fotos.length} foto(s) registrada(s)
                </p>
              </div>

              {/* Miniaturas */}
              {r.fotos.length > 0 && (
                <div className="flex gap-1 flex-shrink-0">
                  {r.fotos.slice(0, 3).map((f) =>
                    urls[f.storage_path] ? (
                      <img
                        key={f.id}
                        src={urls[f.storage_path]}
                        alt="Miniatura"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : null
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {ehAutor && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onContinuar(r, urls)}
                >
                  Continuar / Publicar
                </Button>
              )}
              {(ehAutor || papel === 'admin') && (
                <Button
                  variant="danger"
                  size="sm"
                  disabled={excluindoId === r.id}
                  onClick={() => excluir(r)}
                >
                  {excluindoId === r.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Excluir
                </Button>
              )}
            </div>
          </GlassCard>
        )
      })}
    </div>
  )
}
