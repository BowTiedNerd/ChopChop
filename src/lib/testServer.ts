/** Test helper: start this checkout's vite dev server on a random free port; always kill it afterwards. */
import { spawn, ChildProcess } from 'child_process';
import { createServer } from 'net';

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      srv.close(() => resolve(port));
    });
  });
}

export interface DevServer { url: string; stop: () => Promise<void> }

export async function startDevServer(timeoutMs = 60000): Promise<DevServer> {
  const port = await freePort();
  const child: ChildProcess = spawn('npx', ['vite', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true, // own process group, so we can kill npx and vite together
  });
  let log = '';
  child.stdout?.on('data', d => { log += String(d); });
  child.stderr?.on('data', d => { log += String(d); });
  const url = `http://127.0.0.1:${port}/`;
  const stop = async () => {
    if (!child.pid) return;
    const kill = (sig: NodeJS.Signals) => {
      try {
        process.kill(-child.pid!, sig);
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ESRCH') throw e; // group already gone
      }
    };
    kill('SIGTERM');
    await new Promise(r => setTimeout(r, 500));
    kill('SIGKILL');
  };
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (child.exitCode !== null) throw new Error(`vite exited early (${child.exitCode}):\n${log}`);
    // Only trust our own server: vite prints the port it actually bound
    if (log.includes(`:${port}`)) {
      const ok = await fetch(url).then(r => r.ok, (e: unknown) => { log += `\nfetch: ${String(e)}`; return false; });
      if (ok) return { url, stop };
    }
    await new Promise(r => setTimeout(r, 300));
  }
  await stop();
  throw new Error(`vite did not start on ${url} within ${timeoutMs}ms:\n${log}`);
}
