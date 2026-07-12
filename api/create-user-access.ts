import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Configuração do servidor incompleta. Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.' })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // 1. Validar token do chamador
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' })
  }

  const token = authHeader.replace('Bearer ', '')

  const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !caller) {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }

  // Verificar que o chamador é admin
  const { data: callerProfile } = await supabaseAdmin
    .from('usuarios')
    .select('role')
    .eq('email', caller.email?.toLowerCase())
    .maybeSingle()

  if (!callerProfile || callerProfile.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores podem criar acessos' })
  }

  // 2. Extrair e validar dados
  const { nome, email, role, box_id, dadosExtra } = req.body || {}

  if (!nome?.trim()) {
    return res.status(400).json({ error: 'Nome é obrigatório', etapa: 'validacao' })
  }

  if (!email?.trim()) {
    return res.status(400).json({ error: 'Email é obrigatório', etapa: 'validacao' })
  }

  if (!role || !['aluno', 'coach'].includes(role)) {
    return res.status(400).json({ error: 'Role deve ser "aluno" ou "coach"', etapa: 'validacao' })
  }

  const emailNorm = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(emailNorm)) {
    return res.status(400).json({ error: 'Formato de e-mail inválido', etapa: 'validacao' })
  }

  const appUrl = process.env.VITE_APP_URL || 'https://app.renatoimportador.com.br'

  try {
    // ============================================================
    // 3. Verificar/criar auth.user
    // ============================================================
    let authUserId: string | null = null
    let authUserJaExistia = false

    // Buscar usuário existente no Auth por email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })

    const existingAuthUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === emailNorm
    )

    if (existingAuthUser) {
      // Auth user já existe — reutilizar
      authUserId = existingAuthUser.id
      authUserJaExistia = true
    } else {
      // Auth user NÃO existe — criar via inviteUserByEmail (operação única)
      // inviteUserByEmail cria o auth user E envia o convite de uma só vez.
      // Não usar createUser + inviteUserByEmail em sequência.
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(emailNorm, {
        data: { nome, role },
        redirectTo: `${appUrl}/definir-senha`
      })

      if (inviteError) {
        return res.status(400).json({
          error: `Falha ao criar usuário e enviar convite: ${inviteError.message}`,
          etapa: 'criar_auth_e_convite'
        })
      }

      authUserId = inviteData.user.id
    }

    if (!authUserId) {
      return res.status(500).json({ error: 'Não foi possível obter auth user id', etapa: 'auth_user' })
    }

    // ============================================================
    // 4. Verificar/criar public.usuarios
    // ============================================================
    let usuarioId: string | null = null

    const { data: existingUsuario } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('email', emailNorm)
      .maybeSingle()

    if (existingUsuario) {
      usuarioId = existingUsuario.id

      // Preencher auth_id se estiver NULL
      if (!existingUsuario.auth_id) {
        const { error: updateAuthIdError } = await supabaseAdmin
          .from('usuarios')
          .update({ auth_id: authUserId })
          .eq('id', existingUsuario.id)

        if (updateAuthIdError) {
          return res.status(400).json({
            error: `Falha ao vincular auth_id ao usuario existente: ${updateAuthIdError.message}`,
            etapa: 'vincular_auth_id'
          })
        }
      }

      // Atualizar role se necessário (somente se não for admin)
      if (existingUsuario.role !== 'admin' && existingUsuario.role !== role) {
        await supabaseAdmin
          .from('usuarios')
          .update({ role })
          .eq('id', existingUsuario.id)
      }
    } else {
      const { data: newUsuario, error: createUsuarioError } = await supabaseAdmin
        .from('usuarios')
        .insert({
          auth_id: authUserId,
          nome: nome.trim(),
          email: emailNorm,
          role,
          box_id: box_id || null,
          ativo: true,
          auth_provider: 'email'
        })
        .select()
        .single()

      if (createUsuarioError) {
        // Auth user foi criado mas public.usuarios falhou.
        // Retornar erro explícito informando que o auth user existe
        // mas o registro em public.usuarios não foi criado.
        return res.status(400).json({
          error: `Falha ao criar registro em public.usuarios: ${createUsuarioError.message}. O usuário foi criado no Auth (${authUserId}) mas o registro local falhou. Tente novamente — o sistema reutilizará o auth user existente.`,
          etapa: 'criar_usuario',
          auth_id: authUserId
        })
      }

      usuarioId = newUsuario.id
    }

    if (!usuarioId) {
      return res.status(500).json({ error: 'Não foi possível obter usuario id', etapa: 'usuario' })
    }

    // ============================================================
    // 5. Criar aluno ou coach
    // ============================================================
    if (role === 'aluno') {
      // Verificar se já existe aluno vinculado
      const { data: existingAluno } = await supabaseAdmin
        .from('alunos')
        .select('id')
        .eq('usuario_id', usuarioId)
        .maybeSingle()

      if (!existingAluno) {
        const alunoData: Record<string, unknown> = {
          usuario_id: usuarioId,
          box_id: box_id || null,
          categoria: dadosExtra?.categoria || 'Beginner',
          ativo: true
        }

        if (dadosExtra?.peso_atual) alunoData.peso_atual = parseFloat(dadosExtra.peso_atual)
        if (dadosExtra?.altura) alunoData.altura = parseFloat(String(dadosExtra.altura).replace(',', '.'))
        if (dadosExtra?.data_nascimento) alunoData.data_nascimento = dadosExtra.data_nascimento

        const { error: createAlunoError } = await supabaseAdmin
          .from('alunos')
          .insert(alunoData)

        if (createAlunoError) {
          return res.status(400).json({
            error: `Usuário e auth foram criados, mas falha ao criar registro em alunos: ${createAlunoError.message}. O usuário (${usuarioId}) existe no sistema. Tente novamente para criar apenas o registro de aluno.`,
            etapa: 'criar_aluno',
            usuario_id: usuarioId,
            auth_id: authUserId
          })
        }
      }
    } else if (role === 'coach') {
      const { data: existingCoach } = await supabaseAdmin
        .from('coaches')
        .select('id')
        .eq('usuario_id', usuarioId)
        .maybeSingle()

      if (!existingCoach) {
        const coachData: Record<string, unknown> = {
          usuario_id: usuarioId,
          box_id: box_id || null,
          ativo: true
        }

        if (dadosExtra?.bio) coachData.bio = dadosExtra.bio
        if (dadosExtra?.especialidade) coachData.especialidade = dadosExtra.especialidade

        const { error: createCoachError } = await supabaseAdmin
          .from('coaches')
          .insert(coachData)

        if (createCoachError) {
          return res.status(400).json({
            error: `Usuário e auth foram criados, mas falha ao criar registro em coaches: ${createCoachError.message}. O usuário (${usuarioId}) existe no sistema. Tente novamente para criar apenas o registro de coach.`,
            etapa: 'criar_coach',
            usuario_id: usuarioId,
            auth_id: authUserId
          })
        }
      }
    }

    // ============================================================
    // 6. Resposta final
    // ============================================================
    if (authUserJaExistia) {
      return res.status(200).json({
        success: true,
        message: `${role === 'aluno' ? 'Aluno' : 'Coach'} cadastrado com sucesso. O usuário já possui acesso ao sistema — não foi enviado novo convite.`,
        usuario_id: usuarioId,
        auth_id: authUserId
      })
    }

    // Auth user foi criado agora via inviteUserByEmail — convite já foi enviado
    return res.status(200).json({
      success: true,
      message: `${role === 'aluno' ? 'Aluno' : 'Coach'} cadastrado com sucesso. Um convite foi enviado para ${emailNorm} para criação da senha.`,
      usuario_id: usuarioId,
      auth_id: authUserId
    })
  } catch (err: any) {
    return res.status(500).json({
      error: `Erro interno: ${err.message || 'desconhecido'}`,
      etapa: 'erro_geral'
    })
  }
}
