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
});