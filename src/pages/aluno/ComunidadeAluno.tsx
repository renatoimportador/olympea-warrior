import { useAuth } from '@/context/AuthContext'
import { FeedComunidade } from '@/components/comunidade/FeedComunidade'

/* Comunidade Olympea — visao do aluno: feed do Box com fotos, legendas,
   curtidas e comentarios. Sem criacao de publicacoes e sem rascunhos
   ou conteudos moderados (garantido pela RLS). */
export function ComunidadeAluno() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-primary">
          Comunidade Olympea
        </h1>
        <p className="text-sm text-text-secondary">
          Novidades do seu Box — curta e comente as publicacoes
        </p>
      </div>

      <FeedComunidade
        papel="aluno"
        usuarioId={user.id}
        usuarioNome={user.nome}
        usuarioFoto={user.foto_url}
        filtroAtivo={true}
      />
    </div>
  )
}
