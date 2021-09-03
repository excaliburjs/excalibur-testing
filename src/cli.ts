#!/usr/bin/env node

import { Command } from 'commander'
import { resolve } from 'path';
import { Runner } from './index';

const program = new Command();

program.option('-i, --interactive', 'Run in interactive mode to update expected images');
program.option('-t, --tests [tests...]', 'Supply path to tests');
program.option('-d, --dir <dir>', 'Directory of static files');
program.option('-p, --port <port>', 'Directory of static files');
program.option('-u, --url <url>', 'URL of site to test');
program.option('-l, --logs', 'Show browser logs');

program.parse(process.argv);

const options = program.opts<{
    interactive: boolean,
    tests: string[],
    dir: string,
    port: number,
    url: string,
    logs: boolean
}>();


let interactive = false;
if (options.interactive) {
    interactive = options.interactive;
    console.log('Running in interactive mode')
}
if (options.dir) {
    console.log(`Running against static files in directory: ${options.dir}`)
}

const runner = new Runner({
    interactive: interactive,
    dir: options.dir,
    port: options.port,
    url: options.url,
    showLogs: options.logs
});

const dir = process.cwd();
for (let test of options.tests) {
    console.log(`Current Dir: ${dir}`);
    const testPath = resolve(dir, test)
    console.log(`Loading ${testPath}`);
    const testFile = require(testPath);
    console.log(`Loaded ${testPath}`);
}

console.log('\n\n');

(async () => {
    await runner.start();
})()

