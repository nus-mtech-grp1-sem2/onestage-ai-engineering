#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = ['README.md','AGENTS.md','CLAUDE.md','CHANGELOG.md','VERSION','skills.d','rules','configs','integrations','workflows','.github/workflows','scripts','tests','evals','docs'];
for (const entry of required) if (!existsSync(path.join(root, entry))) throw new Error(`missing ${entry}`);
const skills = (await readdir(path.join(root, 'skills.d'))).sort();
if (skills.length !== 12) throw new Error(`expected 12 skills, found ${skills.length}`);
for (const name of skills) {
  const text = await readFile(path.join(root, 'skills.d', name, 'SKILL.md'), 'utf8');
  const fm = text.match(/^---\nname: ([a-z0-9-]+)\ndescription: (.+)\n---\n/);
  if (!fm || fm[1] !== name || fm[2].length < 40) throw new Error(`invalid frontmatter: ${name}`);
  for (const phrase of ['Do not use', 'Inspect', 'security', 'reliability', 'scalability', 'performance', 'cost', 'operational', 'Never claim']) if (!text.toLowerCase().includes(phrase.toLowerCase())) throw new Error(`${name} missing: ${phrase}`);
  JSON.parse(await readFile(path.join(root, 'evals', `${name}.json`), 'utf8'));
}
async function walk(dir) { for (const n of await readdir(dir)) { const p=path.join(dir,n); const s=await stat(p); if(s.isDirectory()) await walk(p); else { const b=path.basename(p); if (/^\.env(?:\.|$)/.test(b) && b !== '.env.example') throw new Error(`forbidden ${p}`); if (/\.tfstate(?:\.|$)|\.tfplan$/.test(b)) throw new Error(`forbidden ${p}`); } } }
await walk(root);
const workflows = (await readdir(path.join(root, '.github/workflows'))).filter((x)=>/\.ya?ml$/.test(x));
for (const name of workflows) {
  const text = await readFile(path.join(root, '.github/workflows', name), 'utf8');
  for (const requiredText of ['workflow_call', 'permissions:', 'timeout-minutes:']) if (!text.includes(requiredText)) throw new Error(`${name} missing ${requiredText}`);
  if (text.includes('pull_request_target')) throw new Error(`${name} uses unsafe pull_request_target`);
  for (const match of text.matchAll(/uses:\s*([^\s#]+)/g)) {
    const ref = match[1];
    if (ref.startsWith('./')) continue;
    if (!/@[0-9a-f]{40}$/.test(ref)) throw new Error(`${name} has non-immutable action reference: ${ref}`);
  }
}
console.log(`validated ${skills.length} skills, evals, ${workflows.length} reusable workflows, required structure, immutable action references, and forbidden filenames`);
