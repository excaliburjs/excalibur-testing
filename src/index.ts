import * as fs from 'fs';
import * as http from 'http';
import * as nodestatic from '@brettz9/node-static';
import * as readline from 'readline';



import * as pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import * as puppeteer from 'puppeteer';


export interface ExTestContext {
   tests: [string, ((page: puppeteer.Page) => Promise<any>)][];
   page: puppeteer.Page | null;
   interactive: boolean;
   passed: number;
   failed: number;
}
export const ExTestContext: ExTestContext = {
   tests: [],
   interactive: false,
   page: null,
   passed: 0,
   failed: 0
}

const updateExpected = (expectedFile: string, actualFile: string) => {
   const actual = PNG.sync.read(fs.readFileSync(actualFile));

   const userInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

   return new Promise<void>((resolve, reject) => {

      userInterface.question('Update expected image? (y/n): ', response => {
         if (response.toLocaleLowerCase().includes('y')) {
            console.log(`Updating ${expectedFile}...`);
            const actualBuffer = PNG.sync.write(actual);
            checkPath(expectedFile, true);
            fs.writeFileSync(expectedFile, actualBuffer);
            userInterface.close();
            resolve();
         } else {
            userInterface.close();
            reject();
         }
      });
   })
}

async function imageMatch(expectedFile: string, actualFile: string) {
   const actual = PNG.sync.read(fs.readFileSync(actualFile));
   if (!checkPath(expectedFile)) {
      console.log(`[ERROR]: Expected image: [${expectedFile}] does not exist!`);
      if (ExTestContext.interactive) {
         await updateExpected(expectedFile, actualFile).catch(() => {
            ExTestContext.failed++;
         });
     } else {
        ExTestContext.failed++;
     }
    }
    const expected = PNG.sync.read(fs.readFileSync(expectedFile));
    const {width, height} = expected;
    const diff = new PNG({width, height});
    const pixelDiff = pixelmatch(expected.data, actual.data, diff.data, width, height, {threshold: 0.1});
    
    if (pixelDiff > 100) {
        console.error('\x1b[31m%s\x1b[0m', `[ERROR]: Image ${expectedFile} did not match acutal ${actualFile}, ${pixelDiff} different!`);
        const diffImage = PNG.sync.write(diff);
        console.log('Diff image: ', 'data:image/png;base64,' + diffImage.toString('base64'));
        const fileSplit = actualFile.split('/');
        const filename = fileSplit[fileSplit.length-1];
        const path = fileSplit.slice(0, -1);
        checkPath('./' + path.join('/'), true);
        fs.writeFileSync('./'+ path.join('/') + '/diff-'+ filename, diffImage)
        if (ExTestContext.interactive) {
            await updateExpected(expectedFile, actualFile).catch(() => {
               ExTestContext.failed++;
            });
        } else {
           ExTestContext.failed++;
        }
    }
}

const isLoaded = async (page: puppeteer.Page) => {
   await page.waitForSelector('#excalibur-play', {visible: true});
   // FIXME: see if this wait for timeout is still needed.
   // on possiblity is to use node timers, see also: https://stackoverflow.com/a/77078415
   // ```typescript
   // ...
   // 
   // import { setTimeout } from "node:timers/promises";
   // ...
   // ```
   // await page.waitForTimeout(1000); // give it a second
}

const clickPlayButton = async (page: puppeteer.Page) => {
   const start = await page.$('#excalibur-play');
   await start!.click();
   // Left-over roots :( excalibur bug
   await page.evaluate(() => {
      const root = document.querySelector('#excalibur-play-root') as Element;
      if (root) {
         document.body.removeChild(root);
      }
   });
}

const checkPath = (actualFilePath: string, create = false) => {
   if (create) {
      const fileSplit = actualFilePath.split('/');
      const path = fileSplit.slice(0, -1);
      fs.mkdirSync('./' + path.join('/'), {recursive: true});
      return true;
   }
   return fs.existsSync(actualFilePath);
}

const expectLoadedInternal = async (page: puppeteer.Page | null) => {
   if (!page) {
      return false;
   }
   try {
      await isLoaded(page);
      await clickPlayButton(page);
   } catch (e) {
      console.error('\x1b[31m%s\x1b[0m', '[ERROR]: Could not confirm Excalibur loaded properly', e);
      // swallow
   }
}

const expectPageInternal = (page: puppeteer.Page | null, pageName: string, actualFilePath: string) => {
   if (!page) {
      return {
         toBe: async (expectFilePath: string) => {
            console.error('\x1b[31m%s\x1b[0m', '[ERROR]: Context not created, did you create a Runner?');
            process.exit(1);
         }
      }
   }
   
   return {
      toBe: async (expectedFilePath: string) => {
         console.log(`\tExpect: ${pageName}`)
         checkPath(actualFilePath, true);
         await page.screenshot({path: actualFilePath});
         try {
            await imageMatch(expectedFilePath, actualFilePath);
            ExTestContext.passed++;
         } catch {
            ExTestContext.failed++;
         }
      }
   }
}

export interface RunnerOptions {
   url?: string;
   dir?: string;
   port?: number;
   interactive?: boolean;
   showLogs?: boolean;
}

export const expectPage = (name: string, path: string) => expectPageInternal(ExTestContext.page, name, path);
export const expectLoaded = async () => expectLoadedInternal(ExTestContext.page)
export const test = (name: string, testContext: (page: puppeteer.Page) => Promise<any>) => {
   ExTestContext.tests.push([name, testContext]);
}

export class Runner {
   private _url;
   private _dir;
   private _port;
   private _interactive;
   private _showLogs;
   constructor(options: RunnerOptions) {
      this._url = options.url;
      this._dir = options.dir;
      this._port = options.port ?? 8080;
      this._interactive = options.interactive ?? false;
      this._showLogs = options.showLogs ?? false;
      ExTestContext.interactive = this._interactive;
   }

   async start() {
      if (this._dir) {
         // start local server 
         const file = new nodestatic.Server(this._dir);
         const server = http.createServer(function (req, res) {
            file.serve(req, res);
         });
         const listening = new Promise<void>((resolve, reject) => {
            server.listen(this._port, () => {
               resolve();
            });
            server.on('error', () => {
               reject();
            });
         });

         await listening;
         
         this._url = `http://localhost:${this._port}/`
      }

      const browser = await puppeteer.launch({
         dumpio: this._showLogs,
         args: [
           '--window-size=800,600',
         ],
       });
     const page = await browser.newPage();
     await page.goto(this._url ?? '/');

     ExTestContext.page = page;
     try {
        for (let test of ExTestContext.tests) {
           console.log(`Test: ${test[0]}`)
           await (test[1](page));
        }
     } finally {
        await browser.close();
        if (ExTestContext.failed) {
           console.log('\x1b[31m%s\x1b[0m', `Tests failed: ${ExTestContext.failed}`);
           console.log('\x1b[31m%s\x1b[0m', `Tests passed: ${ExTestContext.passed}`);
           process.exit(1);
        }
        console.log('\x1b[32m%s\x1b[0m', `Test Success! ${ExTestContext.passed} Tests Passed`);
        process.exit(0);
     }
   }
}
