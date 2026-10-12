import {AuthorizationPayload} from "psn-api";
import {PsnPlayedSuite} from "./played-suite";
import {buildTrophyId} from "./trophy";

export interface PsnEarnedTrophy {
    trophyId: string,
    trophyRank: number,
    playerId: string,
    earnedAt: string,
}

export async function fetchEarnedTrophiesOfSuite(
    auth: AuthorizationPayload,
    accountId: string,
    playedSuite: PsnPlayedSuite,
): Promise<PsnEarnedTrophy[]> {
    const {getUserTrophiesEarnedForTitle} = await import("psn-api");

    let options = {npServiceName: playedSuite.npServiceName};
    const userTrophiesEarned = await getUserTrophiesEarnedForTitle(auth, accountId, playedSuite.id, "all", options);

    return userTrophiesEarned.trophies
        .filter(trophy => trophy.earnedDateTime !== undefined)
        .map(trophy => {
            const rank = trophy.trophyId;
            return {
                trophyId: buildTrophyId(playedSuite.id, rank),
                trophyRank: rank,
                playerId: accountId,
                earnedAt: trophy.earnedDateTime ?? '',
            } as PsnEarnedTrophy;
        });
}