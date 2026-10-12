import {computeTrophyQuestSuiteUuid} from "../utils/uuid";
import {PsnPlayedSuite} from "../psn/played-suite";

export interface TrophyQuestSuite {
    id: string
    gameId: string | null
    name: string
    psnIconUrl: string
    platforms: string[]
}

export function buildTrophyQuestSuites(playedSuite: PsnPlayedSuite[]) {
    return playedSuite.map(t => {
        const suiteId = computeTrophyQuestSuiteUuid(t.id)

        return {
            id: suiteId,
            name: t.name,
            psnIconUrl: t.iconUrl,
            platforms: t.platforms
        } as TrophyQuestSuite
    })
}