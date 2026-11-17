import assert from "node:assert/strict";
import test from "node:test";

import {fetchPlayedSuites} from "./played-suite.js";

test("fetches every title newer than the cutoff across PSN pages", async (t) => {
    const title = (id: string, day: string) => ({
        npCommunicationId: id,
        trophyTitleName: id,
        trophyTitlePlatform: "PS5",
        lastUpdatedDateTime: `2026-11-${day}T00:00:00Z`,
    });
    const pages = new Map([
        [0, {trophyTitles: [title("newest", "17"), title("intermediate", "16")], nextOffset: 200}],
        [200, {trophyTitles: [title("next-page", "15"), title("at-cutoff", "14")], nextOffset: 400}],
        [400, {trophyTitles: [title("older", "13")]}],
    ]);
    const offsets: number[] = [];
    t.mock.method(globalThis, "fetch", async (url: string) => {
        const offset = Number(new URL(url).searchParams.get("offset"));
        offsets.push(offset);
        const page = pages.get(offset);
        assert.ok(page);
        return Response.json(page);
    });

    const auth = {accessToken: "test"};
    const refreshed = await fetchPlayedSuites(auth, "player", new Date("2026-11-14"));
    assert.deepEqual(refreshed.map(({id}) => id), ["newest", "intermediate", "next-page"]);
    assert.deepEqual(offsets, [0, 200]);

    offsets.length = 0;
    const fullHistory = await fetchPlayedSuites(auth, "player");
    assert.deepEqual(fullHistory.map(({id}) => id), ["newest", "intermediate", "next-page", "at-cutoff", "older"]);
    assert.deepEqual(offsets, [0, 200, 400]);
});
