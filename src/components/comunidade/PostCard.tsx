import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import {
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Heart,
  MessageCircle,
  RotateCcw,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  comentar,
  descurtir,
  curtir,
  excluirComentario,
  moderarComentario,
  tempoRelativo,
  traduzirErroComunidade,
  type ComentarioFeedComAutor,
  type PublicacaoFeed,
} from '@/lib/comunidade'
import type { UserRole } from '@/data/types'

/* Avatar circular com foto ou inicial do nome. */
function Avatar({ nome, fotoUrl, size = 36 }: { nome: string | null; fotoUrl?: string | null; size?: number }) {
  const [erro, setErro] = useState(false)
  const inicial = (nome || '?').trim().charAt(0).toUpperCase()

  if (fotoUrl && !erro) {
    return (
      <img
        src={fotoUrl}
        alt={nome || 'Autor'}
        onError={() => setErro(true)}
        className="rounded-full object-cover flex-shrink-0 border border-white/10"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {inicial}
    </div>
  )
}

/* Galeria de fotos com lightbox simples. */
function Galeria({ post, urls }: { post: PublicacaoFeed; urls: Record<string, string> }) {
  const [aberta, setAberta] = useState<number | null>(null)
  const fotos = post.fotos
  if (fotos.length === 0) return null

  const classeGrid =
    fotos.length === 1
      ? 'grid-cols-1'
      : 'grid-cols-2'

  return (
    <>
      <div className={`grid ${classeGrid} gap-1.5 rounded-xl overflow-hidden`}>
        {fotos.map((foto, i) => {
          const url = urls[foto.storage_path]
          const primeiraDeTres = fotos.length === 3 && i === 0
          const quinta = fotos.length === 5 && i === 0
          return (
            <button
              key={foto.id}
              onClick={() => setAberta(i)}
              className={`relative bg-white/[0.02] overflow-hidden ${
                primeiraDeTres || quinta ? 'col-span-2' : ''
              } ${fotos.length === 1 ? 'aspect-[4/3]' : 'aspect-square'}`}
            >
              {url ? (
                <img
                  src={url}
                  alt={`Foto ${i + 1} da publicacao`}
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-text-secondary">
                  Carregando...
                </div>
              )}
            </button>
          )
        })}
      </div>

      {aberta !== null && urls[fotos[aberta]?.storage_path] && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setAberta(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            onClick={() => setAberta(null)}
            aria-label="Fechar"
          >
            <X size={24} />
          </button>

          {aberta > 0 && (
            <button
              className="absolute left-2 md:left-6 text-white/70 hover:text-white p-2"
              onClick={(e) => {
                e.stopPropagation()
                setAberta(aberta - 1)
              }}
              aria-label="Foto anterior"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          <img
            src={urls[fotos[aberta].storage_path]}
            alt={`Foto ${aberta + 1} da publicacao`}
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {aberta < fotos.length - 1 && (
            <button
              className="absolute right-2 md:right-6 text-white/70 hover:text-white p-2"
              onClick={(e) => {
                e.stopPropagation()
                setAberta(aberta + 1)
              }}
              aria-label="Proxima foto"
            >
              <ChevronRight size={32} />
            </button>
          )}

          <span className="absolute bottom-4 text-xs text-white/60">
            {aberta + 1} / {fotos.length}
          </span>
        </div>
      )}
    </>
  )
}

/* Secao de comentarios de uma publicacao. */
function Comentarios({
  post,
  usuarioId,
  usuarioNome,
  usuarioFoto,
  papel,
  onChange,
}: {
  post: PublicacaoFeed
  usuarioId: string
  usuarioNome: string
  usuarioFoto?: string
  papel: UserRole
  onChange: (post: PublicacaoFeed) => void
}) {
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [pendenteId, setPendenteId] = useState<string | null>(null)

  const enviar = async () => {
    const limpo = texto.trim()
    if (!limpo || enviando) return
    setEnviando(true)
    try {
      const novo = await comentar({
        publicacaoId: post.id,
        autorId: usuarioId,
        texto: limpo,
      })
      const comAutor: ComentarioFeedComAutor = {
        ...novo,
        autor: { nome: usuarioNome, foto_url: usuarioFoto ?? null },
      }
      onChange({ ...post, comentarios: [...post.comentarios, comAutor] })
      setTexto('')
    } catch (e) {
      toast.error(traduzirErroComunidade(e))
    } finally {
      setEnviando(false)
    }
  }

  const excluir = async (comentarioId: string) => {
    if (pendenteId) return
    if (!window.confirm('Excluir este comentario?')) return
    setPendenteId(comentarioId)
    try {
      await excluirComentario(comentarioId)
      onChange({
        ...post,
        comentarios: post.comentarios.filter((c) => c.id !== comentarioId),
      })
      toast.success('Comentario excluido.')
    } catch (e) {
      toast.error(traduzirErroComunidade(e))
    } finally {
      setPendenteId(null)
    }
  }

  const moderar = async (c: ComentarioFeedComAutor, ativo: boolean) => {
    if (pendenteId) return
    if (
      !window.confirm(
        ativo
          ? 'Reativar este comentario? Ele voltara a aparecer no feed.'
          : 'Moderar este comentario? Ele ficara oculto para os alunos.'
      )
    )
      return
    setPendenteId(c.id)
    try {
      await moderarComentario(c.id, ativo)
      onChange({
        ...post,
        comentarios: post.comentarios.map((x) =>
          x.id === c.id ? { ...x, ativo } : x
        ),
      })
      toast.success(ativo ? 'Comentario reativado.' : 'Comentario moderado.')
    } catch (e) {
      toast.error(traduzirErroComunidade(e))
    } finally {
      setPendenteId(null)
    }
  }

  const visiveis = post.comentarios.filter(
    (c) => c.ativo || papel === 'admin' || papel === 'coach'
  )

  return (
    <div className="space-y-3 border-t border-white/[0.06] pt-3">
      {visiveis.length === 0 && (
        <p className="text-xs text-text-secondary">
          Nenhum comentario ainda. Seja o primeiro!
        </p>
      )}

      {visiveis.map((c) => (
        <div key={c.id} className="flex items-start gap-2.5">
          <Avatar nome={c.autor?.nome ?? null} fotoUrl={c.autor?.foto_url} size={28} />
          <div className="flex-1 min-w-0">
            <div
              className={`rounded-xl px-3 py-2 ${
                c.ativo ? 'bg-white/[0.03]' : 'bg-white/[0.01] opacity-60'
              }`}
            >
              <p className="text-xs font-semibold text-text-primary">
                {c.autor?.nome || 'Usuario'}
                <span className="ml-2 font-normal text-text-secondary">
                  {tempoRelativo(c.created_at)}
                </span>
                {!c.ativo && (
                  <Badge variant="warning" className="ml-2">
                    moderado
                  </Badge>
                )}
              </p>
              <p className="text-sm text-text-primary whitespace-pre-wrap break-words">
                {c.texto}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {c.ativo && c.autor_id === usuarioId && (
              <button
                onClick={() => excluir(c.id)}
                disabled={pendenteId === c.id}
                className="text-text-secondary hover:text-error p-1 disabled:opacity-40"
                aria-label="Excluir comentario"
                title="Excluir meu comentario"
              >
                <Trash2 size={14} />
              </button>
            )}
            {papel === 'admin' && (
              <button
                onClick={() => moderar(c, !c.ativo)}
                disabled={pendenteId === c.id}
                className="text-text-secondary hover:text-warning p-1 disabled:opacity-40"
                aria-label={c.ativo ? 'Moderar comentario' : 'Reativar comentario'}
                title={c.ativo ? 'Moderar comentario' : 'Reativar comentario'}
              >
                {c.ativo ? <EyeOff size={14} /> : <RotateCcw size={14} />}
              </button>
            )}
          </div>
        </div>
      ))}

      <div className="flex items-end gap-2">
        <Avatar nome={usuarioNome} fotoUrl={usuarioFoto} size={28} />
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={500}
          rows={1}
          placeholder="Escreva um comentario..."
          className="glass-input flex-1 resize-none text-sm min-h-[38px]"
        />
        <button
          onClick={enviar}
          disabled={enviando || !texto.trim()}
          className="p-2 rounded-xl bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Enviar comentario"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

interface PostCardProps {
  post: PublicacaoFeed
  urls: Record<string, string>
  usuarioId: string
  usuarioNome: string
  usuarioFoto?: string
  papel: UserRole
  onChange: (post: PublicacaoFeed) => void
  /* Acoes de staff exibidas no cabecalho (editar legenda, moderar...). */
  acoes?: React.ReactNode
}

export function PostCard({
  post,
  urls,
  usuarioId,
  usuarioNome,
  usuarioFoto,
  papel,
  onChange,
  acoes,
}: PostCardProps) {
  const [comentariosAbertos, setComentariosAbertos] = useState(false)
  const [curtindo, setCurtindo] = useState(false)

  const minhaCurtida = post.curtidas.find((c) => c.autor_id === usuarioId)

  const alternarCurtida = async () => {
    if (curtindo) return
    setCurtindo(true)
    try {
      if (minhaCurtida) {
        await descurtir(minhaCurtida.id)
        onChange({
          ...post,
          curtidas: post.curtidas.filter((c) => c.id !== minhaCurtida.id),
        })
      } else {
        const nova = await curtir(post.id, usuarioId)
        onChange({ ...post, curtidas: [...post.curtidas, nova] })
      }
    } catch (e) {
      toast.error(traduzirErroComunidade(e))
    } finally {
      setCurtindo(false)
    }
  }

  return (
    <GlassCard className={`p-4 space-y-3 ${!post.ativo ? 'opacity-70' : ''}`}>
      {/* Cabecalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar nome={post.autor?.nome ?? null} fotoUrl={post.autor?.foto_url} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {post.autor?.nome || 'Usuario'}
            </p>
            <p className="text-xs text-text-secondary">
              {tempoRelativo(post.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {post.status === 'RASCUNHO' && <Badge variant="warning">Rascunho</Badge>}
          {!post.ativo && <Badge variant="error">Moderada</Badge>}
          {acoes}
        </div>
      </div>

      {/* Legenda */}
      {post.legenda && (
        <p className="text-sm text-text-primary whitespace-pre-wrap break-words">
          {post.legenda}
        </p>
      )}

      {/* Fotos */}
      <Galeria post={post} urls={urls} />

      {/* Curtidas / comentarios */}
      <div className="flex items-center gap-4 border-t border-white/[0.06] pt-3">
        <button
          onClick={alternarCurtida}
          disabled={curtindo || post.status !== 'PUBLICADA' || !post.ativo}
          className={`flex items-center gap-1.5 text-sm transition disabled:opacity-40 ${
            minhaCurtida ? 'text-error' : 'text-text-secondary hover:text-error'
          }`}
          aria-label={minhaCurtida ? 'Descurtir' : 'Curtir'}
        >
          <Heart size={18} fill={minhaCurtida ? 'currentColor' : 'none'} />
          <span>{post.curtidas.length}</span>
        </button>

        <button
          onClick={() => setComentariosAbertos(!comentariosAbertos)}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition"
          aria-label="Comentarios"
        >
          <MessageCircle size={18} />
          <span>{post.comentarios.filter((c) => c.ativo).length}</span>
        </button>
      </div>

      {comentariosAbertos && (
        <Comentarios
          post={post}
          usuarioId={usuarioId}
          usuarioNome={usuarioNome}
          usuarioFoto={usuarioFoto}
          papel={papel}
          onChange={onChange}
        />
      )}
    </GlassCard>
  )
}
