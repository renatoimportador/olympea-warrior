import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useBox } from '@/context/BoxContext'
import { FeedComunidade } from '@/components/comunidade/FeedComunidade'
import { ComposerComunidade } from '@/components/comunidade/ComposerComunidade'
import { PublicacaoForm } from '@/components/comunidade/PublicacaoForm'
import { RascunhosList } from '@/components/comunidade/RascunhosList'
import { EditarLegendaModal } from '@/components/comunidade/EditarLegendaModal'
import type { PublicacaoFeed } from '@/lib/comunidade'

type Aba = 'feed' | 'rascunhos'

/* Comunidade Olympea — tela inicial do aluno: feed do Box com composer
   para criar publicacoes (Etapa 4.3), gestao dos proprios rascunhos e
   edicao da legenda das proprias publicacoes. Sem moderacao (admin). */
export function ComunidadeAluno() {
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

  /* O aluno so edita a legenda das PROPRIAS publicacoes. */
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
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto p-4 md:p-6">
      {/* Composer estilo rede social */}
      <ComposerComunidade
        nome={user.nome}
        fotoUrl={user.foto_url}
        onNovaPublicacao={abrirNovaPublicacao}
        disabled={formAberto}
      />

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
          papel="aluno"
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
          papel="aluno"
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
