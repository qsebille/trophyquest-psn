import assert from "node:assert/strict";
import test from "node:test";
import {PsnPlayedSuite} from "../psn/played-suite";
import {computeTrophyQuestSuiteUuid} from "../utils/uuid";
import {planReconciliation} from "./suite-reconciliation";

function localSuite(id: string, hasEarnedTrophies = false) {
    return {suiteId: computeTrophyQuestSuiteUuid(id), version: "1", lastPlayedAt: new Date("2026-11-01"), hasEarnedTrophies};
}

function psnSuite(id: string, lastPlayedAt = "2026-11-01T00:00:00Z"): PsnPlayedSuite {
    return {
        id,
        name: id,
        iconUrl: "",
        platforms: ["PS5"],
        hasTrophyGroups: false,
        npServiceName: "trophy2",
        lastPlayedAt,
    };
}

test("removes only empty links absent from both inventories and imports older unlinked suites", async () => {
    const removed = localSuite("removed");
    const snapshot = [removed, localSuite("still-visible"), localSuite("temporarily-missing"), localSuite("earned", true), localSuite("updated")];
    const inventories = [
        [psnSuite("still-visible")],
        [psnSuite("still-visible"), psnSuite("temporarily-missing"), psnSuite("unhidden"), psnSuite("updated", "2026-11-02T00:00:00Z")],
    ];
    const result = await planReconciliation(snapshot, async () => inventories.shift()!);

    assert.deepEqual(result.removedLinks, [removed]);
    assert.deepEqual(result.suitesToImport.map(({id}) => id), ["unhidden", "updated"]);
    assert.equal(inventories.length, 0);
});

test("does not confirm removal from an empty inventory for a previously populated player", async () => {
    await assert.rejects(planReconciliation([localSuite("removed")], async () => []), /empty inventory/);
});

test("a failed confirmation prevents reconciliation", async () => {
    let reads = 0;
    await assert.rejects(planReconciliation([localSuite("removed")], async () => {
        reads++;
        if (reads === 2) throw new Error("PSN unavailable");
        return [psnSuite("another-suite")];
    }), /PSN unavailable/);
});

test("one inventory is sufficient with no removal candidates", async () => {
    let reads = 0;
    const result = await planReconciliation([], async () => {
        reads++;
        return [];
    });
    assert.equal(reads, 1);
    assert.deepEqual(result.removedLinks, []);
});
