import {PsnPlayedSuite} from "../psn/played-suite";
import {computeTrophyQuestPlayerUuid, computeTrophyQuestSuiteUuid} from "../utils/uuid";

export interface TrophyQuestPlayedSuite {
    suiteId: string
    playerId: string
    lastPlayedAt: string
}

export function buildTrophyQuestPlayedSuites(accountId: string, playedSuites: PsnPlayedSuite[]) {
    const playerId = computeTrophyQuestPlayerUuid(accountId)
    return playedSuites.map(t => {
        const suiteId = computeTrophyQuestSuiteUuid(t.id)
        return {
            suiteId: suiteId,
            playerId,
            lastPlayedAt: t.lastPlayedAt,
        } as TrophyQuestPlayedSuite
    });
}