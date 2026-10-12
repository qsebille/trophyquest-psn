import {computeTrophyQuestGroupUuid, computeTrophyQuestSuiteUuid} from "../utils/uuid";
import {PsnGroup} from "../psn/group";

export interface TrophyQuestGroup {
    id: string
    psnId: string,
    name: string
    suiteId: string
}

export function buildTrophyQuestGroups(groups: PsnGroup[]) {
    return groups.map(g => {
        const groupId = computeTrophyQuestGroupUuid(g.id)
        const suiteId = computeTrophyQuestSuiteUuid(g.suiteId)
        return {
            id: groupId,
            psnId: g.psnId,
            name: g.name,
            suiteId: suiteId
        } as TrophyQuestGroup
    });
}