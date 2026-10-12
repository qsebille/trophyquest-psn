import {AuthorizationPayload} from "psn-api";
import {PsnPlayedSuite} from "./played-suite";

export interface PsnGroup {
    id: string,
    suiteId: string,
    psnId: string, // 'default' for base psn.games, otherwise increments '001', '002', etc. for each DLC
    name: string,
}

export function buildGroupUniqueId(suiteId: string, psnId: string) {
    return `${suiteId}:${psnId}`;
}

export async function fetchGroupsForSuite(
    auth: AuthorizationPayload,
    playedSuite: PsnPlayedSuite,
): Promise<PsnGroup[]> {
    const {getTitleTrophyGroups} = await import("psn-api");

    const options = {npServiceName: playedSuite.npServiceName};
    const groupResponse = await getTitleTrophyGroups(auth, playedSuite.id, options);

    return groupResponse.trophyGroups.map(g => {
        const groupId = buildGroupUniqueId(playedSuite.id, g.trophyGroupId)
        return {
            id: groupId,
            suiteId: playedSuite.id,
            psnId: g.trophyGroupId,
            name: g.trophyGroupName
        } as PsnGroup;
    });
}