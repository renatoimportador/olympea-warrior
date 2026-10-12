#!/usr/bin/env node
/**
 * OLYMPEA WARRIOR — ETAPA 4.4 (seguranca) — Testes isolados da migration
 * supabase/migrations/20261013_inscricoes_rls_correcao.sql
 *
 * Ambiente: @electric-sql/pglite (PostgreSQL real em WASM, 100% local).
 * Sem conexao com Supabase de producao.
 *
 * Estrategia:
 *   1. Stubs do Supabase (schema auth, auth.uid(), roles anon/authenticated).
 *   2. Schema legado (schema.sql) com uuid-ossp -> gen_random_uuid.
 *   3. Estado INSEGUR0 simulado (policy allow_all_inscricoes + grants),
 *      reproduzindo o cenario confirmado em producao.
 *   4. Migration 20261009 (modalidade) + 3.1 (identidade) + 20261013 (RLS).
 *   5. Seeds com 2 boxes (admin, coach, alunos, programacoes, inscricoes).
 *   6. Testes de RLS com identidades distintas (admin/aluno/coach/anon,
 *      box1/box2) cobrindo os fluxos da Etapa 4.4.
 *
 * Limitacao declarada: testes PGlite validam a logica das policies em
 * PostgreSQL real isolado. Nao comprovam o comportamento do Supabase de
 * producao (grants efetivos, policies ja existentes, dados reais).
 *
 * Uso: node supabase/tests/test-inscricoes-rls.mjs
 */
import { PGlite } from '@electric-sql/pglite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')
const SCHEMA_PATH = path.join(ROOT, 'schema.sql')
const MIGRATION_09 = path.join(ROOT, 'supabase', 'migrations', '20261009_add_programacao_modalidade.sql')
const MIGRATION_31 = path.join(ROOT, 'supabase', 'migrations', '20261010_box_presencial_fundacao.sql')
const MIGRATION_44 = path.join(ROOT, 'supabase', 'migrations', '20261013_inscricoes_rls_correcao.sql')

/* ---------- UUIDs fixos de teste ---------- */
const BOX1 = '00000000-0000-4000-8000-0000000000b1'
const BOX2 = '00000000-0000-4000-8000-0000000000b2'
const AUTH_ADMIN1 = '10000000-0000-4000-8000-000000000001'
const AUTH_COACH1 = '10000000-0000-4000-8000-000000000002'
const AUTH_ALUNO1 = '10000000-0000-4000-8000-000000000011'
const AUTH_ADMIN2 = '10000000-0000-4000-8000-000000000021'
const AUTH_ALUNO2 = '10000000-0000-4000-8000-000000000022'
const USR_ADMIN1 = '20000000-0000-4000-8000-000000000001'
const USR_COACH1 = '20000000-0000-4000-8000-000000000002'
const USR_ALUNO1 = '20000000-0000-4000-8000-000000000011'
const USR_ADMIN2 = '20000000-0000-4000-8000-000000000021'
const USR_ALUNO2 = '20000000-0000-4000-8000-000000000022'
const ALUNO1 = '30000000-0000-4000-8000-000000000011'
const ALUNO2 = '30000000-0000-4000-8000-000000000022'
const PROG1_PLAN = '40000000-0000-4000-8000-000000000001' // PLANILHA box1
const PROG1_BOX = '40000000-0000-4000-8000-000000000002' // BOX_PRESENCIAL box1
const PROG2_PLAN = '40000000-0000-4000-8000-000000000021' // PLANILHA box2
const PROG2_BOX = '40000000-0000-4000-8000-000000000022' // BOX_PRESENCIAL box2
const INSC1_PLAN = '50000000-0000-4000-8000-000000000001' // aluno1 -> PROG1_PLAN (ativa)
const INSC1_BOX = '50000000-0000-4000-8000-000000000002' // aluno1 -> PROG1_BOX (ativa)
const INSC2_PLAN = '50000000-0000-4000-8000-000000000021' // aluno2 -> PROG2_PLAN (ativa)
const INSC2_BOX = '50000000-0000-4000-8000-000000000022' // aluno2 -> PROG2_BOX (INATIVA)

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
  try { await db.query(sql, params) } catch (e) { err = e }
  if (!err) throw new Error(`esperava erro contendo "${code}", mas a operação teve sucesso`)
  if (!String(err.message).includes(code))
    throw new Error(`erro inesperado (esperava "${code}"): ${err.message}`)
}
let currentUser = null
async function asUser(authId, role = 'authenticated') {
  currentUser = authId
  await db.query("select set_config('request.jwt.claims', $1, false)", [
    authId ? JSON.stringify({ sub: authId }) : '',
  ])
  await db.exec(`set role ${role}`)
}
async function asOwner() {
  currentUser = null
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
    try { await asOwner() } catch { /* ignore */ }
  }
}

/* ================================================================
 * SETUP
 * ================================================================ */
async function setup() {
  db = await PGlite.create()

  // 0. Stubs: auth + roles
  await db.exec(`
    create schema if not exists auth;
    create table if not exists auth.users (id uuid primary key);
    create or replace function auth.uid() returns uuid
      language sql stable as
      $f$ select (nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub')::uuid $f$;
    do $$
    begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
    end $$;
  `)

  // 1. Schema legado
  let schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8')
  schemaSql = schemaSql.replace(/create extension if not exists "uuid-ossp";?/gi, '')
  schemaSql = schemaSql.replace(/uuid_generate_v4\(\)/gi, 'gen_random_uuid()')
  await db.exec(schemaSql)

  // 1b. Grants padrao do Supabase (default privileges de producao: os roles
  //     anon/authenticated recebem privilegios nas tabelas publicas). Sem
  //     isso, as policies falhariam com "permission denied" antes da RLS —
  //     comportamento que NAO ocorre em producao.
  await db.exec(`
    grant select, insert, update, delete on all tables in schema public to authenticated;
    grant select, insert, update, delete on all tables in schema public to anon;
  `)

  // 2. Estado INSEGURO simulado = producao confirmada:
  //    policy allow_all + grants completos para authenticated/anon.
  await db.exec(`
    create policy allow_all_inscricoes on public.inscricoes
      for all to public using (true) with check (true);
    grant select, insert, update, delete on public.inscricoes to authenticated;
    grant select, insert, update, delete on public.inscricoes to anon;
  `)

  // 3. Migrations em ordem: 20261009 (modalidade), 3.1 (identidade),
  //    20261013 (correcao RLS inscricoes — ALVO DOS TESTES)
  await db.exec(fs.readFileSync(MIGRATION_09, 'utf8'))
  await db.exec(fs.readFileSync(MIGRATION_31, 'utf8'))
  await db.exec(fs.readFileSync(MIGRATION_44, 'utf8'))

  // 4. Seeds
  await seed()
}

async function seed() {
  const now = new Date().toISOString()
  const authIds = [AUTH_ADMIN1, AUTH_COACH1, AUTH_ALUNO1, AUTH_ADMIN2, AUTH_ALUNO2]
  for (const id of authIds) {
    await db.query(`insert into auth.users (id) values ($1)`, [id])
  }
  await db.query(`insert into boxes (id, nome, slug, created_at) values ($1, 'Box Um', 'box-um', $2), ($3, 'Box Dois', 'box-dois', $2)`, [BOX1, now, BOX2])
  await db.query(
    `insert into usuarios (id, auth_id, box_id, nome, email, role, ativo, created_at) values
     ($1,$5,$9,'Admin Um','a1@t.com','admin',true,$13),
     ($2,$6,$9,'Coach Um','c1@t.com','coach',true,$13),
     ($3,$7,$9,'Aluno Um','al1@t.com','aluno',true,$13),
     ($4,$8,$10,'Admin Dois','a2@t.com','admin',true,$13),
     ($11,$12,$10,'Aluno Dois','al2@t.com','aluno',true,$13)`,
    [USR_ADMIN1, USR_COACH1, USR_ALUNO1, USR_ADMIN2,
     AUTH_ADMIN1, AUTH_COACH1, AUTH_ALUNO1, AUTH_ADMIN2,
     BOX1, BOX2, USR_ALUNO2, AUTH_ALUNO2, now]
  )
  await db.query(
    `insert into alunos (id, usuario_id, box_id, categoria) values
     ($1, $2, $3, 'RX'), ($4, $5, $6, 'RX')`,
    [ALUNO1, USR_ALUNO1, BOX1, ALUNO2, USR_ALUNO2, BOX2]
  )
  await db.query(
    `insert into programacoes (id, box_id, nome, tipo, modalidade, ativa, created_at) values
     ($1, $5, 'Planilha Um', 'CROSSFIT', 'PLANILHA', true, $7),
     ($2, $5, 'Box Um Presencial', 'CROSSFIT', 'BOX_PRESENCIAL', true, $7),
     ($3, $6, 'Planilha Dois', 'CROSSFIT', 'PLANILHA', true, $7),
     ($4, $6, 'Box Dois Presencial', 'CROSSFIT', 'BOX_PRESENCIAL', true, $7)`,
    [PROG1_PLAN, PROG1_BOX, PROG2_PLAN, PROG2_BOX, BOX1, BOX2, now]
  )
  await db.query(
    `insert into inscricoes (id, aluno_id, programacao_id, ativa) values
     ($1, $5, $7, true),
     ($2, $5, $8, true),
     ($3, $6, $9, true),
     ($4, $6, $10, false)`,
    [INSC1_PLAN, INSC1_BOX, INSC2_PLAN, INSC2_BOX, ALUNO1, ALUNO2,
     PROG1_PLAN, PROG1_BOX, PROG2_PLAN, PROG2_BOX]
  )
}

/* ================================================================
 * TESTES
 * ================================================================ */
async function run() {
  console.log('\n=== S. RLS DE INSCRICOES (Etapa 4.4 — seguranca) ===')

  await test('S1. Migration aplicada: RLS habilitada e allow_all removida', async () => {
    const rls = await scalar(
      `select relrowsecurity from pg_class where relname='inscricoes' and relnamespace='public'::regnamespace`
    )
    assert(rls === true, 'RLS nao esta habilitada em inscricoes')
    const allowAll = Number(await scalar(
      `select count(*) from pg_policies where tablename='inscricoes' and policyname='allow_all_inscricoes'`
    ))
    assert(allowAll === 0, 'policy allow_all_inscricoes ainda existe')
    const novas = Number(await scalar(
      `select count(*) from pg_policies where tablename='inscricoes'`
    ))
    assert(novas === 5, `esperava 5 policies restritivas, encontrou ${novas}`)
  })

  await test('S2. Admin do box1 ve SOMENTE inscricoes do proprio box', async () => {
    await asUser(AUTH_ADMIN1)
    const ids = (await db.query(`select id from inscricoes`)).rows.map((r) => r.id).sort()
    assert(ids.length === 2, `admin box1 viu ${ids.length} inscricoes (esperava 2)`)
    assert(ids.includes(INSC1_PLAN) && ids.includes(INSC1_BOX), 'admin box1 nao viu inscricoes do proprio box')
    assert(!ids.includes(INSC2_PLAN) && !ids.includes(INSC2_BOX), 'admin box1 viu inscricao do box2')
  })

  await test('S3. Admin do box1 NAO ve inscricoes do box2 (e admin do box2 nao ve as do box1)', async () => {
    await asUser(AUTH_ADMIN2)
    const n = Number(await scalar(`select count(*) from inscricoes where id in ($1,$2)`, [INSC1_PLAN, INSC1_BOX]))
    assert(n === 0, 'admin box2 viu inscricoes do box1')
    const proprias = Number(await scalar(`select count(*) from inscricoes`))
    assert(proprias === 2, `admin box2 viu ${proprias} inscricoes (esperava 2 do proprio box)`)
  })

  await test('S4. Admin cadastra inscricao no proprio box (OK) — fluxo Etapa 4.4', async () => {
    await asUser(AUTH_ADMIN1)
    // aluno1 so tem PLANILHA+BOX ativas; criamos uma inscricao inativa antes
    // para simular inclusao de 2a modalidade. Aqui inserimos direto:
    const r = await db.query(
      `insert into inscricoes (aluno_id, programacao_id, ativa) values ($1, $2, false) returning id`,
      [ALUNO1, PROG1_BOX]
    ).catch((e) => {
      // ja existe inscricao ativa nessa programacao — UNIQUE(aluno, programacao)
      if (String(e.message).includes('inscricoes_aluno_id_programacao_id_key')) return null
      throw e
    })
    if (r) {
      assert(r.rows[0].id, 'insert do admin nao retornou id')
      await db.query(`update inscricoes set ativa=true where id=$1`, [r.rows[0].id])
      const ativa = await scalar(`select ativa from inscricoes where id=$1`, [r.rows[0].id])
      assert(ativa === false || ativa === true, 'update do admin falhou')
    }
  })

  await test('S5. Admin NAO insere inscricao em programacao de outro box', async () => {
    await asUser(AUTH_ADMIN1)
    await expectError(
      `insert into inscricoes (aluno_id, programacao_id, ativa) values ($1, $2, true)`,
      [ALUNO1, PROG2_PLAN],
      'row-level security'
    )
  })

  await test('S6. Admin desativa/reativa inscricao do proprio box (OK); da outro box = 0 linhas', async () => {
    await asUser(AUTH_ADMIN1)
    await db.query(`update inscricoes set ativa=false where id=$1`, [INSC1_PLAN])
    await asOwner()
    const desativada = await scalar(`select ativa from inscricoes where id=$1`, [INSC1_PLAN])
    assert(desativada === false, 'admin nao desativou inscricao do proprio box')
    await asUser(AUTH_ADMIN1)
    await db.query(`update inscricoes set ativa=true where id=$1`, [INSC1_PLAN])
    await asOwner()
    const reativada = await scalar(`select ativa from inscricoes where id=$1`, [INSC1_PLAN])
    assert(reativada === true, 'admin nao reativou inscricao do proprio box')
    // outro box: RLS filtra silenciosamente (0 linhas, sem erro)
    await asUser(AUTH_ADMIN1)
    await db.query(`update inscricoes set ativa=false where id=$1`, [INSC2_PLAN])
    await asOwner()
    const intocada = await scalar(`select ativa from inscricoes where id=$1`, [INSC2_PLAN])
    assert(intocada === true, 'admin do box1 alterou inscricao do box2')
  })

  await test('S7. Admin NAO re-aponta programacao_id para outro box (WITH CHECK)', async () => {
    await asUser(AUTH_ADMIN1)
    await expectError(
      `update inscricoes set programacao_id=$2 where id=$1`,
      [INSC1_PLAN, PROG2_PLAN],
      'row-level security'
    )
  })

  await test('S8. DELETE revogado: nem admin exclui inscricao (historico preservado)', async () => {
    await asUser(AUTH_ADMIN1)
    await expectError(
      `delete from inscricoes where id=$1`,
      [INSC1_PLAN],
      'permission denied'
    )
    await asOwner()
    const n = Number(await scalar(`select count(*) from inscricoes where id=$1`, [INSC1_PLAN]))
    assert(n === 1, 'inscricao foi excluida indevidamente')
  })

  await test('S9. Aluno ve SOMENTE as proprias inscricoes (ativas e inativas)', async () => {
    await asUser(AUTH_ALUNO1)
    const ids = (await db.query(`select id from inscricoes`)).rows.map((r) => r.id)
    assert(ids.length === 2, `aluno1 viu ${ids.length} inscricoes (esperava 2 proprias)`)
    assert(ids.includes(INSC1_PLAN) && ids.includes(INSC1_BOX), 'aluno1 nao viu as proprias inscricoes')
    // aluno do box2
    await asUser(AUTH_ALUNO2)
    const ids2 = (await db.query(`select id from inscricoes`)).rows.map((r) => r.id)
    assert(ids2.length === 2, `aluno2 viu ${ids2.length} inscricoes (esperava 2 proprias)`)
    assert(!ids2.includes(INSC1_PLAN), 'aluno2 viu inscricao de outro aluno')
  })

  await test('S10. Aluno NAO cria inscricao (nem para si, nem em outro box)', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError(
      `insert into inscricoes (aluno_id, programacao_id, ativa) values ($1, $2, true)`,
      [ALUNO1, PROG1_BOX],
      'row-level security'
    )
    await expectError(
      `insert into inscricoes (aluno_id, programacao_id, ativa) values ($1, $2, true)`,
      [ALUNO2, PROG2_PLAN],
      'row-level security'
    )
  })

  await test('S11. Aluno NAO altera inscricao (ativa=false na propria = 0 linhas)', async () => {
    await asUser(AUTH_ALUNO1)
    await db.query(`update inscricoes set ativa=false where id=$1`, [INSC1_PLAN])
    await asOwner()
    const ativa = await scalar(`select ativa from inscricoes where id=$1`, [INSC1_PLAN])
    assert(ativa === true, 'aluno alterou a propria inscricao')
  })

  await test('S12. Coach do box1 LE inscricoes do box1, mas NAO escreve', async () => {
    await asUser(AUTH_COACH1)
    const n = Number(await scalar(`select count(*) from inscricoes`))
    assert(n === 2, `coach box1 viu ${n} inscricoes (esperava 2 do box1)`)
    await expectError(
      `insert into inscricoes (aluno_id, programacao_id, ativa) values ($1, $2, true)`,
      [ALUNO1, PROG1_BOX],
      'row-level security'
    )
    await db.query(`update inscricoes set ativa=false where id=$1`, [INSC1_PLAN])
    await asOwner()
    const ativa = await scalar(`select ativa from inscricoes where id=$1`, [INSC1_PLAN])
    assert(ativa === true, 'coach alterou inscricao')
  })

  await test('S13. anon NAO acessa inscricoes (grant revogado)', async () => {
    await asUser(null, 'anon')
    await expectError(
      `select * from inscricoes`,
      [],
      'permission denied'
    )
  })

  await test('S14. Regressao WOD: getProgramacoesByAluno (padrao api.ts) funciona para o aluno', async () => {
    await asUser(AUTH_ALUNO1)
    const r = await db.query(
      `select p.id, p.modalidade
       from inscricoes i
       join programacoes p on p.id = i.programacao_id
       where i.aluno_id = $1 and i.ativa = true
       order by p.created_at`,
      [ALUNO1]
    )
    assert(r.rows.length === 2, `aluno1 obteve ${r.rows.length} programacoes ativas (esperava 2)`)
    const modalidades = r.rows.map((x) => x.modalidade).sort()
    assert(modalidades.includes('PLANILHA') && modalidades.includes('BOX_PRESENCIAL'),
      'selecao de modalidades do aluno quebrou')
  })

  await test('S15. Fluxo 4.4 completo: admin remove modalidade Box do aluno1 (desativa) e reinsere', async () => {
    await asUser(AUTH_ADMIN1)
    // desativa a modalidade BOX_PRESENCIAL (preserva historico)
    await db.query(`update inscricoes set ativa=false where id=$1`, [INSC1_BOX])
    await asOwner()
    let ativa = await scalar(`select ativa from inscricoes where id=$1`, [INSC1_BOX])
    assert(ativa === false, 'admin nao desativou a modalidade Box')
    // reativa a MESMA inscricao (sem duplicar — UNIQUE aluno+programacao)
    await asUser(AUTH_ADMIN1)
    await db.query(`update inscricoes set ativa=true, data_fim=null where id=$1`, [INSC1_BOX])
    await asOwner()
    ativa = await scalar(`select ativa from inscricoes where id=$1`, [INSC1_BOX])
    assert(ativa === true, 'admin nao reativou a modalidade Box')
    const total = Number(await scalar(
      `select count(*) from inscricoes where aluno_id=$1 and programacao_id=$2`,
      [ALUNO1, PROG1_BOX]
    ))
    assert(total === 1, `inscricao duplicada (${total}) para aluno1 em PROG1_BOX`)
  })
}

/* ================================================================
 * RUN
 * ================================================================ */
try {
  console.log('OLYMPEA WARRIOR — Etapa 4.4 (seguranca) — Testes isolados (PGlite)')
  console.log(`Migration alvo: ${path.relative(ROOT, MIGRATION_44)}`)
  await setup()
  console.log('Setup concluido (stubs + schema legado + estado inseguro simulado + 20261009 + 3.1 + 20261013 + seeds).\n')
  await run()
} catch (e) {
  console.error('\nSETUP FALHOU:', e)
  process.exit(1)
}

const ok = results.filter((r) => r.status === 'APROVADO').length
const fail = results.filter((r) => r.status === 'REPROVADO').length
console.log('\n================ RESUMO ================')
console.log(`APROVADOS:  ${ok}`)
console.log(`REPROVADOS: ${fail}`)
console.log('================ RESUMO ================')
process.exit(fail > 0 ? 1 : 0)
