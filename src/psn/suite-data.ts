import {AuthorizationPayload} from "psn-api";
import {mapWithConcurrency} from "../utils/map-with-concurrency";
import {fetchTrophiesOfSuite, PsnTrophy} from "./trophy";
import {fetchEarnedTrophiesOfSuite, PsnEarnedTrophy} from "./earned-trophy";
import {fetchGroupsForSuite, PsnGroup} from "./group";
import {PsnPlayedSuite} from "./played-suite";


const CONCURRENCY = 5

export interface PsnSuiteData {
    trophies: PsnTrophy[];
    earnedTrophies: PsnEarnedTrophy[];
    groups: PsnGroup[];
}

export async function fetchPlayerTrophies(
    auth: AuthorizationPayload,
    accountId: string,
    playedSuites: PsnPlayedSuite[],
): Promise<PsnSuiteData> {
    const batchResults = await mapWithConcurrency(
        playedSuites,
        CONCURRENCY,
        async (playedSuite) => {
            const [trophies, earnedTrophies, groups] = await Promise.all([
                fetchTrophiesOfSuite(auth, playedSuite),
                fetchEarnedTrophiesOfSuite(auth, accountId, playedSuite),
                fetchGroupsForSuite(auth, playedSuite),
            ]);

            return {trophies, earnedTrophies, groups} as PsnSuiteData;
        }
    );

    const trophies = batchResults.flatMap(r => r.trophies);
    const earnedTrophies = batchResults.flatMap(r => r.earnedTrophies);
    const groups = batchResults.flatMap(r => r.groups);

    return {trophies, earnedTrophies, groups};
}