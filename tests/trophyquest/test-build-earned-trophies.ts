import test from "node:test";
import assert from "node:assert/strict";

import {buildTrophyQuestEarnedTrophies} from "../../src/trophyquest/earned-trophy";
import {computeTrophyQuestPlayerUuid, computeTrophyQuestTrophyUuid} from "../../src/utils/uuid";

test("buildTrophyQuestEarnedTrophies maps PSN earned trophies to TrophyQuest earned trophies", () => {
    const accountId = "account-123";
    const earnedTrophies = [
        {
            trophyId: "game-1:1",
            trophyRank: 1,
            playerId: "psn-player-id",
            earnedAt: "2026-01-02T03:04:05Z",
        },
        {
            trophyId: "game-2:5",
            trophyRank: 5,
            playerId: "psn-player-id",
            earnedAt: "2026-02-03T04:05:06Z",
        },
    ];

    const result = buildTrophyQuestEarnedTrophies(accountId, earnedTrophies);

    assert.deepStrictEqual(result, [
        {
            trophyId: computeTrophyQuestTrophyUuid("game-1:1"),
            playerId: computeTrophyQuestPlayerUuid(accountId),
            earnedAt: "2026-01-02T03:04:05Z",
        },
        {
            trophyId: computeTrophyQuestTrophyUuid("game-2:5"),
            playerId: computeTrophyQuestPlayerUuid(accountId),
            earnedAt: "2026-02-03T04:05:06Z",
        },
    ]);
});