#!/usr/bin/env node

import { execSync } from 'node:child_process';

const monitoredPorts = [3000, 5173];

function getListeningProcesses(port) {
  try {
    const output = execSync(`netstat -ano | findstr ":${port}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.includes('LISTENING'))
      .map((line) => {
        const parts = line.split(/\s+/);
        return parts[parts.length - 1];
      })
      .filter((pid) => /^\d+$/.test(pid));
  } catch {
    return [];
  }
}

for (const port of monitoredPorts) {
  const pids = [...new Set(getListeningProcesses(port))];

  if (pids.length === 0) {
    console.log(`[cleanup] No process is listening on port ${port}`);
    continue;
  }

  for (const pid of pids) {
    console.log(`[cleanup] Process ${pid} is listening on port ${port}. Stopping it.`);
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    } catch {
      // Ignore if the process is already gone.
    }
  }
}
