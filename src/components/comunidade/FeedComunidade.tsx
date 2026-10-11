import { useCallback, useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Newspaper } from 'lucide-react'
import toast from 'react-hot-toast'
import { PostCard } from './PostCard'
import {
  listarPublicacoes,
  obterUrlsAssinadas,
  traduzirErroComunidade,
  COMUNIDADE_PAGE_SIZE,
  type PublicacaoFeed,
} from '@/lib/comunidade'
import type { UserRole } from '@/data/types'

interface FeedComunidadeProps {
  papel: UserRole
  usuarioId: string
  usuarioNome: string
  usuarioFoto?: string
  /* Filtro de moderacao: true = somente ativas; false = somente moderadas;
     omitido = todas as PUBLICADAS visiveis pela RLS. */
  filtroAtivo?: boolean
  /* Incrementar para forcar recarga do feed. */
  refreshKey?: number
  /* Acoes de staff no cabecalho de cada post. */
  acoesPost?: (post: PublicacaoFeed) => React.ReactNode
  vazioTitulo?: string
  vazioDescricao?: string
}

/* Feed compartilhado (admin / coach / aluno): leitura via RLS, paginacao
   progressiva e URLs assinadas de curto prazo para as fotos. */
export function FeedComunidade({
  papel,
  usuarioId,
  usuarioNome,
  usuarioFoto,
  filtroAtivo,
  refreshKey = 0,
  acoesPost,
  vazioTitulo = 'Nenhuma publicacao por aqui ainda',
  vazioDescricao = 'Quando o seu Box publicar novidades, elas aparecerao aqui.',
}: FeedComunidadeProps) {
  const [posts, setPosts] = useState<PublicacaoFeed[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [pagina, setPagina] = useState(0)
  const [temMais, setTemMais] = useState(false)
  const [loading, setLoading] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)

  const assinarFotos = useCallback(async (novos: PublicacaoFeed[]) => {
    const paths = novos.flatMap((p) => p.fotos.map((f) => f.storage_path))
    if (paths.length === 0) return
    try {
      const mapa = await obterUrlsAssinadas(paths)
      setUrls((prev) => ({ ...prev, ...mapa }))
    } catch (e) {
      console.error('Erro ao gerar URLs assinadas:', e)
    }
  }, [])

  const carregar = useCallback(
    async (paginaAlvo: number, acumular: boolean) => {
      if (paginaAlvo === 0) setLoading(true)
      else setCarregandoMais(true)

      try {
        const novos = await listarPublicacoes({
          pagina: paginaAlvo,
          status: 'PUBLICADA',
          ativo: filtroAtivo,
        })
        setTemMais(novos.length === COMUNIDADE_PAGE_SIZE)
        setPagina(paginaAlvo)
        setPosts((prev) => (acumular ? [...prev, ...novos] : novos))
        assinarFotos(novos)
      } catch (e) {
        console.error('Erro ao carregar feed:', e)
        toast.error(traduzirErroComunidade(e))
      } finally {
        setLoading(false)
        setCarregandoMais(false)
      }
    },
    [filtroAtivo, assinarFotos]
  )

  useEffect(() => {
    setPosts([])
    setUrls({})
    carregar(0, false)
  }, [carregar, refreshKey])

  const atualizarPost = useCallback((atualizado: PublicacaoFeed) => {
    setPosts((prev) => prev.map((p) => (p.id === atualizado.id ? atualizado : p)))
  }, [])

  if (loading) {
    return <p className="text-sm text-text-secondary">Carregando publicacoes...</p>
  }

  if (posts.length === 0) {
    return (
      <GlassCard className="p-6 text-center space-y-2">
        <Newspaper size={28} className="mx-auto text-text-secondary" />
        <p className="text-text-primary font-medium">{vazioTitulo}</p>
        <p className="text-sm text-text-secondary">{vazioDescricao}</p>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          urls={urls}
          usuarioId={usuarioId}
          usuarioNome={usuarioNome}
          usuarioFoto={usuarioFoto}
          papel={papel}
          onChange={atualizarPost}
          acoes={acoesPost ? acoesPost(post) : undefined}
        />
      ))}

      {temMais && (
        <div className="flex justify-center pt-1">
          <Button
            variant="secondary"
            size="sm"
            disabled={carregandoMais}
            onClick={() => carregar(pagina + 1, true)}
          >
            {carregandoMais ? 'Carregando...' : 'Carregar mais'}
          </Button>
        </div>
      )}
    </div>
  )
}
