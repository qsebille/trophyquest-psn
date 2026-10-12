import {AuthorizationPayload} from "psn-api";
import {PsnPlayedSuite} from "./played-suite";
import {buildGroupUniqueId} from "./group";

export interface PsnTrophy {
    id: string
    rank: number
    title: string
    detail: string
    isHidden: boolean
    color: string
    iconUrl: string
    suiteId: string
    groupId: string
}

export function buildTrophyId(suiteId: string, rank: number) {
    return `${suiteId}:${rank}`;
}

export async function fetchTrophiesOfSuite(
    auth: AuthorizationPayload,
    playedSuite: PsnPlayedSuite,
): Promise<PsnTrophy[]> {
    const {getTitleTrophies} = await import("psn-api");

    const options = {npServiceName: playedSuite.npServiceName};
    const titleTrophies = await getTitleTrophies(auth, playedSuite.id, "all", options);

    return titleTrophies.trophies.map(trophy => {
        const rank = trophy.trophyId;
        return {
            id: buildTrophyId(playedSuite.id, rank),
            suiteId: playedSuite.id,
            groupId: buildGroupUniqueId(playedSuite.id, trophy.trophyGroupId ?? 'default'),
            rank: rank,
            title: trophy.trophyName ?? '',
            detail: trophy.trophyDetail ?? '',
            isHidden: trophy.trophyHidden,
            color: trophy.trophyType,
            iconUrl: trophy.trophyIconUrl ?? '',
        } as PsnTrophy
    });
}