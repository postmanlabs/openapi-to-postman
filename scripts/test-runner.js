const { spawnSync } = require('child_process');
const os = require('os');

const isWindows = os.platform() === 'win32';

const script = isWindows ? 'test.bat' : 'test.sh';
const shell = isWindows ? true : '/bin/bash';

const result = spawnSync(
  isWindows ? `${__dirname}\\${script}` : `${__dirname}/${script}`,
  [],
  { 
    stdio: 'inherit',
    shell: shell
  }
);

process.exit(result.status); 