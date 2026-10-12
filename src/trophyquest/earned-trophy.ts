import {computeTrophyQuestPlayerUuid, computeTrophyQuestTrophyUuid} from "../utils/uuid";
import {PsnEarnedTrophy} from "../psn/earned-trophy";

export interface TrophyQuestEarnedTrophy {
    trophyId: string
    playerId: string
    earnedAt: string
}

export function buildTrophyQuestEarnedTrophies(
    accountId: string,
    earnedTrophies: PsnEarnedTrophy[]
) {
    const playerId = computeTrophyQuestPlayerUuid(accountId)

    return earnedTrophies.map(t => {
        const trophyId = computeTrophyQuestTrophyUuid(t.trophyId)
        return {
            trophyId,
            playerId,
            earnedAt: t.earnedAt,
        } as TrophyQuestEarnedTrophy
    });
}