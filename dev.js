#!/usr/bin/env node

// Temporary development server script
const { exec } = require('child_process');

console.log('Starting Vite development server...');

const viteProcess = exec('npx vite --port 8080', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`Stdout: ${stdout}`);
});

viteProcess.stdout.on('data', (data) => {
  console.log(data);
});

viteProcess.stderr.on('data', (data) => {
  console.error(data);
});