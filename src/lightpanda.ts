import { spawn } from 'child_process';

let availableCache: boolean | null = null;

export async function isAvailable(): Promise<boolean> {
  if (availableCache !== null) return availableCache;

  return new Promise((resolve) => {
    const proc = spawn('lightpanda', ['--help'], { stdio: 'ignore' });
    proc.on('error', () => {
      availableCache = false;
      resolve(false);
    });
    proc.on('exit', (code) => {
      availableCache = code === 0 || code === 1; // help exits with 1 sometimes
      resolve(availableCache);
    });
    // timeout
    setTimeout(() => {
      if (availableCache === null) {
        availableCache = false;
        try { proc.kill(); } catch { /* ignore */ }
        resolve(false);
      }
    }, 3000);
  });
}

export async function fetchArticle(url: string, timeout = 30000): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('lightpanda', [
      'fetch',
      '--dump', 'markdown',
      '--strip-mode', 'ui',
      '--log-level', 'error',
      url,
    ], {
      timeout,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('error', (err) => {
      reject(new Error(`lightpanda 启动失败: ${err.message}`));
    });

    proc.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`lightpanda 退出码 ${code}: ${stderr.slice(0, 200)}`));
        return;
      }
      resolve(stdout.trim());
    });

    setTimeout(() => {
      proc.kill();
      reject(new Error('lightpanda 请求超时'));
    }, timeout);
  });
}
