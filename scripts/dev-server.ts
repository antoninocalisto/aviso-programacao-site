import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import type { ApiRequest, ApiResponse } from '../server/http/contracts.js';
import status from '../api/status.js';
import monitor from '../api/monitor.js';
const server = createServer(async (req, res) => {
  const adapted = res as unknown as ApiResponse;
  adapted.status = code => { res.statusCode = code; return adapted; };
  adapted.json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); return adapted; };
  const path = new URL(req.url || '/', 'http://localhost').pathname;
  if (path === '/api/status') await status(req as ApiRequest, adapted);
  else if (path === '/api/monitor') await monitor(req as ApiRequest, adapted);
  else { res.statusCode = 404; res.end(); }
});
server.listen(3001, '127.0.0.1', () => console.log('API local: http://localhost:3001'));
const child = spawn(process.execPath, ['node_modules/@angular/cli/bin/ng.js', 'serve', '--host', '127.0.0.1'], { stdio: 'inherit' });
const stop = () => { child.kill(); server.close(); };
process.on('SIGINT', stop); process.on('SIGTERM', stop); child.on('exit', () => { server.close(); });
