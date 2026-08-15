#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const check = args.includes('--check');
const allowDirty = args.includes('--allow-dirty');
const requested = args.filter((x) => x.startsWith('--integration='));
const managedStart = '<!-- ONESTAGE-AI:START managed; do not edit -->';
const managedEnd = '<!-- ONESTAGE-AI:END managed -->';

if (apply && check) throw new Error('--apply and --check are mutually exclusive');

async function files(dir, base = dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of (await readdir(dir)).sort()) {
    const p = path.join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) out.push(...await files(p, base));
    else out.push(path.relative(base, p));
  }
  return out;
}

async function sameTree(a, b) {
  const af = await files(a); const bf = await files(b);
  if (JSON.stringify(af) !== JSON.stringify(bf)) return false;
  for (const f of af) if ((await readFile(path.join(a, f))).compare(await readFile(path.join(b, f))) !== 0) return false;
  return true;
}

async function syncTree(source, destination, write) {
  if (await sameTree(source, destination)) return false;
  if (write) {
    await rm(destination, { recursive: true, force: true });
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination, { recursive: true, preserveTimestamps: false });
  }
  return true;
}

function assertCleanGitRepo(repo) {
  if (!existsSync(path.join(repo, '.git'))) throw new Error(`target is not a Git repository: ${repo}`);
  const status = execFileSync('git', ['-C', repo, 'status', '--porcelain=v1', '--untracked-files=normal'], { encoding: 'utf8' });
  if (status.trim() && !allowDirty) throw new Error(`target has uncommitted changes: ${repo}; use --allow-dirty only after review`);
}

function managedDocument(kind) {
  return `${managedStart}\n# OneStage managed rules\n\nFollow the central policy version in \`onestage-ai.json\`. Inspect before editing; use the relevant generated skill. Never expose secrets, bypass checks, deploy, migrate data, or change IAM/networking without explicit human approval. For HTTP API changes, update and validate the OpenAPI contract in the same change; backend code owns accurate operations and schemas, while frontend code must remain compatible with the published contract. Report executed verification accurately.\n${managedEnd}\n`;
}

async function mergeManaged(file, block, write) {
  const old = existsSync(file) ? await readFile(file, 'utf8') : '';
  const start = old.indexOf(managedStart); const end = old.indexOf(managedEnd);
  let next;
  if (start >= 0 && end >= start) next = old.slice(0, start) + block + old.slice(end + managedEnd.length).replace(/^\n/, '');
  else next = old ? `${old.replace(/\s+$/, '')}\n\n${block}` : block;
  if (next === old) return false;
  if (write) await writeFile(file, next);
  return true;
}

async function installIntegration(name, target) {
  if (apply && !existsSync(path.join(target, '.git'))) throw new Error(`target is not a Git repository: ${target}`);
  if (apply && !allowDirty) assertCleanGitRepo(target);
  const changes = [];
  for (const file of ['AGENTS.md', 'CLAUDE.md']) if (await mergeManaged(path.join(target, file), managedDocument(file), apply)) changes.push(file);
  for (const dest of ['.agents/skills', '.claude/skills']) if (await syncTree(path.join(root, 'skills.d'), path.join(target, dest), apply)) changes.push(dest);
  const source = path.join(root, 'integrations', name, 'github');
  if (existsSync(source) && await syncTree(source, path.join(target, '.github', 'workflows', 'onestage-managed'), apply)) changes.push('.github/workflows/onestage-managed');
  const version = (await readFile(path.join(root, 'VERSION'), 'utf8')).trim();
  const digest = createHash('sha256').update((await files(path.join(root, 'skills.d'))).join('\n')).digest('hex');
  const manifest = JSON.stringify({ policyVersion: version, sourceCommit: 'REPLACE_WITH_CENTRAL_COMMIT_SHA', skillsIndexSha256: digest }, null, 2) + '\n';
  const mf = path.join(target, 'onestage-ai.json');
  if (!existsSync(mf) || await readFile(mf, 'utf8') !== manifest) { changes.push('onestage-ai.json'); if (apply) await writeFile(mf, manifest); }
  return changes;
}

let drift = false;
for (const destination of [
  '.agents/skills', '.claude/skills',
  'integrations/core-frontend/.agents/skills', 'integrations/core-frontend/.claude/skills',
  'integrations/backend-repo/.agents/skills', 'integrations/backend-repo/.claude/skills'
]) {
  const changed = await syncTree(path.join(root, 'skills.d'), path.join(root, destination), apply);
  if (changed) { drift = true; console.log(`${apply ? 'updated' : 'would update'} ${destination}`); }
}
for (const spec of requested) {
  const [name, targetRaw] = spec.slice('--integration='.length).split('=', 2);
  if (!['core-frontend', 'backend-repo'].includes(name) || !targetRaw) throw new Error('use --integration=core-frontend=/path or --integration=backend-repo=/path');
  const target = path.resolve(targetRaw);
  const changes = await installIntegration(name, target);
  if (changes.length) { drift = true; console.log(`${apply ? 'updated' : 'would update'} ${target}: ${changes.join(', ')}`); }
}
if (!drift) console.log('generated content is synchronized');
if (check && drift) process.exitCode = 1;
