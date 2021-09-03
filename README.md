## Excalibur Integration Testing

`npm install @excaliburjs/testing`

Often times a few small integration tests are the best predictor of working software, especially when testing 3rd party dependencies.

The excalibur integration testing utility is a small wrapper around puppeteer for driving the UI and comparing images.

This can be run from your npm scripts in the package.json like so:

```json
{
    /* ... */
    "scripts": {
        "test:integration": "ex-test -d ./my-project-files -t ./test/integration/ex-tests.js"
    }
    /* ... */
}

```

## Options

* `-i`, `--interactive`, - Run in interactive mode to update expected images on test failures like jest snapshots
* `-t`, `--tests [tests...]` - Supply path to compiled tests as .js files
* `-d`, `--dir <dir>` - Optional directory of built static files html/css/js to test against 
* `-p`, `--port <port>` - Optional port to run against internally, `8080` is default
* `-u`, `--url <url>` - Optionally test against an external url
* `-l`, `--logs` - Show browser logs in output



## Example Test File

```
import { expectLoaded, expectPage, test } from "@excaliburjs/testing";

test('An integration test', async (page) => {
    await expectLoaded();
    await expectPage('Can check a page', './images/actual-page.png').toBe('./images/expected-page.png');

    await page.evaluate(() => {
        var actor = ((window as any).actor);
        actor.pos.x = 400;
        actor.pos.y = 400;
    });
    await expectPage('Can move an actor and check', './images/actual-page-2.png').toBe('./images/expected-page-2.png');
});
```
