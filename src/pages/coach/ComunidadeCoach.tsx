import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Pencil, Plus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useBox } from '@/context/BoxContext'
import { FeedComunidade } from '@/components/comunidade/FeedComunidade'
import { PublicacaoForm } from '@/components/comunidade/PublicacaoForm'
import { RascunhosList } from '@/components/comunidade/RascunhosList'
import { EditarLegendaModal } from '@/components/comunidade/EditarLegendaModal'
import type { PublicacaoFeed } from '@/lib/comunidade'

type Aba = 'feed' | 'rascunhos'

/* Comunidade Olympea — visao do coach: feed do Box, criacao de
   publicacoes e gestao dos proprios rascunhos. Sem moderacao. */
export function ComunidadeCoach() {
  const { user } = useAuth()
  const { box } = useBox()

  const [aba, setAba] = useState<Aba>('feed')
  const [formAberto, setFormAberto] = useState(false)
  const [rascunhoEdicao, setRascunhoEdicao] = useState<PublicacaoFeed | null>(null)
  const [urlsRascunho, setUrlsRascunho] = useState<Record<string, string>>({})
  const [postEditando, setPostEditando] = useState<PublicacaoFeed | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  if (!user) return null

  const recarregar = () => setRefreshKey((k) => k + 1)

  const abrirNovaPublicacao = () => {
    setRascunhoEdicao(null)
    setUrlsRascunho({})
    setFormAberto(true)
  }

  const continuarRascunho = (
    rascunho: PublicacaoFeed,
    urls: Record<string, string>
  ) => {
    setRascunhoEdicao(rascunho)
    setUrlsRascunho(urls)
    setFormAberto(true)
  }

  const acoesPost = (post: PublicacaoFeed) =>
    post.autor_id === user.id ? (
      <button
        onClick={() => setPostEditando(post)}
        className="text-text-secondary hover:text-accent p-1.5"
        title="Editar legenda"
        aria-label="Editar legenda"
      >
        <Pencil size={15} />
      </button>
    ) : undefined

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-text-primary">
            Comunidade Olympea
          </h1>
          <p className="text-sm text-text-secondary">
            Feed do seu Box — compartilhe fotos e novidades com os alunos
          </p>
        </div>
        <Button size="sm" onClick={abrirNovaPublicacao} disabled={formAberto}>
          <Plus size={16} />
          Nova publicacao
        </Button>
      </div>

      {formAberto && (
        <PublicacaoForm
          boxId={box.id}
          autorId={user.id}
          rascunho={rascunhoEdicao}
          urls={urlsRascunho}
          onConcluido={() => {
            setFormAberto(false)
            setRascunhoEdicao(null)
            recarregar()
          }}
          onFechar={() => {
            setFormAberto(false)
            setRascunhoEdicao(null)
            recarregar()
          }}
        />
      )}

      <div className="flex gap-2 border-b border-white/[0.06] pb-2">
        <button
          onClick={() => setAba('feed')}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${
            aba === 'feed'
              ? 'bg-accent/10 text-accent'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
          }`}
        >
          Feed
        </button>
        <button
          onClick={() => setAba('rascunhos')}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${
            aba === 'rascunhos'
              ? 'bg-accent/10 text-accent'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
          }`}
        >
          Meus rascunhos
        </button>
      </div>

      {aba === 'feed' && (
        <FeedComunidade
          papel="coach"
          usuarioId={user.id}
          usuarioNome={user.nome}
          usuarioFoto={user.foto_url}
          filtroAtivo={true}
          refreshKey={refreshKey}
          acoesPost={acoesPost}
        />
      )}

      {aba === 'rascunhos' && (
        <RascunhosList
          usuarioId={user.id}
          papel="coach"
          refreshKey={refreshKey}
          onContinuar={continuarRascunho}
          onAlterado={recarregar}
        />
      )}

      {postEditando && (
        <EditarLegendaModal
          post={postEditando}
          onSalvo={() => {
            setPostEditando(null)
            recarregar()
          }}
          onFechar={() => setPostEditando(null)}
        />
      )}
    </div>
  )
}
