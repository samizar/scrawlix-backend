export function debug(...args) {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] DEBUG:`, ...args);
}

export function error(...args) {
  const timestamp = new Date().toISOString();
  console.error(`\n[${timestamp}] ERROR:`, ...args);
} 