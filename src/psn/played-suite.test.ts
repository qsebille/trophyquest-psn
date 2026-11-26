import assert from "node:assert/strict";
import test, {before, mock} from "node:test";

import {fetchPlayedSuiteInventory, fetchPlayedSuites} from "./played-suite.js";

let mockFetch: (url: string) => Promise<Response>;
before(() => {
    // psn-api captures fetch when its module loads, so keep one delegating stub.
    mock.method(globalThis, "fetch", (url: string) => mockFetch(url));
});

test("fetches every title newer than the cutoff across PSN pages", async () => {
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
    mockFetch = async (url) => {
        const offset = Number(new URL(url).searchParams.get("offset"));
        offsets.push(offset);
        const page = pages.get(offset);
        assert.ok(page);
        return Response.json(page);
    };

    const auth = {accessToken: "test"};
    const refreshed = await fetchPlayedSuites(auth, "player", new Date("2026-11-14"));
    assert.deepEqual(refreshed.map(({id}) => id), ["newest", "intermediate", "next-page"]);
    assert.deepEqual(offsets, [0, 200]);

    offsets.length = 0;
    const fullHistory = await fetchPlayedSuites(auth, "player");
    assert.deepEqual(fullHistory.map(({id}) => id), ["newest", "intermediate", "next-page", "at-cutoff", "older"]);
    assert.deepEqual(offsets, [0, 200, 400]);
});

test("reads the entire inventory even when a title has no update date", async () => {
    const title = (npCommunicationId: string) => ({npCommunicationId, trophyTitlePlatform: "PS5"});
    mockFetch = async (url) => {
        const offset = Number(new URL(url).searchParams.get("offset"));
        return Response.json(offset === 0
            ? {trophyTitles: [title("first")], totalItemCount: 2, nextOffset: 1}
            : {trophyTitles: [title("last")], totalItemCount: 2});
    };

    const suites = await fetchPlayedSuiteInventory({accessToken: "test"}, "player");
    assert.deepEqual(suites.map(({id, lastPlayedAt}) => ({id, lastPlayedAt})), [
        {id: "first", lastPlayedAt: null}, {id: "last", lastPlayedAt: null},
    ]);
});

test("rejects inconsistent or inaccessible inventories", async (t) => {
    const title = {npCommunicationId: "first", trophyTitlePlatform: "PS5"};
    for (const [name, response, message] of [
        ["truncated", {trophyTitles: [title], totalItemCount: 2}, /incomplete/],
        ["invalid offset", {trophyTitles: [title], totalItemCount: 2, nextOffset: 0}, /did not advance/],
        ["duplicated titles", {trophyTitles: [title, title], totalItemCount: 2}, /duplicate/],
        ["private profile", {error: {message: "Forbidden"}}, /did not return a trophy title list/],
    ] as const) {
        await t.test(name, async () => {
            mockFetch = async () => Response.json(response);
            await assert.rejects(fetchPlayedSuiteInventory({accessToken: "test"}, "player"), message);
        });
    }
});
