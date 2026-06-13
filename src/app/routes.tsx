import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { CoachLayout } from '@/components/layout/CoachLayout'
import { AlunoLayout } from '@/components/layout/AlunoLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'

/* Pages */
import { LandingPage } from '@/pages/LandingPage'
import { Login } from '@/pages/auth/Login'
import { RecuperarSenha } from '@/pages/auth/RecuperarSenha'

import { DashboardAdmin } from '@/pages/admin/DashboardAdmin'
import { GerenciarUsuarios } from '@/pages/admin/GerenciarUsuarios'
import { GerenciarCoaches } from '@/pages/admin/GerenciarCoaches'
import { GerenciarAlunos } from '@/pages/admin/GerenciarAlunos'
import { CriarProgramacao } from '@/pages/admin/CriarProgramacao'
import { CriarFase } from '@/pages/admin/CriarFase'
import { CriarSemana } from '@/pages/admin/CriarSemana'
import { CriarTreino } from '@/pages/admin/CriarTreino'
import { GerenciarWODs } from '@/pages/admin/GerenciarWODs'
import { GerenciarNiveis } from '@/pages/admin/GerenciarNiveis'
import { BibliotecaExercicios } from '@/pages/admin/BibliotecaExercicios'
import { RankingsAdmin } from '@/pages/admin/RankingsAdmin'
import { RelatoriosAdmin } from '@/pages/admin/RelatoriosAdmin'
import { Configuracoes } from '@/pages/admin/Configuracoes'
import { ConfigurarBox } from '@/pages/admin/ConfigurarBox'
import { Auditoria } from '@/pages/admin/Auditoria'

import { DashboardCoach } from '@/pages/coach/DashboardCoach'
import { AlunosVinculados } from '@/pages/coach/AlunosVinculados'
import { AcompanharEvolucao } from '@/pages/coach/AcompanharEvolucao'
import { CorrigirResultados } from '@/pages/coach/CorrigirResultados'
import { ComentariosCoach } from '@/pages/coach/ComentariosCoach'
import { FrequenciaAlunos } from '@/pages/coach/FrequenciaAlunos'
import { RankingsCoach } from '@/pages/coach/RankingsCoach'
import { RelatoriosCoach } from '@/pages/coach/RelatoriosCoach'

import { DashboardAluno } from '@/pages/aluno/DashboardAluno'
import { SeletorProgramacao } from '@/pages/aluno/SeletorProgramacao'
import { Programacao } from '@/pages/aluno/Programacao'
import { TreinoDoDia } from '@/pages/aluno/TreinoDoDia'
import { RegistrarResultado } from '@/pages/aluno/RegistrarResultado'
import { Historico } from '@/pages/aluno/Historico'
import { MeusPRs } from '@/pages/aluno/MeusPRs'
import { MinhaFrequencia } from '@/pages/aluno/MinhaFrequencia'
import { MinhaEvolucao } from '@/pages/aluno/MinhaEvolucao'
import { RankingsAluno } from '@/pages/aluno/RankingsAluno'
import { MeuPerfil } from '@/pages/aluno/MeuPerfil'
import { ComentariosAluno } from '@/pages/aluno/ComentariosAluno'
import { CheckIn } from '@/pages/aluno/CheckIn'

import { BibliotecaMovimentos } from '@/pages/shared/BibliotecaMovimentos'
import { DetalheMovimento } from '@/pages/shared/DetalheMovimento'
import { Notificacoes } from '@/pages/shared/Notificacoes'
import { Perfil } from '@/pages/shared/Perfil'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
      </Route>

      <Route
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<DashboardAdmin />} />
        <Route path="/admin/usuarios" element={<GerenciarUsuarios />} />
        <Route path="/admin/coaches" element={<GerenciarCoaches />} />
        <Route path="/admin/alunos" element={<GerenciarAlunos />} />
        <Route path="/admin/programacao" element={<CriarProgramacao />} />
        <Route path="/admin/fases" element={<CriarFase />} />
        <Route path="/admin/semanas" element={<CriarSemana />} />
        <Route path="/admin/treinos" element={<CriarTreino />} />
        <Route path="/admin/wods" element={<GerenciarWODs />} />
        <Route path="/admin/niveis" element={<GerenciarNiveis />} />
        <Route path="/admin/biblioteca" element={<BibliotecaExercicios />} />
        <Route path="/admin/rankings" element={<RankingsAdmin />} />
        <Route path="/admin/relatorios" element={<RelatoriosAdmin />} />
        <Route path="/admin/configuracoes" element={<Configuracoes />} />
        <Route path="/admin/box" element={<ConfigurarBox />} />
        <Route path="/admin/auditoria" element={<Auditoria />} />
      </Route>

      <Route
        element={
          <ProtectedRoute roles={['coach']}>
            <CoachLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/coach/dashboard" element={<DashboardCoach />} />
        <Route path="/coach/alunos" element={<AlunosVinculados />} />
        <Route path="/coach/evolucao" element={<AcompanharEvolucao />} />
        <Route path="/coach/resultados" element={<CorrigirResultados />} />
        <Route path="/coach/comentarios" element={<ComentariosCoach />} />
        <Route path="/coach/frequencia" element={<FrequenciaAlunos />} />
        <Route path="/coach/rankings" element={<RankingsCoach />} />
        <Route path="/coach/relatorios" element={<RelatoriosCoach />} />
      </Route>

      <Route
        element={
          <ProtectedRoute roles={['aluno']}>
            <AlunoLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/aluno/dashboard" element={<DashboardAluno />} />
        <Route path="/aluno/seletor-programacao" element={<SeletorProgramacao />} />
        <Route path="/aluno/programacao" element={<Programacao />} />
        <Route path="/aluno/treino" element={<TreinoDoDia />} />
        <Route path="/aluno/resultado" element={<RegistrarResultado />} />
        <Route path="/aluno/historico" element={<Historico />} />
        <Route path="/aluno/prs" element={<MeusPRs />} />
        <Route path="/aluno/frequencia" element={<MinhaFrequencia />} />
        <Route path="/aluno/evolucao" element={<MinhaEvolucao />} />
        <Route path="/aluno/rankings" element={<RankingsAluno />} />
        <Route path="/aluno/perfil" element={<MeuPerfil />} />
        <Route path="/aluno/comentarios" element={<ComentariosAluno />} />
        <Route path="/aluno/checkin" element={<CheckIn />} />
      </Route>

      <Route element={<AlunoLayout />}>
        <Route path="/biblioteca" element={<BibliotecaMovimentos />} />
        <Route path="/movimento/:slug" element={<DetalheMovimento />} />
        <Route path="/notificacoes" element={<Notificacoes />} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>
    </Routes>
  )
}
