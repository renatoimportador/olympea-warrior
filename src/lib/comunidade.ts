import { supabase } from './supabase'
import type {
  ComentarioFeed,
  Curtida,
  Publicacao,
  PublicacaoFoto,
} from '@/data/types'

/* =============================================================
   Comunidade Olympea - camada de dados (Etapa 4.2)
   Regras de negocio protegidas no PostgreSQL (migration 4.1):
   - RASCUNHO -> PUBLICADA com validacao fotos <-> storage
   - moderacao (ativo) exclusiva do admin
   - imutabilidade de autor/box/texto garantida por triggers
   - storage: upload somente em rascunho proprio; path imutavel
   A interface apenas consome; nao reimplementa validacoes.
   ============================================================= */

export const COMUNIDADE_BUCKET = 'comunidade'
export const COMUNIDADE_MAX_FOTOS = 5
export const COMUNIDADE_MAX_BYTES = 2 * 1024 * 1024 // 2 MB (limite do bucket)
export const COMUNIDADE_PAGE_SIZE = 10
export const COMUNIDADE_SIGNED_URL_TTL = 3600 // 1h, prazo curto

/* ---------- Tipos enriquecidos para o feed ---------- */

export interface AutorResumo {
  nome: string | null
  foto_url: string | null
}

export interface ComentarioFeedComAutor extends ComentarioFeed {
  autor: AutorResumo | null
}

export interface PublicacaoFeed extends Publicacao {
  autor: AutorResumo | null
  fotos: PublicacaoFoto[]
  curtidas: Curtida[]
  comentarios: ComentarioFeedComAutor[]
}

/* ---------- Traducao de erros ---------- */

export function traduzirErroComunidade(erro: unknown): string {
  const msg = erro instanceof Error ? erro.message : String(erro || '')

  if (msg.includes('ARQUIVO_NAO_IMAGEM'))
    return 'O arquivo selecionado nao e uma imagem.'
  if (msg.includes('FOTO_MAIOR_QUE_2MB'))
    return 'A imagem excede 2 MB mesmo apos a compressao. Escolha outra foto.'
  if (msg.includes('PUBLICACAO_MAX_FOTOS') || msg.includes('STORAGE_MAX_FOTOS'))
    return 'Cada publicacao aceita no maximo 5 fotos.'
  if (msg.includes('PUBLICACAO_UPLOAD_INCOMPLETO'))
    return 'Ha fotos registradas sem o arquivo correspondente. Reenvie as fotos e tente publicar novamente.'
  if (msg.includes('PUBLICACAO_ARQUIVO_SEM_REGISTRO'))
    return 'Ha arquivos enviados sem registro. Remova os arquivos excedentes do rascunho.'
  if (msg.includes('PUBLICACAO_PATH_INVALIDO'))
    return 'Ha fotos com caminho invalido para esta publicacao.'
  if (msg.includes('PUBLICACAO_STATUS_INVALIDO'))
    return 'Transicao de status nao permitida.'
  if (msg.includes('PUBLICACAO_MODERACAO_ADMIN'))
    return 'Somente o administrador pode moderar publicacoes.'
  if (msg.includes('PUBLICACAO_MODERACAO_RASCUNHO'))
    return 'Rascunho nao pode ser moderado; exclua o rascunho.'
  if (msg.includes('RASCUNHO_COM_ARQUIVOS'))
    return 'Remova os arquivos do storage antes de excluir o rascunho.'
  if (msg.includes('FOTO_COM_ARQUIVO'))
    return 'Remova o arquivo do storage antes de excluir o registro da foto.'
  if (msg.includes('STORAGE_VINCULO_PUBLICADA'))
    return 'Arquivo vinculado a publicacao publicada; modere a publicacao antes de remove-lo.'
  if (msg.includes('STORAGE_PATH_IMUTAVEL'))
    return 'O caminho do arquivo nao pode ser alterado.'
  if (msg.includes('COMENTARIO_MODERACAO_ADMIN'))
    return 'Somente o administrador pode moderar comentarios.'
  if (msg.includes('COMENTARIO_') && msg.includes('IMUTAVEL'))
    return 'Este comentario nao pode ser alterado.'
  if (msg.includes('uq_curtidas_publicacao_autor'))
    return 'Voce ja curtiu esta publicacao.'
  if (msg.includes('chk_comentarios_feed_texto'))
    return 'O comentario deve ter entre 1 e 500 caracteres.'
  if (msg.includes('row-level security'))
    return 'Voce nao tem permissao para esta operacao.'

  return msg || 'Erro inesperado. Tente novamente.'
}

/* ---------- Helpers de parsing defensivo (PostgREST) ---------- */

function primeiro<T>(v: unknown): T | null {
  const r = Array.isArray(v) ? v[0] : v
  return r && typeof r === 'object' ? (r as T) : null
}

function autorDe(v: unknown): AutorResumo | null {
  const u = primeiro<{ nome?: unknown; foto_url?: unknown }>(v)
  if (!u) return null
  return {
    nome: typeof u.nome === 'string' ? u.nome : null,
    foto_url: typeof u.foto_url === 'string' ? u.foto_url : null,
  }
}

/* "ha 5 min", "ha 2 h", "ontem" ou dd/mm/aaaa (America/Sao_Paulo). */
export function tempoRelativo(iso: string): string {
  const data = new Date(iso)
  const diffMs = Date.now() - data.getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `ha ${min} min`
  const horas = Math.floor(min / 60)
  if (horas < 24) return `ha ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return 'ontem'
  if (dias < 7) return `ha ${dias} dias`
  return data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

/* ---------- Leitura do feed ---------- */

interface ListarPublicacoesParams {
  pagina: number
  status?: 'PUBLICADA' | 'RASCUNHO'
  ativo?: boolean
}

/* Leitura respeita RLS: aluno ve apenas PUBLICADA+ativa do box; coach ve
   tambem moderadas e os proprios rascunhos; admin ve todos os rascunhos
   do box. Os filtros abaixo apenas recortam o que cada tela exibe. */
export async function listarPublicacoes(
  params: ListarPublicacoesParams
): Promise<PublicacaoFeed[]> {
  const { pagina, status = 'PUBLICADA', ativo } = params
  const from = pagina * COMUNIDADE_PAGE_SIZE

  let query = supabase
    .from('publicacoes')
    .select(
      `id, box_id, autor_id, legenda, status, ativo, created_at, updated_at,
       usuarios ( nome, foto_url ),
       publicacao_fotos ( id, publicacao_id, storage_path, ordem, created_at ),
       curtidas ( id, publicacao_id, autor_id, created_at ),
       comentarios_feed (
         id, publicacao_id, autor_id, texto, ativo, created_at,
         usuarios ( nome, foto_url )
       )`
    )
    .eq('status', status)
    .order('created_at', { ascending: false })
    .order('ordem', { referencedTable: 'publicacao_fotos', ascending: true })
    .order('created_at', { referencedTable: 'comentarios_feed', ascending: true })
    .range(from, from + COMUNIDADE_PAGE_SIZE - 1)

  if (ativo !== undefined) query = query.eq('ativo', ativo)

  const { data, error } = await query
  if (error) throw error

  const linhas = (data || []) as unknown as Array<
    Publicacao & {
      usuarios?: unknown
      publicacao_fotos?: unknown
      curtidas?: unknown
      comentarios_feed?: unknown
    }
  >

  return linhas.map((l) => {
    const fotos = (Array.isArray(l.publicacao_fotos)
      ? l.publicacao_fotos
      : []) as PublicacaoFoto[]
    const curtidas = (Array.isArray(l.curtidas) ? l.curtidas : []) as Curtida[]
    const comentarios = (
      Array.isArray(l.comentarios_feed) ? l.comentarios_feed : []
    ) as Array<ComentarioFeed & { usuarios?: unknown }>

    return {
      id: l.id,
      box_id: l.box_id,
      autor_id: l.autor_id,
      legenda: l.legenda,
      status: l.status,
      ativo: l.ativo,
      created_at: l.created_at,
      updated_at: l.updated_at,
      autor: autorDe(l.usuarios),
      fotos: fotos.sort((a, b) => a.ordem - b.ordem),
      curtidas,
      comentarios: comentarios.map((c) => ({
        id: c.id,
        publicacao_id: c.publicacao_id,
        autor_id: c.autor_id,
        texto: c.texto,
        ativo: c.ativo,
        created_at: c.created_at,
        autor: autorDe(c.usuarios),
      })),
    }
  })
}

/* ---------- URLs assinadas (fotos do bucket privado) ---------- */

export async function obterUrlsAssinadas(
  paths: string[]
): Promise<Record<string, string>> {
  const unicos = Array.from(new Set(paths.filter(Boolean)))
  if (unicos.length === 0) return {}

  const { data, error } = await supabase.storage
    .from(COMUNIDADE_BUCKET)
    .createSignedUrls(unicos, COMUNIDADE_SIGNED_URL_TTL)

  if (error) throw error

  const mapa: Record<string, string> = {}
  for (const item of data || []) {
    if (item.path && item.signedUrl) mapa[item.path] = item.signedUrl
  }
  return mapa
}

/* ---------- Compressao de imagens (navegador) ---------- */

/* Redimensiona para no maximo 1920px e exporta JPEG reduzindo a qualidade
   ate ficar abaixo de 2 MB. Rejeita arquivos que nao sejam imagem. */
export async function comprimirImagem(arquivo: File): Promise<Blob> {
  if (!arquivo.type.startsWith('image/')) {
    throw new Error('ARQUIVO_NAO_IMAGEM')
  }

  const bitmap = await createImageBitmap(arquivo)
  const MAX_DIM = 1920
  const escala = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * escala))
  const h = Math.max(1, Math.round(bitmap.height * escala))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('CANVAS_INDISPONIVEL')
  }
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  for (const qualidade of [0.85, 0.75, 0.65, 0.55, 0.45, 0.35]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', qualidade)
    )
    if (blob && blob.size <= COMUNIDADE_MAX_BYTES) return blob
  }

  throw new Error('FOTO_MAIOR_QUE_2MB')
}

/* ---------- Fluxo de criacao (staff): RASCUNHO -> upload -> PUBLICADA ---------- */

/* Passo 1: cria o rascunho. O banco exige status RASCUNHO no INSERT e
   deriva/valida autor_id e box_id contra a identidade autenticada. */
export async function criarRascunho(params: {
  box_id: string
  autor_id: string
  legenda: string
}): Promise<Publicacao> {
  const { data, error } = await supabase
    .from('publicacoes')
    .insert({
      box_id: params.box_id,
      autor_id: params.autor_id,
      legenda: params.legenda,
      status: 'RASCUNHO',
    })
    .select()
    .single()

  if (error) throw error
  return data as Publicacao
}

/* Passo 2: comprime e envia UMA foto do rascunho; registra em
   publicacao_fotos. Se o registro falhar, remove o objeto enviado para
   nao deixar arquivo sem registro (bloquearia a publicacao). */
export async function enviarFotoRascunho(
  rascunho: Pick<Publicacao, 'id' | 'box_id'>,
  arquivo: File,
  ordem: number
): Promise<PublicacaoFoto> {
  const blob = await comprimirImagem(arquivo)
  const path = `${rascunho.box_id}/${rascunho.id}/foto-${ordem}-${Date.now()}.jpg`

  const { error: uploadError } = await supabase.storage
    .from(COMUNIDADE_BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg' })

  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('publicacao_fotos')
    .insert({ publicacao_id: rascunho.id, storage_path: path, ordem })
    .select()
    .single()

  if (error) {
    /* Melhor esforco: remove o objeto para nao deixar arquivo sem registro */
    await supabase.storage.from(COMUNIDADE_BUCKET).remove([path]).catch(() => {})
    throw error
  }

  return data as PublicacaoFoto
}

/* Remove UMA foto de rascunho: primeiro o objeto do storage, depois a
   linha (o trigger FOTO_COM_ARQUIVO exige essa ordem). */
export async function removerFotoRascunho(foto: PublicacaoFoto): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(COMUNIDADE_BUCKET)
    .remove([foto.storage_path])

  if (storageError) throw storageError

  const { error } = await supabase
    .from('publicacao_fotos')
    .delete()
    .eq('id', foto.id)

  if (error) throw error
}

/* Edicao de legenda: permitida ao autor (coach) e ao admin; o trigger
   protege os campos imutaveis. */
export async function atualizarLegenda(
  publicacaoId: string,
  legenda: string
): Promise<void> {
  const { error } = await supabase
    .from('publicacoes')
    .update({ legenda })
    .eq('id', publicacaoId)

  if (error) throw error
}

/* Passo final: RASCUNHO -> PUBLICADA. O trigger valida a correspondencia
   fotos <-> storage e bloqueia publicacao incompleta. */
export async function publicarPublicacao(publicacaoId: string): Promise<void> {
  const { error } = await supabase
    .from('publicacoes')
    .update({ status: 'PUBLICADA' })
    .eq('id', publicacaoId)

  if (error) throw error
}

/* Cancelamento de rascunho (ordem obrigatoria do banco):
   (1) remove TODOS os objetos do prefixo {box_id}/{publicacao_id} —
       inclusive arquivos sem registro em publicacao_fotos;
   (2) DELETE do rascunho (as fotos caem em cascata).
   Se a remocao falhar, o rascunho permanece para nova tentativa. */
export async function cancelarRascunho(
  rascunho: Pick<Publicacao, 'id' | 'box_id'>
): Promise<void> {
  const prefixo = `${rascunho.box_id}/${rascunho.id}`

  const { data: objetos, error: listError } = await supabase.storage
    .from(COMUNIDADE_BUCKET)
    .list(prefixo)

  if (listError) throw listError

  if (objetos && objetos.length > 0) {
    const paths = objetos.map((o) => `${prefixo}/${o.name}`)
    const { error: removeError } = await supabase.storage
      .from(COMUNIDADE_BUCKET)
      .remove(paths)

    if (removeError) throw removeError
  }

  const { error } = await supabase
    .from('publicacoes')
    .delete()
    .eq('id', rascunho.id)

  if (error) throw error
}

/* ---------- Moderacao (admin) ---------- */

export async function moderarPublicacao(
  publicacaoId: string,
  ativo: boolean
): Promise<void> {
  const { error } = await supabase
    .from('publicacoes')
    .update({ ativo })
    .eq('id', publicacaoId)

  if (error) throw error
}

export async function moderarComentario(
  comentarioId: string,
  ativo: boolean
): Promise<void> {
  const { error } = await supabase
    .from('comentarios_feed')
    .update({ ativo })
    .eq('id', comentarioId)

  if (error) throw error
}

/* ---------- Curtidas ---------- */

export async function curtir(
  publicacaoId: string,
  autorId: string
): Promise<Curtida> {
  const { data, error } = await supabase
    .from('curtidas')
    .insert({ publicacao_id: publicacaoId, autor_id: autorId })
    .select()
    .single()

  if (error) throw error
  return data as Curtida
}

export async function descurtir(curtidaId: string): Promise<void> {
  const { error } = await supabase
    .from('curtidas')
    .delete()
    .eq('id', curtidaId)

  if (error) throw error
}

/* ---------- Comentarios ---------- */

export async function comentar(params: {
  publicacaoId: string
  autorId: string
  texto: string
}): Promise<ComentarioFeed> {
  const { data, error } = await supabase
    .from('comentarios_feed')
    .insert({
      publicacao_id: params.publicacaoId,
      autor_id: params.autorId,
      texto: params.texto.trim(),
    })
    .select()
    .single()

  if (error) throw error
  return data as ComentarioFeed
}

/* Exclusao fisica: apenas o autor, e somente se nao moderado (RLS). */
export async function excluirComentario(comentarioId: string): Promise<void> {
  const { error } = await supabase
    .from('comentarios_feed')
    .delete()
    .eq('id', comentarioId)

  if (error) throw error
}
