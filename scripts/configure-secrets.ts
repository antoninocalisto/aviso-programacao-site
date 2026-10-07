import { randomBytes } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { spawn } from 'node:child_process';
const cliPath = process.argv[2];
if (!cliPath) throw new Error('Informe o caminho de vercel/dist/vc.js instalado localmente.');
const envFile = '.env.local';
const values = existsSync(envFile) ? parseEnv(readFileSync(envFile, 'utf8')) : {};
if (!values['CRON_SECRET']) {
  values['CRON_SECRET'] = randomBytes(32).toString('hex');
  appendFileSync(envFile, `\nCRON_SECRET=${values['CRON_SECRET']}\n`);
}
for (const key of ['CRON_SECRET', 'RESEND_API_KEY', 'CALLMEBOT_PHONE', 'CALLMEBOT_API_KEY']) {
  const value = values[key];
  if (!value) { console.log(`${key}: pendente em .env.local`); continue; }
  const child = spawn(process.execPath, [cliPath, 'env', 'add', key, 'production', '--type', 'secret', '--scope', 'antuninosantos-8322s-projects', '--force'], { stdio: ['pipe', 'pipe', 'pipe'] });
  child.stdout.resume(); child.stderr.resume();
  child.stdin.end(value);
  const code = await new Promise<number | null>(resolve => child.on('exit', resolve));
  if (code !== 0) {
    // Never print CLI output from a secret-bearing command.
    throw new Error(`Falha ao configurar ${key} na Vercel (código ${code}).`);
  }
  console.log(`${key}: configurada em produção`);
}
