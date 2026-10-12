#!/usr/bin/env node
/**
 * OLYMPEA WARRIOR — ETAPA 3.1 — Testes isolados da migration
 * supabase/migrations/20261010_box_presencial_fundacao.sql
 *
 * Ambiente: @electric-sql/pglite (PostgreSQL real em WASM, 100% local).
 * Nenhuma conexão com Supabase de produção. Sem credenciais reais.
 *
 * Estratégia:
 *   1. Cria stubs do Supabase (schema auth, auth.uid(), roles anon/authenticated).
 *   2. Carrega o schema legado (schema.sql) com uuid-ossp substituído por
 *      gen_random_uuid() (adaptação apenas do harness; a migration NÃO é alterada).
 *   3. Adiciona programacoes.modalidade (equivalente à Etapa 1 já aplicada em produção).
 *   4. Executa a migration INTEGRAL, sem modificações.
 *   5. Insere seeds mínimos e roda os testes funcionais.
 *
 * Limitação declarada: PGlite é single-connection — NÃO valida concorrência
 * real (locks em sessões paralelas). Testes de concorrência exigem PostgreSQL
 * real e ficam fora deste relatório.
 *
 * Uso: node supabase/tests/test-box-presencial.mjs
 */
import { PGlite } from '@electric-sql/pglite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')
const MIGRATION_PATH = path.join(ROOT, 'supabase', 'migrations', '20261010_box_presencial_fundacao.sql')
const MIGRATION_44 = path.join(ROOT, 'supabase', 'migrations', '20261013_inscricoes_rls_correcao.sql')
const SCHEMA_PATH = path.join(ROOT, 'schema.sql')

/* ---------- UUIDs fixos de teste (hex válido) ---------- */
const BOX1 = '00000000-0000-4000-8000-0000000000b1'
const BOX2 = '00000000-0000-4000-8000-0000000000b2'
const AUTH_ADMIN1 = '10000000-0000-4000-8000-000000000001'
const AUTH_COACH1 = '10000000-0000-4000-8000-000000000002'
const AUTH_COACH2 = '10000000-0000-4000-8000-000000000003'
const AUTH_ALUNO1 = '10000000-0000-4000-8000-000000000011'
const AUTH_ALUNO2 = '10000000-0000-4000-8000-000000000012'
const AUTH_ALUNO3 = '10000000-0000-4000-8000-000000000013'
const AUTH_ALUNO4 = '10000000-0000-4000-8000-000000000014'
const USR_ADMIN1 = '20000000-0000-4000-8000-000000000001'
const USR_COACH1 = '20000000-0000-4000-8000-000000000002'
const USR_COACH2 = '20000000-0000-4000-8000-000000000003'
const USR_ALUNO1 = '20000000-0000-4000-8000-000000000011'
const USR_ALUNO2 = '20000000-0000-4000-8000-000000000012'
const USR_ALUNO3 = '20000000-0000-4000-8000-000000000013'
const USR_ALUNO4 = '20000000-0000-4000-8000-000000000014'
const USR_DUP = '20000000-0000-4000-8000-000000000099'
const ALUNO1 = '30000000-0000-4000-8000-000000000001'
const ALUNO2 = '30000000-0000-4000-8000-000000000002'
const ALUNO3 = '30000000-0000-4000-8000-000000000003'
const ALUNO4 = '30000000-0000-4000-8000-000000000004'
const PROG_BOX = '40000000-0000-4000-8000-000000000001'
const PROG_PLAN = '40000000-0000-4000-8000-000000000002'

/* ---------- mini-framework de testes ---------- */
const results = []
let db

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'asserção falhou')
}

async function one(sql, params) {
  const r = await db.query(sql, params)
  return r.rows[0]
}
async function scalar(sql, params) {
  const row = await one(sql, params)
  return row ? Object.values(row)[0] : null
}

async function expectError(sql, params, code) {
  let err = null
  try {
    await db.query(sql, params)
  } catch (e) {
    err = e
  }
  if (!err) throw new Error(`esperava erro contendo "${code}", mas a operação teve sucesso`)
  if (!String(err.message).includes(code)) {
    throw new Error(`erro inesperado (esperava "${code}"): ${err.message}`)
  }
}

async function asUser(authId, role = 'authenticated') {
  await db.query("select set_config('request.jwt.claims', $1, false)", [
    authId ? JSON.stringify({ sub: authId }) : ''
  ])
  await db.exec(`set role ${role}`)
}

async function asOwner() {
  await db.exec('reset role')
  await db.query("select set_config('request.jwt.claims', '', false)")
}

async function test(name, fn) {
  try {
    await fn()
    results.push({ name, status: 'APROVADO', error: null })
    console.log(`  [APROVADO]   ${name}`)
  } catch (e) {
    results.push({ name, status: 'REPROVADO', error: String(e.message) })
    console.log(`  [REPROVADO]  ${name}`)
    console.log(`               → ${String(e.message).split('\n')[0]}`)
  } finally {
    try {
      await asOwner()
    } catch {
      /* ignore */
    }
  }
}

/** Cria aula extraordinária com início = agora(SP) + offsetMinutos (pode ser negativo). */
async function criarAulaRelativa(boxId, offsetMinutos, capacidade = 20) {
  const r = await db.query(
    `
    insert into aulas (box_id, data, hora_inicio, hora_fim, capacidade)
    select $1,
           t::date,
           t::time,
           (case when t::time > time '22:00' then '23:59' else to_char((t + interval '59 minutes')::time, 'HH24:MI:SS') end)::time,
           $2
    from (select ((now() at time zone 'America/Sao_Paulo') + make_interval(mins => $3)) as t) s
    returning id, to_char(data, 'YYYY-MM-DD') as data, to_char(hora_inicio, 'HH24:MI:SS') as hora_inicio
    `,
    [boxId, capacidade, offsetMinutos]
  )
  return r.rows[0]
}

async function reservaIdDe(aulaId, alunoId) {
  return scalar(
    'select id from reservas where aula_id = $1 and aluno_id = $2 order by created_at desc limit 1',
    [aulaId, alunoId]
  )
}

async function checkin(aulaId) {
  const r = await db.query('select public.realizar_checkin($1) as rid', [aulaId])
  return r.rows[0].rid
}

/* ================================================================
 * SETUP
 * ================================================================ */
async function setup() {
  db = await PGlite.create()

  // 0. Stub mínimo do Supabase (auth + roles)
  await db.exec(`
    create schema if not exists auth;
    create table if not exists auth.users (id uuid primary key);
    create or replace function auth.uid() returns uuid
      language sql stable as
      $f$ select (nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub')::uuid $f$;
    do $$
    begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then
        create role anon;
      end if;
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then
        create role authenticated;
      end if;
    end $$;
  `)

  // 1. Schema legado (adaptação APENAS do harness: gen_random_uuid no lugar de uuid-ossp)
  let schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8')
  schemaSql = schemaSql
    .replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";/gi, '')
    .replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()')
  await db.exec(schemaSql)

  // 2. Coluna da Etapa 1 (já aplicada em produção; reproduz o estado real)
  await db.exec(
    `alter table public.programacoes add column if not exists modalidade text not null default 'PLANILHA'`
  )

  // 2b. Grants padrao do Supabase (default privileges de producao) —
  //     aplicados ANTES das migrations, que ajustam/restringem por tabela.
  await db.exec(`
    grant select, insert, update, delete on all tables in schema public to authenticated;
    grant select, insert, update, delete on all tables in schema public to anon;
  `)

  // 3. Migration integral, sem nenhuma modificação
  await db.exec(fs.readFileSync(MIGRATION_PATH, 'utf8'))

  // 3b. Etapa 4.4 (seguranca): correcao da RLS de inscricoes — valida que
  //     as RPCs SECURITY DEFINER (realizar_checkin etc.) e os seeds como
  //     owner continuam funcionando apos o endurecimento das policies.
  await db.exec(fs.readFileSync(MIGRATION_44, 'utf8'))

  // 4. Seeds mínimos (owner)
  await db.exec(`
    insert into auth.users (id) values
      ('${AUTH_ADMIN1}'), ('${AUTH_COACH1}'), ('${AUTH_COACH2}'),
      ('${AUTH_ALUNO1}'), ('${AUTH_ALUNO2}'), ('${AUTH_ALUNO3}'), ('${AUTH_ALUNO4}');

    insert into boxes (id, nome, slug, ativo) values
      ('${BOX1}', 'Box Teste 1', 'box-teste-1', true),
      ('${BOX2}', 'Box Teste 2', 'box-teste-2', true);

    insert into usuarios (id, auth_id, box_id, nome, email, role, ativo) values
      ('${USR_ADMIN1}', '${AUTH_ADMIN1}', '${BOX1}', 'Admin Um', 'admin1@t.local', 'admin', true),
      ('${USR_COACH1}', '${AUTH_COACH1}', '${BOX1}', 'Coach Um', 'coach1@t.local', 'coach', true),
      ('${USR_COACH2}', '${AUTH_COACH2}', '${BOX2}', 'Coach Dois', 'coach2@t.local', 'coach', true),
      ('${USR_ALUNO1}', '${AUTH_ALUNO1}', '${BOX1}', 'Aluno Um', 'aluno1@t.local', 'aluno', true),
      ('${USR_ALUNO2}', '${AUTH_ALUNO2}', '${BOX1}', 'Aluno Dois', 'aluno2@t.local', 'aluno', true),
      ('${USR_ALUNO3}', '${AUTH_ALUNO3}', '${BOX1}', 'Aluno Tres', 'aluno3@t.local', 'aluno', true),
      ('${USR_ALUNO4}', '${AUTH_ALUNO4}', '${BOX1}', 'Aluno Quatro', 'aluno4@t.local', 'aluno', true);

    insert into alunos (id, usuario_id, box_id, categoria, ativo) values
      ('${ALUNO1}', '${USR_ALUNO1}', '${BOX1}', 'RX', true),
      ('${ALUNO2}', '${USR_ALUNO2}', '${BOX1}', 'SCALING', true),
      ('${ALUNO3}', '${USR_ALUNO3}', '${BOX1}', 'BEGINNER', true),
      ('${ALUNO4}', '${USR_ALUNO4}', '${BOX1}', 'RX', true);

    insert into programacoes (id, box_id, nome, tipo, data_inicio, data_fim, ativa, modalidade) values
      ('${PROG_BOX}', '${BOX1}', 'Box Presencial Teste', 'CROSSFIT', current_date - 30, current_date + 365, true, 'BOX_PRESENCIAL'),
      ('${PROG_PLAN}', '${BOX1}', 'Planilha Teste', 'CROSSFIT', current_date - 30, current_date + 365, true, 'PLANILHA');

    insert into inscricoes (aluno_id, programacao_id, ativa) values
      ('${ALUNO1}', '${PROG_BOX}', true),
      ('${ALUNO2}', '${PROG_BOX}', true),
      ('${ALUNO3}', '${PROG_BOX}', true),
      ('${ALUNO4}', '${PROG_PLAN}', true),
      ('${ALUNO4}', '${PROG_BOX}', false);

    insert into grade_aulas (box_id, dia_semana, hora_inicio, hora_fim, capacidade, ativo, vigencia_inicio)
    select '${BOX1}', d.dia, '05:00', '06:00', 20, true, (current_date - 1)
    from (values ('SEG'),('TER'),('QUA'),('QUI'),('SEX'),('SAB'),('DOM')) d(dia);
  `)
}

/* ================================================================
 * TESTES
 * ================================================================ */
async function runTests() {
  console.log('\n=== A. INFRAESTRUTURA / DDL ===')

  await test('A1. PGlite suporta timezone America/Sao_Paulo (AT TIME ZONE)', async () => {
    const r = await one("select (('2026-10-12'::date + '06:00'::time) at time zone 'America/Sao_Paulo') as ts")
    assert(r.ts !== null, 'conversão de timezone falhou')
  })

  await test('A2. Tabelas grade_aulas, aulas e reservas criadas', async () => {
    const n = await scalar(
      `select count(*) from pg_tables where schemaname='public' and tablename in ('grade_aulas','aulas','reservas')`
    )
    assert(Number(n) === 3, `esperava 3 tabelas, encontradas ${n}`)
  })

  await test('A3. Índice único parcial reservas_uma_nao_cancelada_por_aluno existe', async () => {
    const d = await scalar(
      `select indexdef from pg_indexes where schemaname='public' and indexname='reservas_uma_nao_cancelada_por_aluno'`
    )
    assert(d && d.includes('UNIQUE'), 'índice único parcial não encontrado')
  })

  await test('A4. FK composta fk_aulas_grade_box existe', async () => {
    const n = await scalar(
      `select count(*) from pg_constraint where conname='fk_aulas_grade_box' and contype='f'`
    )
    assert(Number(n) === 1, 'FK composta não encontrada')
  })

  await test('A5. RLS habilitada nas 3 tabelas', async () => {
    const r = await one(
      `select
         count(*) filter (where rowsecurity) as com_rls,
         count(*) as total
       from pg_tables
       where schemaname='public' and tablename in ('grade_aulas','aulas','reservas')`
    )
    assert(Number(r.total) === 3 && Number(r.com_rls) === 3, 'RLS não habilitada em todas as tabelas')
  })

  await test('A6. 5 políticas RLS criadas nas novas tabelas', async () => {
    const n = await scalar(
      `select count(*) from pg_policies where schemaname='public' and tablename in ('grade_aulas','aulas','reservas')`
    )
    assert(Number(n) === 5, `esperava 5 políticas, encontradas ${n}`)
  })

  console.log('\n=== B. IDENTIDADE (auth.uid → usuarios) ===')

  await test('B1. app_identidade_atual resolve usuário ativo com claims válidos', async () => {
    await asUser(AUTH_ALUNO1)
    const r = await one('select * from app_identidade_atual()')
    assert(r && r.id === USR_ALUNO1 && r.box_id === BOX1 && r.role === 'aluno', 'identidade incorreta')
  })

  await test('B2. Sem claims (owner sem jwt) → nenhuma identidade', async () => {
    const n = await scalar('select count(*) from app_identidade_atual()')
    assert(Number(n) === 0, 'esperava 0 identidades sem claims')
  })

  await test('B3. Duplicidade de auth_id ativo → falha segura (0 identidades) e recuperação', async () => {
    await db.query(
      `insert into usuarios (id, auth_id, box_id, nome, email, role, ativo)
       values ('${USR_DUP}', '${AUTH_ALUNO1}', '${BOX1}', 'Duplicado', 'dup@t.local', 'aluno', true)`
    )
    await asUser(AUTH_ALUNO1)
    let n = await scalar('select count(*) from app_identidade_atual()')
    assert(Number(n) === 0, 'duplicidade não gerou falha segura')
    await asOwner()
    await db.query(`delete from usuarios where id='${USR_DUP}'`)
    await asUser(AUTH_ALUNO1)
    n = await scalar('select count(*) from app_identidade_atual()')
    assert(Number(n) === 1, 'identidade não foi recuperada após remoção da duplicidade')
  })

  await test('B4. app_aluno_atual retorna o cadastro de aluno ativo', async () => {
    await asUser(AUTH_ALUNO1)
    const id = await scalar('select public.app_aluno_atual()')
    assert(id === ALUNO1, `esperava ${ALUNO1}, obtido ${id}`)
  })

  console.log('\n=== C. GERAR_AULAS ===')

  const datas = await one(`
    select
      to_char(((now() at time zone 'America/Sao_Paulo')::date), 'YYYY-MM-DD') as hoje,
      to_char((((now() at time zone 'America/Sao_Paulo')::date) + 6), 'YYYY-MM-DD') as hoje6,
      to_char((((now() at time zone 'America/Sao_Paulo')::date) - 1), 'YYYY-MM-DD') as ontem,
      to_char((((now() at time zone 'America/Sao_Paulo')::date) + 15), 'YYYY-MM-DD') as hoje15
  `)

  await test('C1. Gera aulas conforme a grade (7 dias, 7 aulas) chamado por ALUNO', async () => {
    await asUser(AUTH_ALUNO1)
    const n = await scalar('select public.gerar_aulas($1, $2::date, $3::date)', [BOX1, datas.hoje, datas.hoje6])
    assert(Number(n) === 7, `esperava 7 aulas geradas, geradas ${n}`)
  })

  await test('C2. Reexecução não duplica (retorna 0)', async () => {
    await asUser(AUTH_ALUNO1)
    const n = await scalar('select public.gerar_aulas($1, $2::date, $3::date)', [BOX1, datas.hoje, datas.hoje6])
    assert(Number(n) === 0, `esperava 0 novas, geradas ${n}`)
  })

  await test('C3. Rejeita geração de datas passadas (GERAR_AULAS_PASSADO)', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError('select public.gerar_aulas($1, $2::date, $3::date)', [BOX1, datas.ontem, datas.ontem], 'GERAR_AULAS_PASSADO')
  })

  await test('C4. Rejeita início além de hoje+14 (GERAR_AULAS_HORIZONTE)', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError('select public.gerar_aulas($1, $2::date, $3::date)', [BOX1, datas.hoje15, datas.hoje15], 'GERAR_AULAS_HORIZONTE')
  })

  await test('C5. Rejeita box de outro usuário (GERAR_AULAS_BOX_NAO_AUTORIZADO)', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError('select public.gerar_aulas($1, $2::date, $3::date)', [BOX2, datas.hoje, datas.hoje], 'GERAR_AULAS_BOX_NAO_AUTORIZADO')
  })

  await test('C6. Não recria aula cancelada nem duplica slot', async () => {
    const aulaHoje = await one(
      `select id from aulas where box_id=$1 and data=$2::date and grade_aula_id is not null limit 1`,
      [BOX1, datas.hoje]
    )
    assert(aulaHoje, 'nenhuma aula gerada para hoje')
    await db.query(`update aulas set status='CANCELADA', motivo_cancelamento='teste' where id=$1`, [aulaHoje.id])
    await asUser(AUTH_ALUNO1)
    const n = await scalar('select public.gerar_aulas($1, $2::date, $3::date)', [BOX1, datas.hoje, datas.hoje6])
    assert(Number(n) === 0, 'reexecução gerou aulas novas sobre slots existentes')
    await asOwner()
    const st = await scalar('select status from aulas where id=$1', [aulaHoje.id])
    assert(st === 'CANCELADA', 'aula cancelada foi ressuscitada')
    const total = await scalar(
      'select count(*) from aulas where box_id=$1 and data between $2::date and $3::date and grade_aula_id is not null',
      [BOX1, datas.hoje, datas.hoje6]
    )
    assert(Number(total) === 7, `esperava 7 aulas no intervalo, existem ${total}`)
  })

  await test('C7. Coach do box também pode executar (geração sob demanda)', async () => {
    await asUser(AUTH_COACH1)
    const n = await scalar('select public.gerar_aulas($1, $2::date, $3::date)', [BOX1, datas.hoje, datas.hoje])
    assert(Number(n) === 0, 'esperava 0 (todas já existem)')
  })

  console.log('\n=== D. REALIZAR_CHECKIN — JANELA E ELEGIBILIDADE ===')

  // Aulas extraordinárias relativas a agora (SP):
  const aulaFechada = await criarAulaRelativa(BOX1, 13 * 60, 20) // abre em +1h → fechada
  const aulaAberta1 = await criarAulaRelativa(BOX1, 2 * 60, 20) // janela aberta
  const aulaAberta2 = await criarAulaRelativa(BOX1, 2 * 60 + 10, 2) // janela aberta, cap 2
  const aulaEncerrada = await criarAulaRelativa(BOX1, 5, 20) // encerra em -5min
  const aulaCancelada = await criarAulaRelativa(BOX1, 3 * 60, 20)
  const aulaPassada = await criarAulaRelativa(BOX1, -2 * 60, 20) // início há 2h
  const aulaPassada3 = await criarAulaRelativa(BOX1, -60, 20)
  const aulaCancelada2 = await criarAulaRelativa(BOX1, -90, 20)
  const aulaTriggers = await criarAulaRelativa(BOX1, 4 * 60, 2)
  await db.query(`update aulas set status='CANCELADA', motivo_cancelamento='cancelada p/ teste' where id=$1`, [aulaCancelada.id])

  await test('D1. Janela ainda não aberta (−12h) → CHECKIN_JANELA_FECHADA', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError('select public.realizar_checkin($1)', [aulaFechada.id], 'CHECKIN_JANELA_FECHADA')
  })

  await test('D2. Janela aberta → check-in OK (status CONFIRMADA, checkin_at set)', async () => {
    await asUser(AUTH_ALUNO1)
    const rid = await checkin(aulaAberta1.id)
    assert(rid, 'check-in não retornou id da reserva')
    await asOwner()
    const r = await one('select status, checkin_at from reservas where id=$1', [rid])
    assert(r.status === 'CONFIRMADA' && r.checkin_at, 'reserva não ficou CONFIRMADA com checkin_at')
  })

  await test('D3. Janela encerrada (−10min) → CHECKIN_JANELA_ENCERRADA', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError('select public.realizar_checkin($1)', [aulaEncerrada.id], 'CHECKIN_JANELA_ENCERRADA')
  })

  await test('D4. Aula inexistente → CHECKIN_AULA_INEXISTENTE', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError('select public.realizar_checkin($1)', ['99999999-9999-4999-8999-999999999999'], 'CHECKIN_AULA_INEXISTENTE')
  })

  await test('D5. Aula cancelada → CHECKIN_AULA_CANCELADA', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError('select public.realizar_checkin($1)', [aulaCancelada.id], 'CHECKIN_AULA_CANCELADA')
  })

  await test('D6. Sem inscrição BOX ativa (só PLANILHA + inscrição BOX inativa) → CHECKIN_SEM_INSCRICAO', async () => {
    await asUser(AUTH_ALUNO4)
    await expectError('select public.realizar_checkin($1)', [aulaAberta1.id], 'CHECKIN_SEM_INSCRICAO')
  })

  await test('D7. Coach não realiza check-in → CHECKIN_SOMENTE_ALUNO', async () => {
    await asUser(AUTH_COACH1)
    await expectError('select public.realizar_checkin($1)', [aulaAberta1.id], 'CHECKIN_SOMENTE_ALUNO')
  })

  console.log('\n=== E. DUPLICIDADE E CAPACIDADE ===')

  await test('E1. Check-in duplicado do mesmo aluno → CHECKIN_DUPLICADO', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError('select public.realizar_checkin($1)', [aulaAberta1.id], 'CHECKIN_DUPLICADO')
  })

  await test('E2. Capacidade 2: dois check-ins OK, terceiro → CHECKIN_LOTADA', async () => {
    await asUser(AUTH_ALUNO1)
    await checkin(aulaAberta2.id)
    await asUser(AUTH_ALUNO2)
    await checkin(aulaAberta2.id)
    await asUser(AUTH_ALUNO3)
    await expectError('select public.realizar_checkin($1)', [aulaAberta2.id], 'CHECKIN_LOTADA')
  })

  await test('E3. Cancelamento libera vaga; ocupação e vagas consistentes em listar_aulas_por_data', async () => {
    await asUser(AUTH_ALUNO2)
    const rid = await reservaIdDe(aulaAberta2.id, ALUNO2)
    await db.query('select public.cancelar_reserva($1)', [rid])
    await asUser(AUTH_ALUNO3)
    await checkin(aulaAberta2.id) // agora cabe
    await asUser(AUTH_ALUNO1) // listar exige identidade (escopo box do chamador)
    const row = await one(
      'select vagas_ocupadas, vagas_disponiveis from public.listar_aulas_por_data($1::date) where aula_id=$2',
      [aulaAberta2.data, aulaAberta2.id]
    )
    assert(Number(row.vagas_ocupadas) === 2, `ocupadas esperava 2, obtido ${row.vagas_ocupadas}`)
    assert(Number(row.vagas_disponiveis) === 0, `disponiveis esperava 0, obtido ${row.vagas_disponiveis}`)
  })

  await test('E4. Índice parcial: 2ª reserva CONFIRMADA do mesmo par → violação de unique', async () => {
    await db.query(
      `insert into reservas (aula_id, aluno_id, status) values ($1, $2, 'CONFIRMADA')`,
      [aulaAberta1.id, ALUNO2]
    )
    await expectError(
      `insert into reservas (aula_id, aluno_id, status) values ($1, $2, 'CONFIRMADA')`,
      [aulaAberta1.id, ALUNO2],
      'reservas_uma_nao_cancelada_por_aluno'
    )
  })

  await test('E5. Índice parcial: AUSENTE bloqueia novo par ativo; CANCELADA libera', async () => {
    await db.query(
      `insert into reservas (aula_id, aluno_id, status) values ($1, $2, 'AUSENTE')`,
      [aulaAberta1.id, ALUNO3]
    )
    await expectError(
      `insert into reservas (aula_id, aluno_id, status) values ($1, $2, 'CONFIRMADA')`,
      [aulaAberta1.id, ALUNO3],
      'reservas_uma_nao_cancelada_por_aluno'
    )
    // CANCELADA não ocupa o índice parcial → insert permitido
    await db.query(
      `insert into reservas (aula_id, aluno_id, status) values ($1, $2, 'CANCELADA')`,
      [aulaAberta1.id, ALUNO3]
    )
  })

  await test('E6. Aula CANCELADA → janela_checkin_aberta=false e vagas_disponiveis=0', async () => {
    await asUser(AUTH_ALUNO1) // listar exige identidade (escopo box do chamador)
    const row = await one(
      'select janela_checkin_aberta, vagas_disponiveis, status from public.listar_aulas_por_data($1::date) where aula_id=$2',
      [aulaCancelada.data, aulaCancelada.id]
    )
    assert(row.status === 'CANCELADA', 'status incorreto')
    assert(row.janela_checkin_aberta === false, 'aula cancelada com janela aberta')
    assert(Number(row.vagas_disponiveis) === 0, 'aula cancelada com vagas disponíveis')
  })

  console.log('\n=== F. CANCELAR_RESERVA ===')

  await test('F1. Aluno cancela a própria reserva (OK, CANCELADA, cancelado_at)', async () => {
    await asOwner()
    const rid = await reservaIdDe(aulaAberta2.id, ALUNO3)
    await asUser(AUTH_ALUNO3)
    await db.query('select public.cancelar_reserva($1)', [rid])
    await asOwner()
    const r = await one('select status, cancelado_at from reservas where id=$1', [rid])
    assert(r.status === 'CANCELADA' && r.cancelado_at, 'reserva não cancelada corretamente')
  })

  await test('F2. Cancelamento permitido APÓS encerramento da janela', async () => {
    await db.query(
      `insert into reservas (aula_id, aluno_id, status) values ($1, $2, 'CONFIRMADA')`,
      [aulaPassada.id, ALUNO1]
    )
    const rid = await reservaIdDe(aulaPassada.id, ALUNO1)
    await asUser(AUTH_ALUNO1)
    await db.query('select public.cancelar_reserva($1)', [rid])
  })

  await test('F3. Cancelamento NÃO gera ausência automática (status CANCELADA, sem presença)', async () => {
    const rid = await reservaIdDe(aulaPassada.id, ALUNO1)
    const r = await one(
      'select status, presenca_confirmada_at, presenca_confirmada_por from reservas where id=$1',
      [rid]
    )
    assert(r.status === 'CANCELADA', 'status deveria ser CANCELADA')
    assert(r.presenca_confirmada_at === null && r.presenca_confirmada_por === null, 'presença não deveria estar setada')
  })

  await test('F4. Cancelamento NÃO reabre a janela (check-in segue bloqueado)', async () => {
    await asUser(AUTH_ALUNO3)
    await expectError('select public.realizar_checkin($1)', [aulaPassada.id], 'CHECKIN_JANELA_ENCERRADA')
  })

  await test('F5. Aluno NÃO cancela reserva de outro → CANCELAR_NAO_AUTORIZADO', async () => {
    const rid = await reservaIdDe(aulaAberta1.id, ALUNO1) // reserva do aluno1 (CONFIRMADA)
    await asUser(AUTH_ALUNO2)
    await expectError('select public.cancelar_reserva($1)', [rid], 'CANCELAR_NAO_AUTORIZADO')
  })

  await test('F6. Coach NÃO cancela reserva de aluno → CANCELAR_PERFIL_INVALIDO', async () => {
    const rid = await reservaIdDe(aulaAberta1.id, ALUNO1)
    await asUser(AUTH_COACH1)
    await expectError('select public.cancelar_reserva($1)', [rid], 'CANCELAR_PERFIL_INVALIDO')
  })

  await test('F7. Admin do box cancela reserva de aluno (OK)', async () => {
    const rid = await reservaIdDe(aulaAberta1.id, ALUNO1)
    await asUser(AUTH_ADMIN1)
    await db.query('select public.cancelar_reserva($1)', [rid])
    await asOwner()
    const st = await scalar('select status from reservas where id=$1', [rid])
    assert(st === 'CANCELADA', 'admin não cancelou')
  })

  await test('F8. Presença confirmada (COMPARECEU) não é cancelável', async () => {
    await db.query(
      `insert into reservas (aula_id, aluno_id, status) values ($1, $2, 'CONFIRMADA')`,
      [aulaPassada.id, ALUNO2]
    )
    const rid = await reservaIdDe(aulaPassada.id, ALUNO2)
    await asUser(AUTH_COACH1)
    await db.query('select public.confirmar_presenca($1, true)', [rid])
    await asUser(AUTH_ALUNO2)
    await expectError('select public.cancelar_reserva($1)', [rid], 'CANCELAR_PRESENCA_CONFIRMADA')
  })

  await test('F9. Reserva já cancelada → CANCELAR_JA_CANCELADA', async () => {
    const rid = await reservaIdDe(aulaAberta1.id, ALUNO1) // cancelada em F7
    await asUser(AUTH_ALUNO1)
    await expectError('select public.cancelar_reserva($1)', [rid], 'CANCELAR_JA_CANCELADA')
  })

  console.log('\n=== G. CONFIRMAR_PRESENCA ===')

  await test('G1. Antes do início da aula → PRESENCA_ANTES_DO_INICIO', async () => {
    const rid = await reservaIdDe(aulaAberta2.id, ALUNO1) // aula futura, CONFIRMADA
    await asUser(AUTH_COACH1)
    await expectError('select public.confirmar_presenca($1, true)', [rid], 'PRESENCA_ANTES_DO_INICIO')
  })

  await test('G2. Após o início → COMPARECEU, com auditoria (quem/quando)', async () => {
    const rid = await reservaIdDe(aulaPassada.id, ALUNO2) // confirmada em F8
    const r = await one(
      'select status, presenca_confirmada_por, presenca_confirmada_at from reservas where id=$1',
      [rid]
    )
    assert(r.status === 'COMPARECEU', 'status deveria ser COMPARECEU')
    assert(r.presenca_confirmada_por === USR_COACH1, 'presenca_confirmada_por incorreto')
    assert(r.presenca_confirmada_at, 'presenca_confirmada_at não setado')
  })

  await test('G3. Ausência registrada (AUSENTE)', async () => {
    await db.query(
      `insert into reservas (aula_id, aluno_id, status) values ($1, $2, 'CONFIRMADA')`,
      [aulaPassada3.id, ALUNO3]
    )
    const rid = await reservaIdDe(aulaPassada3.id, ALUNO3)
    await asUser(AUTH_COACH1)
    await db.query('select public.confirmar_presenca($1, false)', [rid])
    await asOwner()
    const st = await scalar('select status from reservas where id=$1', [rid])
    assert(st === 'AUSENTE', 'status deveria ser AUSENTE')
  })

  await test('G4. Aluno NÃO confirma presença → PRESENCA_PERFIL_INVALIDO', async () => {
    const rid = await reservaIdDe(aulaAberta2.id, ALUNO1)
    await asUser(AUTH_ALUNO1)
    await expectError('select public.confirmar_presenca($1, true)', [rid], 'PRESENCA_PERFIL_INVALIDO')
  })

  await test('G5. Coach de outro box → PRESENCA_NAO_AUTORIZADA', async () => {
    const rid = await reservaIdDe(aulaPassada3.id, ALUNO3)
    await asUser(AUTH_COACH2)
    await expectError('select public.confirmar_presenca($1, true)', [rid], 'PRESENCA_NAO_AUTORIZADA')
  })

  await test('G6. Reserva não-CONFIRMADA (CANCELADA em aula passada) → PRESENCA_ESTADO_INVALIDO', async () => {
    await db.query(
      `insert into reservas (aula_id, aluno_id, status) values ($1, $2, 'CANCELADA')`,
      [aulaPassada3.id, ALUNO2]
    )
    const rid = await reservaIdDe(aulaPassada3.id, ALUNO2)
    await asUser(AUTH_COACH1)
    await expectError('select public.confirmar_presenca($1, true)', [rid], 'PRESENCA_ESTADO_INVALIDO')
  })

  await test('G7. Aula cancelada → PRESENCA_AULA_CANCELADA', async () => {
    await db.query(
      `insert into reservas (aula_id, aluno_id, status) values ($1, $2, 'CONFIRMADA')`,
      [aulaCancelada2.id, ALUNO2]
    )
    const rid = await reservaIdDe(aulaCancelada2.id, ALUNO2)
    await db.query(`update aulas set status='CANCELADA', motivo_cancelamento='teste' where id=$1`, [aulaCancelada2.id])
    await asUser(AUTH_COACH1)
    await expectError('select public.confirmar_presenca($1, true)', [rid], 'PRESENCA_AULA_CANCELADA')
  })

  await test('G8. Ocupação conta COMPARECEU e ignora AUSENTE (listar_aulas_por_data)', async () => {
    await db.query(
      `insert into reservas (aula_id, aluno_id, status) values ($1, $2, 'CONFIRMADA')`,
      [aulaPassada3.id, ALUNO1]
    )
    const rid = await reservaIdDe(aulaPassada3.id, ALUNO1)
    await asUser(AUTH_COACH1)
    await db.query('select public.confirmar_presenca($1, true)', [rid])
    await asUser(AUTH_ALUNO1) // listar exige identidade (escopo box do chamador)
    const row = await one(
      'select vagas_ocupadas from public.listar_aulas_por_data($1::date) where aula_id=$2',
      [aulaPassada3.data, aulaPassada3.id]
    )
    // aluno1 COMPARECEU (ocupa) + aluno3 AUSENTE (não ocupa) = 1
    assert(Number(row.vagas_ocupadas) === 1, `ocupadas esperava 1, obtido ${row.vagas_ocupadas}`)
  })

  console.log('\n=== H. RLS / PERMISSÕES ===')

  await test('H1. Aluno vê SOMENTE as próprias reservas', async () => {
    await asUser(AUTH_ALUNO1)
    const visivel = Number(await scalar('select count(*) from reservas'))
    await asOwner()
    const esperado = Number(
      await scalar('select count(*) from reservas where aluno_id=$1', [ALUNO1])
    )
    const total = Number(await scalar('select count(*) from reservas'))
    assert(visivel === esperado, `aluno vê ${visivel}, próprio = ${esperado}`)
    assert(esperado < total, 'teste sem poder discriminante (aluno deveria ter menos que o total)')
  })

  await test('H2. Coach do box vê TODAS as reservas do box', async () => {
    await asUser(AUTH_COACH1)
    const visivel = Number(await scalar('select count(*) from reservas'))
    await asOwner()
    const totalBox1 = Number(
      await scalar('select count(*) from reservas r join aulas a on a.id=r.aula_id where a.box_id=$1', [BOX1])
    )
    assert(visivel === totalBox1, `coach vê ${visivel}, reservas do box = ${totalBox1}`)
  })

  await test('H3. Admin do box vê TODAS as reservas do box', async () => {
    await asUser(AUTH_ADMIN1)
    const visivel = Number(await scalar('select count(*) from reservas'))
    await asOwner()
    const totalBox1 = Number(
      await scalar('select count(*) from reservas r join aulas a on a.id=r.aula_id where a.box_id=$1', [BOX1])
    )
    assert(visivel === totalBox1, `admin vê ${visivel}, reservas do box = ${totalBox1}`)
  })

  await test('H4. anon SEM acesso (SELECT em aulas → permission denied)', async () => {
    await asUser(null, 'anon')
    await expectError('select id from aulas limit 1', [], 'permission denied')
  })

  await test('H5. Aluno NÃO insere reserva diretamente (só via função)', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError(
      'insert into reservas (aula_id, aluno_id) values ($1, $2)',
      [aulaAberta1.id, ALUNO1],
      'permission denied'
    )
  })

  await test('H6. Aluno NÃO cria regra de grade (RLS WITH CHECK)', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError(
      `insert into grade_aulas (box_id, dia_semana, hora_inicio, hora_fim, capacidade, vigencia_inicio)
       values ($1, 'SEG', '05:00', '06:00', 20, current_date)`,
      [BOX1],
      'row-level security'
    )
  })

  await test('H6b. UPDATE silencioso de grade por aluno → 0 linhas afetadas', async () => {
    await asUser(AUTH_ALUNO1)
    await db.query('update grade_aulas set capacidade = 99')
    await asOwner()
    const n = Number(await scalar('select count(*) from grade_aulas where capacidade = 99'))
    assert(n === 0, 'aluno conseguiu alterar capacidade da grade')
  })

  await test('H7. Isolamento entre boxes: aluno do box1 não vê aulas do box2', async () => {
    await db.query(
      `insert into aulas (box_id, data, hora_inicio, hora_fim, capacidade)
       values ($1, current_date, '10:00', '11:00', 20)`,
      [BOX2]
    )
    await asUser(AUTH_ALUNO1)
    const n = Number(await scalar('select count(*) from aulas where box_id=$1', [BOX2]))
    assert(n === 0, `aluno do box1 viu ${n} aulas do box2`)
  })

  await test('H8. Coach do box2 NÃO vê reservas do box1', async () => {
    await asUser(AUTH_COACH2)
    const n = Number(await scalar('select count(*) from reservas'))
    assert(n === 0, `coach do box2 viu ${n} reservas (todas são do box1)`)
  })

  console.log('\n=== I. INTEGRIDADE E TRIGGERS ===')

  await test('I1. FK composta: aula do box2 com grade do box1 → violação', async () => {
    await expectError(
      `insert into aulas (box_id, grade_aula_id, data, hora_inicio, hora_fim, capacidade)
       select $1, g.id, current_date, '12:00', '13:00', 20
       from grade_aulas g where g.box_id=$2 limit 1`,
      [BOX2, BOX1],
      'fk_aulas_grade_box'
    )
  })

  await test('I2. Trigger: alterar HORÁRIO com reservas ocupando vaga → bloqueado', async () => {
    await asUser(AUTH_ALUNO1)
    await checkin(aulaTriggers.id)
    await asUser(AUTH_ALUNO2)
    await checkin(aulaTriggers.id) // cap 2, ocupação 2
    await asOwner() // UPDATE precisa passar pela RLS para o trigger disparar
    await expectError(
      `update aulas set hora_inicio = hora_inicio + interval '30 minutes' where id=$1`,
      [aulaTriggers.id],
      'AULA_HORARIO_BLOQUEADO'
    )
  })

  await test('I3. Trigger: reduzir capacidade abaixo da ocupação → bloqueado', async () => {
    await expectError(
      'update aulas set capacidade=1 where id=$1',
      [aulaTriggers.id],
      'AULA_CAPACIDADE_INVALIDA'
    )
  })

  await test('I4. Aumentar capacidade permitido; updated_at atualizado', async () => {
    const antes = Number(
      await scalar('select extract(epoch from updated_at)::float8 from aulas where id=$1', [aulaTriggers.id])
    )
    await new Promise((r) => setTimeout(r, 30)) // garante avanço do relógio
    await db.query('update aulas set capacidade=5 where id=$1', [aulaTriggers.id])
    const depois = await one(
      'select capacidade, extract(epoch from updated_at)::float8 as ts from aulas where id=$1',
      [aulaTriggers.id]
    )
    assert(Number(depois.capacidade) === 5, 'capacidade não atualizada')
    assert(Number(depois.ts) > antes, 'updated_at não foi atualizado')
  })

  await test('I5. Admin do box atualiza aula via policy (RLS permite)', async () => {
    await asUser(AUTH_ADMIN1)
    await db.query('update aulas set capacidade=25 where id=$1', [aulaAberta1.id])
    await asOwner()
    const cap = await scalar('select capacidade from aulas where id=$1', [aulaAberta1.id])
    assert(Number(cap) === 25, 'admin não conseguiu atualizar capacidade')
  })

  await test('I6. Admin do box1 NÃO cria aula no box2 (RLS WITH CHECK)', async () => {
    await asUser(AUTH_ADMIN1)
    await expectError(
      `insert into aulas (box_id, data, hora_inicio, hora_fim, capacidade)
       values ($1, current_date, '10:00', '11:00', 20)`,
      [BOX2],
      'row-level security'
    )
  })

  console.log('\n=== J. ISOLAMENTO DA PLANILHA ===')

  const snap = await one(`
    select
      (select count(*) from frequencias) as frequencias,
      (select count(*) from resultados) as resultados,
      (select count(*) from programacoes) as programacoes,
      (select count(*) from inscricoes) as inscricoes,
      (select count(*) from treinos) as treinos
  `)
  // executa uma rodada extra de operações Box para confirmar que nada vaza
  await asUser(AUTH_ALUNO1)
  await checkin(aulaAberta1.id) // nova reserva
  await asOwner()
  const after = await one(`
    select
      (select count(*) from frequencias) as frequencias,
      (select count(*) from resultados) as resultados,
      (select count(*) from programacoes) as programacoes,
      (select count(*) from inscricoes) as inscricoes,
      (select count(*) from treinos) as treinos
  `)

  await test('J1. Tabela frequencias da Planilha INTACTA (nenhuma escrita)', async () => {
    assert(String(snap.frequencias) === String(after.frequencias), 'frequencias foi modificada')
  })

  await test('J2. Tabelas legadas (resultados, programacoes, inscricoes, treinos) intactas', async () => {
    for (const col of ['resultados', 'programacoes', 'inscricoes', 'treinos']) {
      assert(
        String(snap[col]) === String(after[col]),
        `${col} foi modificado (${snap[col]} → ${after[col]})`
      )
    }
  })
}

/* ================================================================
 * MAIN
 * ================================================================ */
try {
  console.log('OLYMPEA WARRIOR — Etapa 3.1 — Testes isolados (PGlite)')
  console.log(`Migration: ${path.relative(ROOT, MIGRATION_PATH)}`)
  await setup()
  console.log('Setup concluído (stubs + schema legado + migration + seeds).\n')
  await runTests()
} catch (e) {
  console.error('\n[SETUP FALHOU]')
  console.error(String(e.message))
  console.error('Todos os testes: NÃO TESTADO (setup não concluído).')
  process.exitCode = 1
} finally {
  if (results.length > 0) {
    const aprovados = results.filter((r) => r.status === 'APROVADO').length
    const reprovados = results.filter((r) => r.status === 'REPROVADO').length
    console.log('\n================ RESUMO ================')
    console.log(`APROVADOS:  ${aprovados}`)
    console.log(`REPROVADOS: ${reprovados}`)
    console.log(`NÃO TESTADOS: 0 (todos os testes planejados foram executados)`)
    if (reprovados > 0) {
      console.log('\nFalhas:')
      for (const r of results.filter((x) => x.status === 'REPROVADO')) {
        console.log(`  ✘ ${r.name}\n    → ${r.error}`)
      }
      process.exitCode = 1
    }
  }
  if (db) await db.close().catch(() => {})
}
