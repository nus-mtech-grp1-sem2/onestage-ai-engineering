import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const script = path.join(root, 'scripts/sync-skills.mjs');
function repo() { const p=mkdtempSync(path.join(tmpdir(),'onestage-sync-')); execFileSync('git',['init','-q',p]); execFileSync('git',['-C',p,'config','user.email','fixture@example.invalid']); execFileSync('git',['-C',p,'config','user.name','Fixture']); writeFileSync(path.join(p,'.gitignore'),'node_modules/\n'); execFileSync('git',['-C',p,'add','.gitignore']); execFileSync('git',['-C',p,'commit','-qm','fixture']); return p; }
test('dry run does not write externally', () => { const p=repo(); execFileSync(process.execPath,[script,`--integration=core-frontend=${p}`]); assert.equal(readFileSync(path.join(p,'.gitignore'),'utf8'),'node_modules/\n'); assert.throws(()=>readFileSync(path.join(p,'AGENTS.md'))); });
test('apply preserves user content and check is stable', () => { const p=repo(); writeFileSync(path.join(p,'AGENTS.md'),'# User rules\n'); execFileSync('git',['-C',p,'add','AGENTS.md']); execFileSync('git',['-C',p,'commit','-qm','rules']); execFileSync(process.execPath,[script,'--apply',`--integration=core-frontend=${p}`]); assert.match(readFileSync(path.join(p,'AGENTS.md'),'utf8'),/# User rules/); execFileSync('git',['-C',p,'add','.']); execFileSync('git',['-C',p,'commit','-qm','generated']); execFileSync(process.execPath,[script,'--check',`--integration=core-frontend=${p}`]); });
test('dirty target is rejected unless overridden', () => { const p=repo(); writeFileSync(path.join(p,'dirty.txt'),'x'); const r=spawnSync(process.execPath,[script,'--apply',`--integration=backend-repo=${p}`]); assert.notEqual(r.status,0); });
