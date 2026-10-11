#!/usr/bin/env node
/**
 * OLYMPEA WARRIOR — ETAPA 4.1 — Testes isolados da migration
 * supabase/migrations/20261011_comunidade_fundacao.sql
 *
 * Ambiente: @electric-sql/pglite (PostgreSQL real em WASM, 100% local).
 * Sem conexao com Supabase de producao.
 *
 * Estrategia:
 *   1. Stubs do Supabase (schema auth, auth.uid(), roles anon/authenticated)
 *      + stub minimo do schema storage (buckets, objects, foldername).
 *   2. Schema legado (schema.sql) com uuid-ossp -> gen_random_uuid.
 *   3. Migration da Etapa 3.1 (funcoes de identidade + app_eh_staff_aula)
 *      NECESSARIA para as policies da Comunidade.
 *   4. Migration da Etapa 4.1 INTEGRAL, sem modificacoes.
 *   5. Seeds com 2 boxes, admin/coach/alunos de cada, publicacoes.
 *
 * Limitacao declarada: o stub de storage replica apenas a assinatura de
 * storage.buckets/objects/foldername para validar a SINTAXE e a LOGICA das
 * policies. Nao valida a integracao real com o Supabase Storage (upload,
 * signed URLs, comportamento do servidor). Isso exige projeto real.
 *
 * Uso: node supabase/tests/test-comunidade.mjs
 */
import { PGlite } from '@electric-sql/pglite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')
const MIGRATION_31 = path.join(ROOT, 'supabase', 'migrations', '20261010_box_presencial_fundacao.sql')
const MIGRATION_41 = path.join(ROOT, 'supabase', 'migrations', '20261011_comunidade_fundacao.sql')
const MIGRATION_43 = path.join(ROOT, 'supabase', 'migrations', '20261012_comunidade_alunos_publicam.sql')
const SCHEMA_PATH = path.join(ROOT, 'schema.sql')

/* ---------- UUIDs fixos de teste ---------- */
const BOX1 = '00000000-0000-4000-8000-0000000000b1'
const BOX2 = '00000000-0000-4000-8000-0000000000b2'
const AUTH_ADMIN1 = '10000000-0000-4000-8000-000000000001'
const AUTH_COACH1 = '10000000-0000-4000-8000-000000000002'
const AUTH_COACH2 = '10000000-0000-4000-8000-000000000003'
const AUTH_COACH1B = '10000000-0000-4000-8000-000000000004' // 2o coach do box1
const AUTH_ALUNO1 = '10000000-0000-4000-8000-000000000011'
const AUTH_ALUNO2 = '10000000-0000-4000-8000-000000000012'
const USR_ADMIN1 = '20000000-0000-4000-8000-000000000001'
const USR_COACH1 = '20000000-0000-4000-8000-000000000002'
const USR_COACH2 = '20000000-0000-4000-8000-000000000003'
const USR_COACH1B = '20000000-0000-4000-8000-000000000004' // 2o coach do box1
const USR_ALUNO1 = '20000000-0000-4000-8000-000000000011'
const USR_ALUNO2 = '20000000-0000-4000-8000-000000000012'

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
// Publica um rascunho como owner (bypass RLS) — atalho de setup para os testes
// que precisam de uma publicacao PUBLICADA sem exercitar a transicao. Salva e
// restaura o usuario autenticado para nao interferir no teste seguinte.
async function publicar(id) {
  const u = currentUser
  await asOwner()
  await db.query(`update publicacoes set status='PUBLICADA' where id=$1`, [id])
  if (u) await asUser(u)
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

  // 0. Stubs: auth + roles + storage
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

    create schema if not exists storage;
    create table if not exists storage.buckets (
      id text primary key,
      name text,
      public boolean default false,
      file_size_limit integer,
      allowed_mime_types text[]
    );
    create table if not exists storage.objects (
      id uuid default gen_random_uuid() primary key,
      bucket_id text references storage.buckets(id),
      name text,
      owner uuid,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
    alter table storage.objects enable row level security;
    grant usage on schema storage to authenticated;
    grant select, insert, update, delete on storage.objects to authenticated;
    create or replace function storage.foldername(p_name text) returns text[]
      language sql immutable as
      $f$ select string_to_array(substring(p_name from 1 for greatest(0, length(p_name) - length(split_part(p_name, '/', -1)) - 1)), '/') $f$;
  `)

  // 1. Schema legado
  let schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8')
  schemaSql = schemaSql
    .replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";/gi, '')
    .replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()')
  await db.exec(schemaSql)
  await db.exec(`alter table public.programacoes add column if not exists modalidade text not null default 'PLANILHA'`)

  // 2. Migration 3.1 (funcoes de identidade usadas pelas policies da Comunidade)
  await db.exec(fs.readFileSync(MIGRATION_31, 'utf8'))

  // 3. Migration 4.1 integral
  await db.exec(fs.readFileSync(MIGRATION_41, 'utf8'))

  // 3b. Migration 4.3 (alunos podem publicar) — incremental, aditiva
  await db.exec(fs.readFileSync(MIGRATION_43, 'utf8'))

  // 4. Seeds
  await db.exec(`
    insert into auth.users (id) values
      ('${AUTH_ADMIN1}'), ('${AUTH_COACH1}'), ('${AUTH_COACH2}'), ('${AUTH_COACH1B}'),
      ('${AUTH_ALUNO1}'), ('${AUTH_ALUNO2}');
    insert into boxes (id, nome, slug, ativo) values
      ('${BOX1}', 'Box Teste 1', 'box-teste-1', true),
      ('${BOX2}', 'Box Teste 2', 'box-teste-2', true);
    insert into usuarios (id, auth_id, box_id, nome, email, role, ativo) values
      ('${USR_ADMIN1}', '${AUTH_ADMIN1}', '${BOX1}', 'Admin Um', 'admin1@t.local', 'admin', true),
      ('${USR_COACH1}', '${AUTH_COACH1}', '${BOX1}', 'Coach Um', 'coach1@t.local', 'coach', true),
      ('${USR_COACH2}', '${AUTH_COACH2}', '${BOX2}', 'Coach Dois', 'coach2@t.local', 'coach', true),
      ('${USR_COACH1B}', '${AUTH_COACH1B}', '${BOX1}', 'Coach Um B', 'coach1b@t.local', 'coach', true),
      ('${USR_ALUNO1}', '${AUTH_ALUNO1}', '${BOX1}', 'Aluno Um', 'aluno1@t.local', 'aluno', true),
      ('${USR_ALUNO2}', '${AUTH_ALUNO2}', '${BOX2}', 'Aluno Dois', 'aluno2@t.local', 'aluno', true);
  `)
}

/* ================================================================
 * TESTES
 * ================================================================ */
async function runTests() {
  console.log('\n=== A. DDL ===')

  await test('A1. Tabelas publicacoes, publicacao_fotos, curtidas, comentarios_feed criadas', async () => {
    const n = await scalar(
      `select count(*) from pg_tables where schemaname='public' and tablename in ('publicacoes','publicacao_fotos','curtidas','comentarios_feed')`
    )
    assert(Number(n) === 4, `esperava 4 tabelas, encontradas ${n}`)
  })

  await test('A2. RLS habilitada nas 4 tabelas', async () => {
    const r = await one(
      `select count(*) filter (where rowsecurity) as com, count(*) as tot
       from pg_tables where schemaname='public' and tablename in ('publicacoes','publicacao_fotos','curtidas','comentarios_feed')`
    )
    assert(Number(r.com) === 4 && Number(r.tot) === 4, 'RLS nao habilitada em todas')
  })

  await test('A3. Indice unico de curtidas existe', async () => {
    const d = await scalar(`select indexdef from pg_indexes where indexname='uq_curtidas_publicacao_autor'`)
    assert(d && d.includes('UNIQUE'), 'indice unico de curtidas nao encontrado')
  })

  await test('A4. Bucket comunidade criado como privado', async () => {
    const r = await one(`select public, file_size_limit from storage.buckets where id='comunidade'`)
    assert(r && r.public === false, 'bucket nao esta privado')
    assert(Number(r.file_size_limit) === 2097152, 'limite de arquivo incorreto')
  })

  console.log('\n=== B. CRIACAO DE PUBLICACOES (admin/coach) ===')

  let pubCoach1, pubAdmin1, pubCoach2

  await test('B1. Coach cria publicacao no proprio box (RASCUNHO, OK)', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'Treino de sabado!') returning id, status`,
      [BOX1, USR_COACH1]
    )
    pubCoach1 = r.rows[0].id
    assert(pubCoach1, 'publicacao nao criada')
    assert(r.rows[0].status === 'RASCUNHO', 'publicacao nao nasceu como RASCUNHO')
    await publicar(pubCoach1)  // necessaria PUBLICADA para os testes seguintes
  })

  await test('B2. Admin cria publicacao no proprio box (RASCUNHO, OK)', async () => {
    await asUser(AUTH_ADMIN1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'Novo WOD postado') returning id, status`,
      [BOX1, USR_ADMIN1]
    )
    pubAdmin1 = r.rows[0].id
    assert(pubAdmin1, 'publicacao nao criada')
    assert(r.rows[0].status === 'RASCUNHO', 'publicacao nao nasceu como RASCUNHO')
    await publicar(pubAdmin1)
  })

  await test('B3. Aluno cria publicacao no proprio box (Etapa 4.3 — RASCUNHO, OK)', async () => {
    // Ate a 4.1 o aluno era bloqueado pela RLS; a migration 4.3 (aditiva)
    // passou a permitir. Este teste foi atualizado para a nova regra.
    await asUser(AUTH_ALUNO1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'tentativa') returning id, status`,
      [BOX1, USR_ALUNO1]
    )
    assert(r.rows[0].status === 'RASCUNHO', 'publicacao do aluno nao nasceu como RASCUNHO')
    // limpeza: nao interferir na contagem de ativas do box (teste D2)
    await asOwner()
    await db.query(`delete from publicacoes where id=$1`, [r.rows[0].id])
  })

  await test('B4. Coach NAO cria publicacao com box_id forjado de outro box', async () => {
    await asUser(AUTH_COACH1)
    await expectError(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'tentativa')`,
      [BOX2, USR_COACH1],
      'row-level security'
    )
  })

  await test('B5. Coach NAO cria publicacao com autor_id de outra pessoa', async () => {
    await asUser(AUTH_COACH1)
    await expectError(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'tentativa')`,
      [BOX1, USR_ADMIN1],
      'row-level security'
    )
  })

  console.log('\n=== C. EDICAO E MODERACAO ===')

  await test('C1. Coach edita a propria publicacao (OK)', async () => {
    await asUser(AUTH_COACH1)
    await db.query(`update publicacoes set legenda='Legenda editada' where id=$1`, [pubCoach1])
    await asOwner()
    const l = await scalar('select legenda from publicacoes where id=$1', [pubCoach1])
    assert(l === 'Legenda editada', 'edicao nao aplicada')
  })

  await test('C2. Coach NAO edita publicacao de outro autor', async () => {
    await asUser(AUTH_COACH1)
    await db.query(`update publicacoes set legenda='hackeado' where id=$1`, [pubAdmin1])
    await asOwner()
    const l = await scalar('select legenda from publicacoes where id=$1', [pubAdmin1])
    assert(l !== 'hackeado', 'coach editou publicacao de outro')
  })

  await test('C3. Admin modera (soft-delete) publicacao do box (OK)', async () => {
    await asUser(AUTH_ADMIN1)
    await db.query(`update publicacoes set ativo=false where id=$1`, [pubCoach1])
    await asOwner()
    const a = await scalar('select ativo from publicacoes where id=$1', [pubCoach1])
    assert(a === false, 'moderacao nao aplicada')
  })

  await test('C4. Publicacao moderada SOME do feed do box', async () => {
    await asUser(AUTH_ALUNO1)
    const n = Number(await scalar('select count(*) from publicacoes where id=$1', [pubCoach1]))
    assert(n === 0, 'publicacao moderada continua visivel')
  })

  await test('C5. Coach do box1 NAO edita publicacao do box2', async () => {
    await asUser(AUTH_COACH2)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'Box2') returning id`,
      [BOX2, USR_COACH2]
    )
    pubCoach2 = r.rows[0].id
    await publicar(pubCoach2)
    await asUser(AUTH_COACH1)
    await db.query(`update publicacoes set legenda='hackeado' where id=$1`, [pubCoach2])
    await asOwner()
    const l = await scalar('select legenda from publicacoes where id=$1', [pubCoach2])
    assert(l === 'Box2', 'coach do box1 editou publicacao do box2')
  })

  console.log('\n=== D. ISOLAMENTO ENTRE BOXES ===')

  await test('D1. Aluno do box1 NAO ve publicacoes do box2', async () => {
    await asUser(AUTH_ALUNO1)
    const n = Number(await scalar('select count(*) from publicacoes where box_id=$1', [BOX2]))
    assert(n === 0, 'aluno do box1 viu publicacoes do box2')
  })

  await test('D2. Aluno do box1 ve apenas publicacoes ATIVAS do proprio box', async () => {
    await asUser(AUTH_ALUNO1)
    const n = Number(await scalar(
      'select count(*) from publicacoes where box_id=$1 and ativo=true',
      [BOX1]
    ))
    assert(n === 1, `esperava 1 ativa (admin), encontradas ${n}`)
  })

  await test('D3. Aluno NAO ve publicacoes moderadas do proprio box', async () => {
    await asUser(AUTH_ALUNO1)
    const n = Number(await scalar(
      'select count(*) from publicacoes where box_id=$1 and ativo=false',
      [BOX1]
    ))
    assert(n === 0, `aluno viu ${n} publicacoes moderadas`)
  })

  console.log('\n=== E. FOTOS (limite de 5) ===')

  let pubFotos

  await test('E1. Insere ate 5 fotos em rascunho (OK)', async () => {
    // INSERT de fotos so e permitido em RASCUNHO — cria um dedicado
    await asUser(AUTH_ADMIN1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'Fotos') returning id`,
      [BOX1, USR_ADMIN1]
    )
    pubFotos = r.rows[0].id
    for (let i = 0; i < 5; i++) {
      await db.query(
        `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, $3)`,
        [pubFotos, `${BOX1}/${pubFotos}/foto${i}.jpg`, i]
      )
    }
    const n = Number(await scalar('select count(*) from publicacao_fotos where publicacao_id=$1', [pubFotos]))
    assert(n === 5, `esperava 5 fotos, inseridas ${n}`)
  })

  await test('E2. 6a foto e BLOQUEADA (PUBLICACAO_MAX_FOTOS)', async () => {
    await asUser(AUTH_ADMIN1)
    await expectError(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 5)`,
      [pubFotos, `${BOX1}/${pubFotos}/foto5.jpg`],
      'PUBLICACAO_MAX_FOTOS'
    )
  })

  await test('E3. Aluno NAO insere foto (RLS bloqueia)', async () => {
    // Publicacao nova (sem fotos) para isolar o teste do limite de 5
    await asUser(AUTH_ADMIN1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'Pub vazia') returning id`,
      [BOX1, USR_ADMIN1]
    )
    const pubVazia = r.rows[0].id
    await publicar(pubVazia)
    await asUser(AUTH_ALUNO1)
    await expectError(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubVazia, `${BOX1}/${pubVazia}/fotoX.jpg`],
      'row-level security'
    )
  })

  console.log('\n=== F. CURTIDAS ===')

  await test('F1. Aluno curte publicacao do proprio box (OK)', async () => {
    await asUser(AUTH_ALUNO1)
    await db.query(
      `insert into curtidas (publicacao_id, autor_id) values ($1, $2)`,
      [pubAdmin1, USR_ALUNO1]
    )
  })

  await test('F2. Curtida duplicada e BLOQUEADA (unique)', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError(
      `insert into curtidas (publicacao_id, autor_id) values ($1, $2)`,
      [pubAdmin1, USR_ALUNO1],
      'uq_curtidas_publicacao_autor'
    )
  })

  await test('F3. Aluno NAO curte publicacao de outro box', async () => {
    await asUser(AUTH_ALUNO2)
    await expectError(
      `insert into curtidas (publicacao_id, autor_id) values ($1, $2)`,
      [pubAdmin1, USR_ALUNO2],
      'row-level security'
    )
  })

  await test('F4. Autor da curtida a remove (OK); outro nao', async () => {
    await asUser(AUTH_COACH1)
    await db.query(
      `insert into curtidas (publicacao_id, autor_id) values ($1, $2)`,
      [pubAdmin1, USR_COACH1]
    )
    await asUser(AUTH_ADMIN1)
    await db.query(
      `delete from curtidas where publicacao_id=$1 and autor_id=$2`,
      [pubAdmin1, USR_COACH1]
    )
    await asOwner()
    let n = Number(await scalar('select count(*) from curtidas where publicacao_id=$1 and autor_id=$2', [pubAdmin1, USR_COACH1]))
    assert(n === 1, 'admin removeu curtida de outro (nao deveria)')
    await asUser(AUTH_COACH1)
    await db.query(`delete from curtidas where publicacao_id=$1 and autor_id=$2`, [pubAdmin1, USR_COACH1])
    await asOwner()
    n = Number(await scalar('select count(*) from curtidas where publicacao_id=$1 and autor_id=$2', [pubAdmin1, USR_COACH1]))
    assert(n === 0, 'autor nao removeu a propria curtida')
  })

  console.log('\n=== G. COMENTARIOS FEED ===')

  await test('G1. Aluno comenta publicacao do proprio box (OK)', async () => {
    await asUser(AUTH_ALUNO1)
    const r = await db.query(
      `insert into comentarios_feed (publicacao_id, autor_id, texto) values ($1, $2, 'Muito bom!') returning id`,
      [pubAdmin1, USR_ALUNO1]
    )
    global.__comentarioAluno = r.rows[0].id
    assert(global.__comentarioAluno, 'comentario nao criado')
  })

  await test('G2. Aluno NAO comenta publicacao de outro box', async () => {
    await asUser(AUTH_ALUNO2)
    await expectError(
      `insert into comentarios_feed (publicacao_id, autor_id, texto) values ($1, $2, 'x')`,
      [pubAdmin1, USR_ALUNO2],
      'row-level security'
    )
  })

  await test('G3. Comentario vazio ou >500 chars e BLOQUEADO', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError(
      `insert into comentarios_feed (publicacao_id, autor_id, texto) values ($1, $2, '')`,
      [pubAdmin1, USR_ALUNO1],
      'chk_comentarios_feed_texto'
    )
  })

  await test('G4. Autor remove o proprio comentario (OK)', async () => {
    await asUser(AUTH_ALUNO1)
    await db.query(`delete from comentarios_feed where id=$1`, [global.__comentarioAluno])
    await asOwner()
    const n = Number(await scalar('select count(*) from comentarios_feed where id=$1', [global.__comentarioAluno]))
    assert(n === 0, 'autor nao removeu o comentario')
  })

  await test('G5. Admin modera comentario (soft-delete) e ele some do feed', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into comentarios_feed (publicacao_id, autor_id, texto) values ($1, $2, 'Comentario do coach') returning id`,
      [pubAdmin1, USR_COACH1]
    )
    const cid = r.rows[0].id
    await asUser(AUTH_ADMIN1)
    await db.query(`update comentarios_feed set ativo=false where id=$1`, [cid])
    await asUser(AUTH_ALUNO1)
    const n = Number(await scalar('select count(*) from comentarios_feed where id=$1', [cid]))
    assert(n === 0, 'comentario moderado continua visivel')
  })

  console.log('\n=== H. STORAGE (stub — sintaxe e logica das policies) ===')

  await test('H1. Coach insere objeto no path do proprio box em rascunho proprio (OK)', async () => {
    // upload exige publicacao EXISTENTE, do mesmo box, NAO PUBLICADA e do autor
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'RascH1') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubH1 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubH1}/foto.jpg`]
    )
  })

  await test('H1b. Upload em publicacao INEXISTENTE e BLOQUEADO', async () => {
    await asUser(AUTH_COACH1)
    await expectError(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/00000000-0000-4000-8000-999999999999/foto.jpg`],
      'row-level security'
    )
  })

  await test('H2. Coach NAO insere objeto no path de outro box', async () => {
    await asUser(AUTH_COACH1)
    await expectError(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX2}/${pubCoach2}/foto.jpg`],
      'row-level security'
    )
  })

  await test('H3. Aluno NAO insere objeto (sem role staff)', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubAdmin1}/foto.jpg`],
      'row-level security'
    )
  })

  await test('H4. Aluno do box1 NAO le objeto do box2', async () => {
    await asUser(AUTH_ALUNO1)
    const n = Number(await scalar(
      `select count(*) from storage.objects where bucket_id='comunidade' and (storage.foldername(name))[1]=$1`,
      [BOX2]
    ))
    assert(n === 0, 'aluno do box1 leu objeto do box2')
  })

  await test('H5. anon SEM acesso as tabelas da comunidade', async () => {
    await asUser(null, 'anon')
    await expectError('select id from publicacoes limit 1', [], 'permission denied')
  })

  console.log('\n=== I. CORRECOES DA REVISAO ===')

  // Reutiliza pubAdmin1 (ativa, do admin, com 5 fotos) e pubCoach2 (box2).
  // Cria publicacoes dedicadas para os testes de manipulacao.
  let pubManip, pubMod

  await test('I1. [Mod] Coach NAO altera ativo (modera) da propria publicacao', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'Manip') returning id`,
      [BOX1, USR_COACH1]
    )
    pubManip = r.rows[0].id
    await publicar(pubManip)  // necessaria PUBLICADA para os testes seguintes
    await asUser(AUTH_COACH1) // publicar() reseta para owner; re-autentica
    await expectError(
      `update publicacoes set ativo=false where id=$1`,
      [pubManip],
      'PUBLICACAO_MODERACAO_ADMIN'
    )
  })

  await test('I2. [Mod] Coach NAO altera ativo de publicacao de outro (policy filtra a row)', async () => {
    // A policy UPDATE so permite coach alterar as PROPRIAS publicacoes; a row
    // da publicacao de outro autor e filtrada (0 linhas afetadas), sem erro.
    await asUser(AUTH_COACH1)
    await db.query(`update publicacoes set ativo=false where id=$1`, [pubAdmin1])
    await asOwner()
    const a = await scalar('select ativo from publicacoes where id=$1', [pubAdmin1])
    assert(a === true, 'coach alterou ativo de publicacao de outro')
  })

  await test('I3. [Imut] Admin NAO altera autor_id de uma publicacao', async () => {
    await asUser(AUTH_ADMIN1)
    await expectError(
      `update publicacoes set autor_id=$2 where id=$1`,
      [pubManip, USR_ADMIN1],
      'PUBLICACAO_AUTOR_IMUTAVEL'
    )
  })

  await test('I4. [Imut] Admin NAO altera box_id de uma publicacao', async () => {
    await asUser(AUTH_ADMIN1)
    await expectError(
      `update publicacoes set box_id=$2 where id=$1`,
      [pubManip, BOX2],
      'PUBLICACAO_BOX_IMUTAVEL'
    )
  })

  await test('I5. [Reat] Coach NAO reativa publicacao moderada (policy filtra a row)', async () => {
    // pubMod e do admin; a policy UPDATE so permite coach alterar as PROPRIAS
    // publicacoes, entao a row e filtrada (0 linhas afetadas), sem erro.
    await asUser(AUTH_ADMIN1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'Mod') returning id`,
      [BOX1, USR_ADMIN1]
    )
    pubMod = r.rows[0].id
    await publicar(pubMod)  // necessaria PUBLICADA para moderar
    await db.query(`update publicacoes set ativo=false where id=$1`, [pubMod])
    await asUser(AUTH_COACH1)
    await db.query(`update publicacoes set ativo=true where id=$1`, [pubMod])
    await asOwner()
    const a = await scalar('select ativo from publicacoes where id=$1', [pubMod])
    assert(a === false, 'coach reativou publicacao moderada')
  })

  await test('I6. [Reat] Admin reativa publicacao moderada (OK)', async () => {
    await asUser(AUTH_ADMIN1)
    await db.query(`update publicacoes set ativo=true where id=$1`, [pubMod])
    await asOwner()
    const a = await scalar('select ativo from publicacoes where id=$1', [pubMod])
    assert(a === true, 'admin nao reativou')
  })

  await test('I7. [Fotos] Ordem duplicada na mesma publicacao e BLOQUEADA', async () => {
    // publicacao nova (RASCUNHO) com 1 foto (ordem 0); a 2a insercao com a
    // mesma ordem deve cair na UNIQUE (RASCUNHO permite INSERT de fotos).
    await asUser(AUTH_ADMIN1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'OrdemDup') returning id`,
      [BOX1, USR_ADMIN1]
    )
    const pubOrdem = r.rows[0].id
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubOrdem, `${BOX1}/${pubOrdem}/foto0.jpg`]
    )
    await expectError(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubOrdem, `${BOX1}/${pubOrdem}/foto0b.jpg`],
      'uq_publicacao_fotos_publicacao_ordem'
    )
  })

  await test('I8. [Fotos] Mesmo storage_path em outra publicacao e BLOQUEADO', async () => {
    // dois rascunhos; o 2o tenta reusar o storage_path do 1o -> UNIQUE
    await asUser(AUTH_ADMIN1)
    const r1 = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'PathA') returning id`,
      [BOX1, USR_ADMIN1]
    )
    const pubA = r1.rows[0].id
    const r2 = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'PathB') returning id`,
      [BOX1, USR_ADMIN1]
    )
    const pubB = r2.rows[0].id
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubA, `${BOX1}/${pubA}/compartilhada.jpg`]
    )
    await expectError(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubB, `${BOX1}/${pubA}/compartilhada.jpg`],
      'uq_publicacao_fotos_storage_path'
    )
  })

  await test('I9. [Stor] Coach NAO deleta objeto da publicacao de OUTRO coach', async () => {
    // coach1 cria rascunho e faz upload; coach1b tenta deletar o objeto -> negado
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'I9') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubI9 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubI9}/foto.jpg`]
    )
    await asUser(AUTH_COACH1B)
    await db.query(
      `delete from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubI9}/foto.jpg`]
    )
    await asOwner()
    const n = Number(await scalar(
      `select count(*) from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubI9}/foto.jpg`]
    ))
    assert(n === 1, 'coach deletou objeto de outro coach')
  })

  await test('I10. [Stor] Autor (coach) deleta objeto da propria publicacao (OK)', async () => {
    // cria um rascunho, faz upload (policy INSERT exige rascunho), depois deleta
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'I10') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubI10 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubI10}/foto-coach.jpg`]
    )
    await db.query(
      `delete from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubI10}/foto-coach.jpg`]
    )
    await asOwner()
    const n = Number(await scalar(
      `select count(*) from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubI10}/foto-coach.jpg`]
    ))
    assert(n === 0, 'autor nao deletou objeto da propria publicacao')
  })

  await test('I11. [Stor] Admin deleta objeto da publicacao de outro (OK — moderacao)', async () => {
    // coach cria rascunho e faz upload; admin deleta o objeto (moderacao).
    // Admin NAO pode fazer upload em rascunho alheio (INSERT exige autoria).
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'I11') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubI11 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubI11}/foto-admin-del.jpg`]
    )
    await asUser(AUTH_ADMIN1)
    await db.query(
      `delete from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubI11}/foto-admin-del.jpg`]
    )
    await asOwner()
    const n = Number(await scalar(
      `select count(*) from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubI11}/foto-admin-del.jpg`]
    ))
    assert(n === 0, 'admin nao deletou objeto de publicacao de outro')
  })

  await test('I11b. [Stor] Admin NAO faz upload em rascunho alheio', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'I11b') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubI11b = r.rows[0].id
    await asUser(AUTH_ADMIN1)
    await expectError(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubI11b}/foto-admin-up.jpg`],
      'row-level security'
    )
  })

  await test('I12. [Stor] Aluno NAO le objeto de publicacao INATIVA', async () => {
    // insere objeto como owner (bypass), modera a publicacao e verifica que o
    // aluno nao le o path dela
    await asOwner()
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubManip}/foto-mod.jpg`]
    )
    await asUser(AUTH_ADMIN1)
    await db.query(`update publicacoes set ativo=false where id=$1`, [pubManip])
    await asUser(AUTH_ALUNO1)
    const n = Number(await scalar(
      `select count(*) from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubManip}/foto-mod.jpg`]
    ))
    assert(n === 0, 'aluno leu objeto de publicacao inativa')
  })

  await test('I13. [Stor] Staff LE objeto de publicacao INATIVA (para moderar)', async () => {
    await asUser(AUTH_ADMIN1)
    const n = Number(await scalar(
      `select count(*) from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubManip}/foto-mod.jpg`]
    ))
    assert(n === 1, 'admin nao leu objeto de publicacao inativa')
  })

  await test('I14. [Coment] Admin NAO altera autor_id de um comentario', async () => {
    await asUser(AUTH_ADMIN1)
    const r = await db.query(
      `insert into comentarios_feed (publicacao_id, autor_id, texto) values ($1, $2, 'Comentario') returning id`,
      [pubAdmin1, USR_ADMIN1]
    )
    const cid = r.rows[0].id
    await expectError(
      `update comentarios_feed set autor_id=$2 where id=$1`,
      [cid, USR_COACH1],
      'COMENTARIO_AUTOR_IMUTAVEL'
    )
  })

  await test('I15. [Coment] Admin NAO altera publicacao_id de um comentario', async () => {
    await asUser(AUTH_ADMIN1)
    const r = await db.query(
      `insert into comentarios_feed (publicacao_id, autor_id, texto) values ($1, $2, 'Outro') returning id`,
      [pubAdmin1, USR_ADMIN1]
    )
    const cid = r.rows[0].id
    await expectError(
      `update comentarios_feed set publicacao_id=$2 where id=$1`,
      [cid, pubCoach2],
      'COMENTARIO_PUBLICACAO_IMUTAVEL'
    )
  })

  await test('I16. [Coment] Coach NAO modera comentario (update policy admin-only)', async () => {
    await asUser(AUTH_ADMIN1)
    const r = await db.query(
      `insert into comentarios_feed (publicacao_id, autor_id, texto) values ($1, $2, 'P/ moderar') returning id`,
      [pubAdmin1, USR_ADMIN1]
    )
    const cid = r.rows[0].id
    await asUser(AUTH_COACH1)
    await db.query(`update comentarios_feed set ativo=false where id=$1`, [cid])
    await asOwner()
    const a = await scalar('select ativo from comentarios_feed where id=$1', [cid])
    assert(a === true, 'coach moderou comentario')
  })

  console.log('\n=== J. FLUXO RASCUNHO -> PUBLICADA ===')

  await test('J1. Rascunho e INVISIVEL a alunos do mesmo box', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'RascJ1') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubJ1 = r.rows[0].id
    await asUser(AUTH_ALUNO1)
    const n = Number(await scalar('select count(*) from publicacoes where id=$1', [pubJ1]))
    assert(n === 0, 'aluno viu rascunho')
  })

  await test('J2. Autor VE o proprio rascunho; admin VE rascunho alheio', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'RascJ2') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubJ2 = r.rows[0].id
    const nCoach = Number(await scalar('select count(*) from publicacoes where id=$1', [pubJ2]))
    assert(nCoach === 1, 'autor nao viu o proprio rascunho')
    await asUser(AUTH_ADMIN1)
    const nAdmin = Number(await scalar('select count(*) from publicacoes where id=$1', [pubJ2]))
    assert(nAdmin === 1, 'admin nao viu rascunho alheio')
  })

  await test('J3. Aluno NAO ve fotos de rascunho (publicacao_fotos)', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'RascJ3') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubJ3 = r.rows[0].id
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubJ3, `${BOX1}/${pubJ3}/f.jpg`]
    )
    await asUser(AUTH_ALUNO1)
    const n = Number(await scalar(
      'select count(*) from publicacao_fotos where publicacao_id=$1', [pubJ3]
    ))
    assert(n === 0, 'aluno viu foto de rascunho')
  })

  await test('J4. Aluno NAO le objeto de storage de rascunho', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'RascJ4') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubJ4 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubJ4}/f.jpg`]
    )
    await asUser(AUTH_ALUNO1)
    const n = Number(await scalar(
      `select count(*) from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubJ4}/f.jpg`]
    ))
    assert(n === 0, 'aluno leu objeto de rascunho')
  })

  await test('J5. Publicar (RASCUNHO->PUBLICADA) pelo autor (OK)', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'RascJ5') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubJ5 = r.rows[0].id
    await db.query(`update publicacoes set status='PUBLICADA' where id=$1`, [pubJ5])
    await asOwner()
    const st = await scalar('select status from publicacoes where id=$1', [pubJ5])
    assert(st === 'PUBLICADA', 'autor nao publicou')
  })

  await test('J6. Transicao PUBLICADA->RASCUNHO e BLOQUEADA', async () => {
    await asUser(AUTH_COACH1)
    await expectError(
      `update publicacoes set status='RASCUNHO' where id=$1`,
      [pubCoach1],
      'PUBLICACAO_STATUS_INVALIDO'
    )
  })

  await test('J7. Upload INTERROMPIDO: rascunho com fotos pode ser cancelado', async () => {
    // Simula upload parcial: rascunho com 1 foto e 1 objeto no storage
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'RascJ7') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubJ7 = r.rows[0].id
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubJ7, `${BOX1}/${pubJ7}/f.jpg`]
    )
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubJ7}/f.jpg`]
    )
    // Cancela: remove objeto do storage + DELETE do rascunho (fotos em cascata)
    await db.query(
      `delete from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubJ7}/f.jpg`]
    )
    await db.query(`delete from publicacoes where id=$1`, [pubJ7])
    await asOwner()
    const nPub = Number(await scalar('select count(*) from publicacoes where id=$1', [pubJ7]))
    const nFoto = Number(await scalar('select count(*) from publicacao_fotos where publicacao_id=$1', [pubJ7]))
    const nObj = Number(await scalar(`select count(*) from storage.objects where name=$1`, [`${BOX1}/${pubJ7}/f.jpg`]))
    assert(nPub === 0 && nFoto === 0 && nObj === 0, 'cancelamento nao limpou tudo')
  })

  await test('J8. Coach NAO cancela rascunho de OUTRO coach', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'RascJ8') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubJ8 = r.rows[0].id
    await asUser(AUTH_COACH1B)
    await db.query(`delete from publicacoes where id=$1`, [pubJ8])
    await asOwner()
    const n = Number(await scalar('select count(*) from publicacoes where id=$1', [pubJ8]))
    assert(n === 1, 'coach cancelou rascunho de outro')
  })

  await test('J9. Coach NAO faz upload em publicacao (rascunho) de OUTRO coach', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'RascJ9') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubJ9 = r.rows[0].id
    await asUser(AUTH_COACH1B)
    await expectError(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubJ9}/f.jpg`],
      'row-level security'
    )
  })

  await test('J10. NAO insere foto em publicacao PUBLICADA', async () => {
    await asUser(AUTH_ADMIN1)
    await expectError(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubAdmin1, `${BOX1}/${pubAdmin1}/nova.jpg`],
      'row-level security'
    )
  })

  await test('J11. Rascunho NAO pode ser moderado (ativo) — cancele com DELETE', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'RascJ11') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubJ11 = r.rows[0].id
    await asUser(AUTH_ADMIN1)
    await expectError(
      `update publicacoes set ativo=false where id=$1`,
      [pubJ11],
      'PUBLICACAO_MODERACAO_RASCUNHO'
    )
  })

  await test('J12. Publicacao sem legenda usa default vazio (OK)', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id) values ($1, $2) returning legenda, status`,
      [BOX1, USR_COACH1]
    )
    assert(r.rows[0].legenda === '' && r.rows[0].status === 'RASCUNHO', 'defaults incorretos')
  })

  console.log('\n=== K. CORRECOES FINAIS (cancelamento, protecao, validacao) ===')

  await test('K1. [Cancel] DELETE de rascunho COM arquivos no storage e BLOQUEADO', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'K1') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubK1 = r.rows[0].id
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubK1, `${BOX1}/${pubK1}/f.jpg`]
    )
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubK1}/f.jpg`]
    )
    // tenta excluir o rascunho SEM remover o arquivo -> trigger bloqueia
    await expectError(
      `delete from publicacoes where id=$1`,
      [pubK1],
      'RASCUNHO_COM_ARQUIVOS'
    )
  })

  await test('K2. [Cancel] Remover arquivo do storage + DELETE do rascunho (OK)', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'K2') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubK2 = r.rows[0].id
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubK2, `${BOX1}/${pubK2}/f.jpg`]
    )
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubK2}/f.jpg`]
    )
    // ordem correta: storage primeiro, depois o rascunho
    await db.query(
      `delete from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubK2}/f.jpg`]
    )
    await db.query(`delete from publicacoes where id=$1`, [pubK2])
    await asOwner()
    const nPub = Number(await scalar('select count(*) from publicacoes where id=$1', [pubK2]))
    const nFoto = Number(await scalar('select count(*) from publicacao_fotos where publicacao_id=$1', [pubK2]))
    const nObj = Number(await scalar(`select count(*) from storage.objects where name=$1`, [`${BOX1}/${pubK2}/f.jpg`]))
    assert(nPub === 0 && nFoto === 0 && nObj === 0, 'cancelamento nao limpou tudo')
  })

  await test('K3. [Cancel] Rascunho SEM arquivos pode ser excluido direto (OK)', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'K3') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubK3 = r.rows[0].id
    await db.query(`delete from publicacoes where id=$1`, [pubK3])
    await asOwner()
    const n = Number(await scalar('select count(*) from publicacoes where id=$1', [pubK3]))
    assert(n === 0, 'rascunho sem arquivos nao foi excluido')
  })

  await test('K4. [Protecao] Coach NAO atualiza (UPDATE) arquivo de publicacao PUBLICADA', async () => {
    // cria rascunho, faz upload, publica; depois tenta UPDATE do objeto -> negado
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'K4') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubK4 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubK4}/f.jpg`]
    )
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubK4, `${BOX1}/${pubK4}/f.jpg`]
    )
    await publicar(pubK4)
    await asUser(AUTH_COACH1)
    await db.query(
      `update storage.objects set name=$1 where bucket_id='comunidade' and name=$2`,
      [`${BOX1}/${pubK4}/f-substituida.jpg`, `${BOX1}/${pubK4}/f.jpg`]
    )
    await asOwner()
    const n = Number(await scalar(
      `select count(*) from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubK4}/f-substituida.jpg`]
    ))
    assert(n === 0, 'coach substituiu arquivo de publicacao publicada')
  })

  await test('K5. [Protecao] Coach NAO deleta arquivo de publicacao PUBLICADA propria', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'K5') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubK5 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubK5}/f.jpg`]
    )
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubK5, `${BOX1}/${pubK5}/f.jpg`]
    )
    await publicar(pubK5)
    await asUser(AUTH_COACH1)
    await db.query(
      `delete from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubK5}/f.jpg`]
    )
    await asOwner()
    const n = Number(await scalar(
      `select count(*) from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubK5}/f.jpg`]
    ))
    assert(n === 1, 'coach deletou arquivo de publicacao publicada')
  })

  await test('K6. [Protecao] Admin remove arquivo de publicada: exige MODERAR antes (OK)', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'K6') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubK6 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubK6}/f.jpg`]
    )
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubK6, `${BOX1}/${pubK6}/f.jpg`]
    )
    await publicar(pubK6)
    // publica ativa com foto registrada: DELETE do objeto e bloqueado
    await asUser(AUTH_ADMIN1)
    await expectError(
      `delete from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubK6}/f.jpg`],
      'STORAGE_VINCULO_PUBLICADA'
    )
    // fluxo administrativo correto: moderar -> remover objeto -> excluir linha
    await db.query(`update publicacoes set ativo=false where id=$1`, [pubK6])
    await db.query(
      `delete from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubK6}/f.jpg`]
    )
    await db.query(`delete from publicacao_fotos where publicacao_id=$1`, [pubK6])
    await asOwner()
    const nObj = Number(await scalar(
      `select count(*) from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubK6}/f.jpg`]
    ))
    const nFoto = Number(await scalar(
      `select count(*) from publicacao_fotos where publicacao_id=$1`, [pubK6]
    ))
    assert(nObj === 0 && nFoto === 0, 'remocao administrativa nao concluiu consistente')
  })

  await test('K7. [Validacao] Publicar com foto SEM objeto no storage e BLOQUEADO', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'K7') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubK7 = r.rows[0].id
    // registra a foto mas NAO faz o upload do objeto
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubK7, `${BOX1}/${pubK7}/f-ausente.jpg`]
    )
    await expectError(
      `update publicacoes set status='PUBLICADA' where id=$1`,
      [pubK7],
      'PUBLICACAO_UPLOAD_INCOMPLETO'
    )
  })

  await test('K8. [Validacao] Publicar com fotos COMPLETAS (objeto existe) (OK)', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'K8') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubK8 = r.rows[0].id
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubK8, `${BOX1}/${pubK8}/f.jpg`]
    )
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubK8}/f.jpg`]
    )
    await db.query(`update publicacoes set status='PUBLICADA' where id=$1`, [pubK8])
    await asOwner()
    const st = await scalar('select status from publicacoes where id=$1', [pubK8])
    assert(st === 'PUBLICADA', 'publicacao com fotos completas nao foi publicada')
  })

  await test('K9. [Validacao] Upload INCOMPLETO (2 fotos registradas, 1 objeto) bloqueia publicar', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'K9') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubK9 = r.rows[0].id
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0), ($1, $3, 1)`,
      [pubK9, `${BOX1}/${pubK9}/f0.jpg`, `${BOX1}/${pubK9}/f1.jpg`]
    )
    // so 1 dos 2 objetos foi enviado
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubK9}/f0.jpg`]
    )
    await expectError(
      `update publicacoes set status='PUBLICADA' where id=$1`,
      [pubK9],
      'PUBLICACAO_UPLOAD_INCOMPLETO'
    )
  })

  await test('K10. [Validacao] Publicar rascunho SEM fotos (OK)', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'K10') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubK10 = r.rows[0].id
    await db.query(`update publicacoes set status='PUBLICADA' where id=$1`, [pubK10])
    await asOwner()
    const st = await scalar('select status from publicacoes where id=$1', [pubK10])
    assert(st === 'PUBLICADA', 'rascunho sem fotos nao foi publicado')
  })

  console.log('\n=== L. INTEGRIDADE STORAGE x PUBLICACAO_FOTOS (prefixo exato) ===')

  await test('L1. [Cancel] Rascunho com objeto NAO registrado no prefixo BLOQUEIA DELETE', async () => {
    // Simula: upload concluido mas INSERT da foto falhou — objeto sem registro
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'L1') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubL1 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubL1}/nao-registrada.jpg`]
    )
    // sem nenhuma linha em publicacao_fotos — o prefixo ainda tem objeto
    await expectError(
      `delete from publicacoes where id=$1`,
      [pubL1],
      'RASCUNHO_COM_ARQUIVOS'
    )
  })

  await test('L2. [Cancel] Removido o objeto nao registrado, DELETE do rascunho (OK)', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'L2') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubL2 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubL2}/nao-registrada.jpg`]
    )
    await db.query(
      `delete from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubL2}/nao-registrada.jpg`]
    )
    await db.query(`delete from publicacoes where id=$1`, [pubL2])
    await asOwner()
    const n = Number(await scalar('select count(*) from publicacoes where id=$1', [pubL2]))
    assert(n === 0, 'rascunho nao foi excluido apos limpar objeto nao registrado')
  })

  await test('L3. [Publish] Arquivo EXTRA no prefixo (sem registro) BLOQUEIA publicar', async () => {
    // 1 foto registrada com objeto + 1 objeto extra sem registro
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'L3') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubL3 = r.rows[0].id
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubL3, `${BOX1}/${pubL3}/f0.jpg`]
    )
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1), ('comunidade', $2)`,
      [`${BOX1}/${pubL3}/f0.jpg`, `${BOX1}/${pubL3}/extra.jpg`]
    )
    await expectError(
      `update publicacoes set status='PUBLICADA' where id=$1`,
      [pubL3],
      'PUBLICACAO_ARQUIVO_SEM_REGISTRO'
    )
  })

  await test('L4. [Publish] Registrado o arquivo extra, publicar (OK)', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'L4') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubL4 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1), ('comunidade', $2)`,
      [`${BOX1}/${pubL4}/f0.jpg`, `${BOX1}/${pubL4}/extra.jpg`]
    )
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0), ($1, $3, 1)`,
      [pubL4, `${BOX1}/${pubL4}/f0.jpg`, `${BOX1}/${pubL4}/extra.jpg`]
    )
    await db.query(`update publicacoes set status='PUBLICADA' where id=$1`, [pubL4])
    await asOwner()
    const st = await scalar('select status from publicacoes where id=$1', [pubL4])
    assert(st === 'PUBLICADA', 'publicacao com todos os arquivos registrados nao foi publicada')
  })

  await test('L5. [Falha INSERT] Upload OK mas foto sem INSERT — publicar BLOQUEADO, cancelar exige limpar', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'L5') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubL5 = r.rows[0].id
    // upload concluido, INSERT da foto falhou -> nada registrado
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubL5}/nao-registrada.jpg`]
    )
    // publicar bloqueado (arquivo sem registro)
    await expectError(
      `update publicacoes set status='PUBLICADA' where id=$1`,
      [pubL5],
      'PUBLICACAO_ARQUIVO_SEM_REGISTRO'
    )
    // cancelar tambem bloqueado ate limpar o storage
    await expectError(
      `delete from publicacoes where id=$1`,
      [pubL5],
      'RASCUNHO_COM_ARQUIVOS'
    )
    // limpa e cancela com sucesso
    await db.query(
      `delete from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubL5}/nao-registrada.jpg`]
    )
    await db.query(`delete from publicacoes where id=$1`, [pubL5])
    await asOwner()
    const n = Number(await scalar('select count(*) from publicacoes where id=$1', [pubL5]))
    assert(n === 0, 'cancelamento apos limpeza falhou')
  })

  await test('L6. [Prefixo] Registrar path de OUTRA publicacao BLOQUEIA publicar', async () => {
    // duas publicacoes do mesmo autor; pubB registra path de pubA
    await asUser(AUTH_COACH1)
    const rA = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'L6A') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubA = rA.rows[0].id
    const rB = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'L6B') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubB = rB.rows[0].id
    // objeto existe no path de pubA...
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubA}/f.jpg`]
    )
    // ...mas pubB tenta registra-lo como propria foto
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubB, `${BOX1}/${pubA}/f.jpg`]
    )
    await expectError(
      `update publicacoes set status='PUBLICADA' where id=$1`,
      [pubB],
      'PUBLICACAO_PATH_INVALIDO'
    )
  })

  await test('L7. [Prefixo] Objeto em publicacao DIFERENTE nao interfere ao publicar', async () => {
    // pubA (publicada) tem objeto; pubB (sem fotos) publica sem erro —
    // o prefixo exato nao captura objetos de outra publicacao
    await asUser(AUTH_COACH1)
    const rA = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'L7A') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubA = rA.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubA}/f.jpg`]
    )
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubA, `${BOX1}/${pubA}/f.jpg`]
    )
    await db.query(`update publicacoes set status='PUBLICADA' where id=$1`, [pubA])

    const rB = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'L7B') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubB = rB.rows[0].id
    await db.query(`update publicacoes set status='PUBLICADA' where id=$1`, [pubB])
    await asOwner()
    const st = await scalar('select status from publicacoes where id=$1', [pubB])
    assert(st === 'PUBLICADA', 'objeto de outra publicacao bloqueou indevidamente a publicacao')
  })

  console.log('\n=== M. AUDITORIA CONSOLIDADA (imutabilidade, guard, visibilidade) ===')

  await test('M1. [Imut] id de publicacao NAO pode ser alterado (nem admin)', async () => {
    await asUser(AUTH_ADMIN1)
    await expectError(
      `update publicacoes set id='00000000-0000-4000-8000-00000000dead' where id=$1`,
      [pubAdmin1],
      'PUBLICACAO_ID_IMUTAVEL'
    )
  })

  await test('M2. [Imut] created_at de publicacao NAO pode ser alterado (nem admin)', async () => {
    await asUser(AUTH_ADMIN1)
    await expectError(
      `update publicacoes set created_at=created_at - interval '1 year' where id=$1`,
      [pubAdmin1],
      'PUBLICACAO_CREATED_AT_IMUTAVEL'
    )
  })

  await test('M3. [Fotos] Coach NAO exclui registro de foto de publicacao PUBLICADA MODERADA', async () => {
    // publica, registra foto, publica e modera; coach tenta excluir a linha -> negado
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'M3') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubM3 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubM3}/f.jpg`]
    )
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubM3, `${BOX1}/${pubM3}/f.jpg`]
    )
    await publicar(pubM3)
    await asUser(AUTH_ADMIN1)
    await db.query(`update publicacoes set ativo=false where id=$1`, [pubM3])
    await asUser(AUTH_COACH1)
    await db.query(`delete from publicacao_fotos where publicacao_id=$1`, [pubM3])
    await asOwner()
    const n = Number(await scalar(
      'select count(*) from publicacao_fotos where publicacao_id=$1', [pubM3]
    ))
    assert(n === 1, 'coach excluiu foto de publicacao moderada')
  })

  await test('M4. [Fotos] Coach exclui foto do PROPRIO rascunho apos remover arquivo (OK)', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'M4') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubM4 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubM4}/f.jpg`]
    )
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubM4, `${BOX1}/${pubM4}/f.jpg`]
    )
    // exclui a linha SEM remover o arquivo -> guard bloqueia
    await expectError(
      `delete from publicacao_fotos where publicacao_id=$1`,
      [pubM4],
      'FOTO_COM_ARQUIVO'
    )
    // ordem correta: objeto primeiro, linha depois
    await db.query(
      `delete from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubM4}/f.jpg`]
    )
    await db.query(`delete from publicacao_fotos where publicacao_id=$1`, [pubM4])
    await asOwner()
    const n = Number(await scalar(
      'select count(*) from publicacao_fotos where publicacao_id=$1', [pubM4]
    ))
    assert(n === 0, 'coach nao conseguiu excluir foto do proprio rascunho')
  })

  await test('M5. [Fotos] Admin NAO exclui linha de foto com arquivo ainda no storage', async () => {
    // consistencia administrativa: mesmo o admin deve remover o arquivo antes
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'M5') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubM5 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubM5}/f.jpg`]
    )
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubM5, `${BOX1}/${pubM5}/f.jpg`]
    )
    await asUser(AUTH_ADMIN1)
    await expectError(
      `delete from publicacao_fotos where publicacao_id=$1`,
      [pubM5],
      'FOTO_COM_ARQUIVO'
    )
  })

  await test('M6. [Stor] Renomear objeto (UPDATE name) BLOQUEADO para coach', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'M6') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubM6 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubM6}/f.jpg`]
    )
    await expectError(
      `update storage.objects set name=$1 where bucket_id='comunidade' and name=$2`,
      [`${BOX1}/${pubM6}/f-renomeada.jpg`, `${BOX1}/${pubM6}/f.jpg`],
      'STORAGE_PATH_IMUTAVEL'
    )
  })

  await test('M7. [Stor] Renomear objeto BLOQUEADO tambem para admin', async () => {
    await asUser(AUTH_ADMIN1)
    await expectError(
      `update storage.objects set name='novo.jpg' where bucket_id='comunidade'`,
      [],
      'STORAGE_PATH_IMUTAVEL'
    )
  })

  await test('M8. [Stor] Upload do 6o objeto no mesmo prefixo BLOQUEADO (sem registro)', async () => {
    // upload excessivo: 6 objetos no prefixo mesmo sem linhas em publicacao_fotos
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'M8') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubM8 = r.rows[0].id
    for (let i = 0; i < 5; i++) {
      await db.query(
        `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
        [`${BOX1}/${pubM8}/f${i}.jpg`]
      )
    }
    await expectError(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubM8}/f5.jpg`],
      'STORAGE_MAX_FOTOS'
    )
  })

  await test('M9. [Stor] Objeto de publicada ATIVA nao pode ser removido NEM pelo admin (sem moderar)', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'M9') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubM9 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubM9}/f.jpg`]
    )
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubM9, `${BOX1}/${pubM9}/f.jpg`]
    )
    await db.query(`update publicacoes set status='PUBLICADA' where id=$1`, [pubM9])
    await asUser(AUTH_ADMIN1)
    await expectError(
      `delete from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubM9}/f.jpg`],
      'STORAGE_VINCULO_PUBLICADA'
    )
  })

  await test('M10. [Coment] id de comentario NAO pode ser alterado (nem admin)', async () => {
    await asUser(AUTH_ADMIN1)
    const r = await db.query(
      `insert into comentarios_feed (publicacao_id, autor_id, texto) values ($1, $2, 'M10') returning id`,
      [pubAdmin1, USR_ADMIN1]
    )
    const cid = r.rows[0].id
    await expectError(
      `update comentarios_feed set id='00000000-0000-4000-8000-00000000beef' where id=$1`,
      [cid],
      'COMENTARIO_ID_IMUTAVEL'
    )
  })

  await test('M11. [Coment] texto de comentario NAO pode ser alterado (nem admin)', async () => {
    // aluno nem passa pela RLS (UPDATE e admin-only); o teste exercita o caso
    // em que a RLS permite (admin) e o trigger deve bloquear a edicao do texto.
    await asUser(AUTH_ADMIN1)
    const r = await db.query(
      `insert into comentarios_feed (publicacao_id, autor_id, texto) values ($1, $2, 'original') returning id`,
      [pubAdmin1, USR_ADMIN1]
    )
    const cid = r.rows[0].id
    await expectError(
      `update comentarios_feed set texto='editado' where id=$1`,
      [cid],
      'COMENTARIO_TEXTO_IMUTAVEL'
    )
  })

  await test('M12. [Coment] created_at de comentario NAO pode ser alterado (nem admin)', async () => {
    await asUser(AUTH_ADMIN1)
    const r = await db.query(
      `insert into comentarios_feed (publicacao_id, autor_id, texto) values ($1, $2, 'M12') returning id`,
      [pubAdmin1, USR_ADMIN1]
    )
    const cid = r.rows[0].id
    await expectError(
      `update comentarios_feed set created_at=created_at - interval '1 month' where id=$1`,
      [cid],
      'COMENTARIO_CREATED_AT_IMUTAVEL'
    )
  })

  await test('M13. [Vis] Aluno NAO ve curtidas de publicacao MODERADA', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'M13') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubM13 = r.rows[0].id
    await publicar(pubM13)
    await asUser(AUTH_ALUNO1)
    await db.query(
      `insert into curtidas (publicacao_id, autor_id) values ($1, $2)`,
      [pubM13, USR_ALUNO1]
    )
    await asUser(AUTH_ADMIN1)
    await db.query(`update publicacoes set ativo=false where id=$1`, [pubM13])
    await asUser(AUTH_ALUNO1)
    const n = Number(await scalar(
      'select count(*) from curtidas where publicacao_id=$1', [pubM13]
    ))
    assert(n === 0, 'aluno viu curtidas de publicacao moderada')
    // staff continua vendo (moderacao)
    await asUser(AUTH_ADMIN1)
    const nStaff = Number(await scalar(
      'select count(*) from curtidas where publicacao_id=$1', [pubM13]
    ))
    assert(nStaff === 1, 'staff nao ve curtidas de publicacao moderada')
  })

  await test('M14. [Vis] Aluno NAO ve comentarios de publicacao MODERADA', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'M14') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubM14 = r.rows[0].id
    await publicar(pubM14)
    await asUser(AUTH_ALUNO1)
    const c = await db.query(
      `insert into comentarios_feed (publicacao_id, autor_id, texto) values ($1, $2, 'coment') returning id`,
      [pubM14, USR_ALUNO1]
    )
    const cid = c.rows[0].id
    await asUser(AUTH_ADMIN1)
    await db.query(`update publicacoes set ativo=false where id=$1`, [pubM14])
    await asUser(AUTH_ALUNO1)
    const n = Number(await scalar(
      'select count(*) from comentarios_feed where id=$1', [cid]
    ))
    assert(n === 0, 'aluno viu comentario de publicacao moderada')
    // staff continua vendo (moderacao)
    await asUser(AUTH_ADMIN1)
    const nStaff = Number(await scalar(
      'select count(*) from comentarios_feed where id=$1', [cid]
    ))
    assert(nStaff === 1, 'staff nao ve comentario de publicacao moderada')
  })

  await test('M15. [Vis] Coach NAO le objeto de rascunho de OUTRO coach (mesmo box)', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'M15') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubM15 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubM15}/f.jpg`]
    )
    await asUser(AUTH_COACH1B)
    const n = Number(await scalar(
      `select count(*) from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubM15}/f.jpg`]
    ))
    assert(n === 0, 'coach leu objeto de rascunho de outro coach')
    // mas o ADMIN do box ve (gestao de rascunhos)
    await asUser(AUTH_ADMIN1)
    const nAdmin = Number(await scalar(
      `select count(*) from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubM15}/f.jpg`]
    ))
    assert(nAdmin === 1, 'admin nao ve objeto de rascunho alheio')
  })

  await test('M16. [Cross] Coach do box2 NAO faz upload em rascunho do box1', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'M16') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubM16 = r.rows[0].id
    await asUser(AUTH_COACH2)
    await expectError(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubM16}/f.jpg`],
      'row-level security'
    )
  })

  console.log('\n=== N. PUBLICACOES DE ALUNOS (Etapa 4.3) ===')

  await test('N1. Aluno NAO cria publicacao com box_id de outro box', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'cross-box')`,
      [BOX2, USR_ALUNO1],
      'row-level security'
    )
  })

  await test('N2. Aluno NAO cria publicacao com autor_id de outra pessoa', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'autor forjado')`,
      [BOX1, USR_COACH1],
      'row-level security'
    )
  })

  await test('N3. Aluno NAO cria publicacao ja como PUBLICADA (deve nascer RASCUNHO)', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError(
      `insert into publicacoes (box_id, autor_id, legenda, status) values ($1, $2, 'direto', 'PUBLICADA')`,
      [BOX1, USR_ALUNO1],
      'row-level security'
    )
  })

  let pubAluno1

  await test('N4. Fluxo completo do aluno: rascunho + upload + foto + PUBLICAR (OK)', async () => {
    await asUser(AUTH_ALUNO1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'Meu treino de hoje!') returning id`,
      [BOX1, USR_ALUNO1]
    )
    pubAluno1 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubAluno1}/foto0.jpg`]
    )
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubAluno1, `${BOX1}/${pubAluno1}/foto0.jpg`]
    )
    await db.query(`update publicacoes set status='PUBLICADA' where id=$1`, [pubAluno1])
    await asOwner()
    const s = await scalar('select status from publicacoes where id=$1', [pubAluno1])
    assert(s === 'PUBLICADA', 'aluno nao conseguiu publicar o proprio rascunho')
  })

  await test('N5. Publicacao do aluno aparece para os demais do box (feed)', async () => {
    await asUser(AUTH_COACH1)
    const n = Number(await scalar('select count(*) from publicacoes where id=$1', [pubAluno1]))
    assert(n === 1, 'coach nao viu a publicacao publicada do aluno')
    await asUser(AUTH_ADMIN1)
    const nAdmin = Number(await scalar('select count(*) from publicacoes where id=$1', [pubAluno1]))
    assert(nAdmin === 1, 'admin nao viu a publicacao publicada do aluno')
  })

  await test('N6. Aluno edita a legenda da PROPRIA publicacao publicada (OK)', async () => {
    await asUser(AUTH_ALUNO1)
    await db.query(`update publicacoes set legenda='Legenda editada pelo aluno' where id=$1`, [pubAluno1])
    await asOwner()
    const l = await scalar('select legenda from publicacoes where id=$1', [pubAluno1])
    assert(l === 'Legenda editada pelo aluno', 'aluno nao editou a propria legenda')
  })

  await test('N7. Aluno NAO edita publicacao de outro autor', async () => {
    await asUser(AUTH_ALUNO1)
    await db.query(`update publicacoes set legenda='hackeado' where id=$1`, [pubAdmin1])
    await asOwner()
    const l = await scalar('select legenda from publicacoes where id=$1', [pubAdmin1])
    assert(l !== 'hackeado', 'aluno editou publicacao de outro autor')
  })

  await test('N8. Aluno NAO modera publicacao (ativo) — nem a propria (trigger)', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError(
      `update publicacoes set ativo=false where id=$1`,
      [pubAluno1],
      'PUBLICACAO_MODERACAO_ADMIN'
    )
  })

  await test('N9. Admin modera publicacao do aluno (OK); aluno NAO reativa', async () => {
    await asUser(AUTH_ADMIN1)
    await db.query(`update publicacoes set ativo=false where id=$1`, [pubAluno1])
    await asOwner()
    const a = await scalar('select ativo from publicacoes where id=$1', [pubAluno1])
    assert(a === false, 'admin nao moderou publicacao do aluno')
    await asUser(AUTH_ALUNO1)
    // RLS filtra silenciosamente: a publicacao moderada NAO e visivel ao
    // aluno (nem para UPDATE), entao a reativacao afeta 0 linhas — sem erro.
    await db.query(`update publicacoes set ativo=true where id=$1`, [pubAluno1])
    await asOwner()
    const aFinal = await scalar('select ativo from publicacoes where id=$1', [pubAluno1])
    assert(aFinal === false, 'aluno reativou publicacao moderada')
    // defesa em profundidade: se a linha fosse visivel, o trigger bloquearia
    // com PUBLICACAO_MODERACAO_ADMIN (testado em N8 com a propria publicada).
    // devolve ao estado ativo para os testes seguintes
    await asUser(AUTH_ADMIN1)
    await db.query(`update publicacoes set ativo=true where id=$1`, [pubAluno1])
  })

  await test('N10. Aluno NAO faz upload em rascunho de OUTRO autor', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'RascN10') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubN10 = r.rows[0].id
    await asUser(AUTH_ALUNO1)
    await expectError(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubN10}/f.jpg`],
      'row-level security'
    )
  })

  await test('N11. Aluno NAO faz upload na PROPRIA publicacao ja PUBLICADA', async () => {
    await asUser(AUTH_ALUNO1)
    await expectError(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubAluno1}/extra.jpg`],
      'row-level security'
    )
  })

  await test('N12. Aluno NAO registra foto em rascunho de outro autor', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'RascN12') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubN12 = r.rows[0].id
    await asUser(AUTH_ALUNO1)
    await expectError(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubN12, `${BOX1}/${pubN12}/f.jpg`],
      'row-level security'
    )
  })

  await test('N13. Aluno NAO remove objeto vinculado a publicacao PUBLICADA ativa', async () => {
    await asUser(AUTH_ALUNO1)
    // A policy de DELETE do storage exige rascunho proprio (ou admin), entao
    // a remocao afeta 0 linhas — sem erro. E, se a policy fosse contornada,
    // o trigger STORAGE_VINCULO_PUBLICADA bloquearia (testado na Etapa 4.1).
    await db.query(
      `delete from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubAluno1}/foto0.jpg`]
    )
    await asOwner()
    const n = Number(await scalar(
      `select count(*) from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubAluno1}/foto0.jpg`]
    ))
    assert(n === 1, 'aluno removeu objeto de publicacao publicada ativa')
  })

  await test('N14. Cancelamento do proprio rascunho: remove objeto, foto e rascunho (OK)', async () => {
    await asUser(AUTH_ALUNO1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'Vou cancelar') returning id`,
      [BOX1, USR_ALUNO1]
    )
    const pubN14 = r.rows[0].id
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubN14}/f.jpg`]
    )
    await db.query(
      `insert into publicacao_fotos (publicacao_id, storage_path, ordem) values ($1, $2, 0)`,
      [pubN14, `${BOX1}/${pubN14}/f.jpg`]
    )
    // ordem obrigatoria: objeto -> linha da foto -> rascunho
    await db.query(
      `delete from storage.objects where bucket_id='comunidade' and name=$1`,
      [`${BOX1}/${pubN14}/f.jpg`]
    )
    await db.query(`delete from publicacao_fotos where publicacao_id=$1`, [pubN14])
    await db.query(`delete from publicacoes where id=$1`, [pubN14])
    await asOwner()
    const n = Number(await scalar('select count(*) from publicacoes where id=$1', [pubN14]))
    assert(n === 0, 'rascunho do aluno nao foi excluido')
  })

  await test('N15. Aluno NAO exclui rascunho de outro autor', async () => {
    await asUser(AUTH_COACH1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'RascN15') returning id`,
      [BOX1, USR_COACH1]
    )
    const pubN15 = r.rows[0].id
    await asUser(AUTH_ALUNO1)
    await db.query(`delete from publicacoes where id=$1`, [pubN15])
    await asOwner()
    const n = Number(await scalar('select count(*) from publicacoes where id=$1', [pubN15]))
    assert(n === 1, 'aluno excluiu rascunho de outro autor')
  })

  await test('N16. Aluno NAO exclui a PROPRIA publicacao PUBLICADA (so rascunho)', async () => {
    await asUser(AUTH_ALUNO1)
    await db.query(`delete from publicacoes where id=$1`, [pubAluno1])
    await asOwner()
    const n = Number(await scalar('select count(*) from publicacoes where id=$1', [pubAluno1]))
    assert(n === 1, 'aluno excluiu a propria publicacao publicada')
  })

  await test('N17. Aluno VE o proprio rascunho; aluno de outro box NAO ve', async () => {
    await asUser(AUTH_ALUNO1)
    const r = await db.query(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'Meu rascunho') returning id`,
      [BOX1, USR_ALUNO1]
    )
    const pubN17 = r.rows[0].id
    const nProprio = Number(await scalar('select count(*) from publicacoes where id=$1', [pubN17]))
    assert(nProprio === 1, 'aluno nao viu o proprio rascunho')
    await asUser(AUTH_ALUNO2)
    const nOutro = Number(await scalar('select count(*) from publicacoes where id=$1', [pubN17]))
    assert(nOutro === 0, 'aluno de outro box viu rascunho alheio')
  })

  await test('N18. [Cross] Aluno do box2 NAO cria/upload em publicacao do box1', async () => {
    await asUser(AUTH_ALUNO2)
    await expectError(
      `insert into publicacoes (box_id, autor_id, legenda) values ($1, $2, 'cross')`,
      [BOX1, USR_ALUNO2],
      'row-level security'
    )
    await expectError(
      `insert into storage.objects (bucket_id, name) values ('comunidade', $1)`,
      [`${BOX1}/${pubAluno1}/cross.jpg`],
      'row-level security'
    )
  })
}

/* ================================================================
 * MAIN
 * ================================================================ */
try {
  console.log('OLYMPEA WARRIOR — Etapas 4.1 + 4.3 — Testes isolados (PGlite)')
  console.log(`Migrations: ${path.relative(ROOT, MIGRATION_41)} + ${path.relative(ROOT, MIGRATION_43)}`)
  await setup()
  console.log('Setup concluido (stubs + schema legado + migration 3.1 + migration 4.1 + migration 4.3 + seeds).\n')
  await runTests()
} catch (e) {
  console.error('\n[SETUP FALHOU]')
  console.error(String(e.message))
  console.error('Todos os testes: NAO TESTADO (setup nao concluido).')
  process.exitCode = 1
} finally {
  if (results.length > 0) {
    const aprovados = results.filter((r) => r.status === 'APROVADO').length
    const reprovados = results.filter((r) => r.status === 'REPROVADO').length
    console.log('\n================ RESUMO ================')
    console.log(`APROVADOS:  ${aprovados}`)
    console.log(`REPROVADOS: ${reprovados}`)
    console.log('NAO TESTADOS: 0 (todos os testes planejados foram executados)')
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
