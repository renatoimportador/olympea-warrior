import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { EyeOff, Pencil, Plus, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { useBox } from '@/context/BoxContext'
import { FeedComunidade } from '@/components/comunidade/FeedComunidade'
import { PublicacaoForm } from '@/components/comunidade/PublicacaoForm'
import { RascunhosList } from '@/components/comunidade/RascunhosList'
import { EditarLegendaModal } from '@/components/comunidade/EditarLegendaModal'
import {
  moderarPublicacao,
  traduzirErroComunidade,
  type PublicacaoFeed,
} from '@/lib/comunidade'

type Aba = 'feed' | 'rascunhos' | 'moderadas'

/* Comunidade Olympea — visao do administrador: feed completo do Box,
   criacao de publicacoes, gestao de rascunhos e moderacao. */
export function ComunidadeAdmin() {
  const { user } = useAuth()
  const { box } = useBox()

  const [aba, setAba] = useState<Aba>('feed')
  const [formAberto, setFormAberto] = useState(false)
  const [rascunhoEdicao, setRascunhoEdicao] = useState<PublicacaoFeed | null>(null)
  const [urlsRascunho, setUrlsRascunho] = useState<Record<string, string>>({})
  const [postEditando, setPostEditando] = useState<PublicacaoFeed | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [moderandoId, setModerandoId] = useState<string | null>(null)

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

  const moderar = async (post: PublicacaoFeed, ativo: boolean) => {
    if (moderandoId) return
    if (
      !window.confirm(
        ativo
          ? 'Reativar esta publicacao? Ela voltara a aparecer no feed do Box.'
          : 'Moderar esta publicacao? Ela ficara oculta para os alunos.'
      )
    )
      return

    setModerandoId(post.id)
    try {
      await moderarPublicacao(post.id, ativo)
      toast.success(ativo ? 'Publicacao reativada.' : 'Publicacao moderada.')
      recarregar()
    } catch (e) {
      toast.error(traduzirErroComunidade(e))
    } finally {
      setModerandoId(null)
    }
  }

  const acoesPost = (post: PublicacaoFeed) => (
    <>
      {post.autor_id === user.id && (
        <button
          onClick={() => setPostEditando(post)}
          className="text-text-secondary hover:text-accent p-1.5"
          title="Editar legenda"
          aria-label="Editar legenda"
        >
          <Pencil size={15} />
        </button>
      )}
      <button
        onClick={() => moderar(post, !post.ativo)}
        disabled={moderandoId === post.id}
        className="text-text-secondary hover:text-warning p-1.5 disabled:opacity-40"
        title={post.ativo ? 'Moderar publicacao' : 'Reativar publicacao'}
        aria-label={post.ativo ? 'Moderar publicacao' : 'Reativar publicacao'}
      >
        {post.ativo ? <EyeOff size={15} /> : <RotateCcw size={15} />}
      </button>
    </>
  )

  const abas: Array<{ id: Aba; label: string }> = [
    { id: 'feed', label: 'Feed' },
    { id: 'rascunhos', label: 'Rascunhos' },
    { id: 'moderadas', label: 'Moderadas' },
  ]

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-text-primary">
            Comunidade Olympea
          </h1>
          <p className="text-sm text-text-secondary">
            Feed do seu Box — publique novidades, acompanhe rascunhos e modere
            conteudos
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

      {/* Abas */}
      <div className="flex gap-2 border-b border-white/[0.06] pb-2">
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${
              aba === a.id
                ? 'bg-accent/10 text-accent'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'feed' && (
        <FeedComunidade
          papel="admin"
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
          papel="admin"
          refreshKey={refreshKey}
          onContinuar={continuarRascunho}
          onAlterado={recarregar}
        />
      )}

      {aba === 'moderadas' && (
        <FeedComunidade
          papel="admin"
          usuarioId={user.id}
          usuarioNome={user.nome}
          usuarioFoto={user.foto_url}
          filtroAtivo={false}
          refreshKey={refreshKey}
          acoesPost={acoesPost}
          vazioTitulo="Nenhuma publicacao moderada"
          vazioDescricao="Publicacoes moderadas ficam ocultas do feed e aparecem aqui."
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
