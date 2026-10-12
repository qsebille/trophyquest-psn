import {computeTrophyQuestGroupUuid, computeTrophyQuestSuiteUuid, computeTrophyQuestTrophyUuid} from "../utils/uuid";
import {PsnTrophy} from "../psn/trophy";

export interface TrophyQuestTrophy {
    id: string
    rank: number
    title: string
    description: string
    color: string
    isHidden: boolean
    psnIconUrl: string
    suiteId: string
    groupId: string
}

export function buildTrophyQuestTrophies(trophies: PsnTrophy[]) {
    return trophies.map(t => {
        const trophyId = computeTrophyQuestTrophyUuid(t.id)
        const suiteId = computeTrophyQuestSuiteUuid(t.suiteId)
        const groupId = computeTrophyQuestGroupUuid(t.groupId)
        return {
            id: trophyId,
            rank: t.rank,
            title: t.title,
            description: t.detail,
            color: t.color,
            isHidden: t.isHidden,
            psnIconUrl: t.iconUrl,
            suiteId: suiteId,
            groupId: groupId,
        } as TrophyQuestTrophy
    })
}