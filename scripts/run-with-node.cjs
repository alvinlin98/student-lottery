const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Determine which node binary to use
let nodeBin = 'node';
const localWinNode = path.join(__dirname, '../.node/node.exe');
const localUnixNode = path.join(__dirname, '../.node/node');

if (process.platform === 'win32' && fs.existsSync(localWinNode)) {
  nodeBin = localWinNode;
} else if (fs.existsSync(localUnixNode)) {
  nodeBin = localUnixNode;
}

// Forward arguments to the selected Node binary
const args = process.argv.slice(2);
const result = spawnSync(nodeBin, args, { stdio: 'inherit', shell: true });
process.exit(result.status ?? 0);
