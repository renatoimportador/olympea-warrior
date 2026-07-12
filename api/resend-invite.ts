import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Configuração do servidor incompleta' })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !caller) {
    return res.status(401).json({ error: 'Token inválido' })
  }

  const { data: callerProfile } = await supabaseAdmin
    .from('usuarios')
    .select('role')
    .eq('email', caller.email?.toLowerCase())
    .maybeSingle()

  if (!callerProfile || callerProfile.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores podem reenviar convites' })
  }

  const { email } = req.body || {}
  if (!email?.trim()) {
    return res.status(400).json({ error: 'Email é obrigatório' })
  }

  const emailNorm = email.trim().toLowerCase()
  const appUrl = process.env.VITE_APP_URL || 'https://app.renatoimportador.com.br'

  try {
    // Tentar enviar recuperação de senha (funciona mesmo para convite)
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: emailNorm,
      options: {
        redirectTo: `${appUrl}/definir-senha`
      }
    })

    if (error) {
      return res.status(400).json({ error: `Falha ao reenviar: ${error.message}` })
    }

    // Enviar e-mail de recuperação via fluxo padrão
    await supabaseAdmin.auth.resetPasswordForEmail(emailNorm, {
      redirectTo: `${appUrl}/definir-senha`
    })

    return res.status(200).json({
      success: true,
      message: `Convite reenviado para ${emailNorm}`
    })
  } catch (err: any) {
    return res.status(500).json({ error: `Erro interno: ${err.message}` })
  }
}
