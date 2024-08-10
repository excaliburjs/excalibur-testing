import { expectLoaded, expectPage, test } from "../src/";

test('An integration test', async (page) => {
    await expectLoaded();
    await expectPage('Can check a page', './images/actual-page.png').toBe('./images/expected-page.png');

    await page.evaluate(() => {
        var actor = ((window as any).actor);
        actor.pos.x = 400;
        actor.pos.y = 400;
    });
    await expectPage('Can move an actor and check', './images/actual-page-2.png').toBe('./images/expected-page-2.png');

    // FIXME: somehow this test environment is not always reflective of what downstream consumers see, e.g.:
    //     ```sh
    //     ...
    //     Test: Vite template
    // [ERROR]: Could not confirm Excalibur loaded properly Error: Evaluation failed: TypeError: Failed to execute 'removeChild' on 'Node': parameter 1 is not of type 'Node'.
    //     at __puppeteer_evaluation_script__:3:23
    //     at ExecutionContext._evaluateInternal (/workspaces/foo/node_modules/.pnpm/puppeteer@10.2.0/node_modules/puppeteer/lib/cjs/puppeteer/common/ExecutionContext.js:221:19)
    //     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    //     at async ExecutionContext.evaluate (/workspaces/foo/node_modules/.pnpm/puppeteer@10.2.0/node_modules/puppeteer/lib/cjs/puppeteer/common/ExecutionContext.js:110:16)
    //     at async clickPlayButton (/workspaces/foo/node_modules/.pnpm/@excaliburjs+testing@0.25.1/node_modules/@excaliburjs/testing/dist/src/index.js:85:5)
    //     at async expectLoadedInternal (/workspaces/foo/node_modules/.pnpm/@excaliburjs+testing@0.25.1/node_modules/@excaliburjs/testing/dist/src/index.js:105:9)
    //     at async Array.<anonymous> (/workspaces/foo/test/test.js:5:9)
    //     at async Runner.start (/workspaces/foo/node_modules/.pnpm/@excaliburjs+testing@0.25.1/node_modules/@excaliburjs/testing/dist/src/index.js:185:17)
    //     at async /workspaces/foo/node_modules/.pnpm/@excaliburjs+testing@0.25.1/node_modules/@excaliburjs/testing/dist/src/cli.js:41:5
    //    ...
    //     ```
    // 
    // ideally, we have a test that makes sure this can't happen.
});