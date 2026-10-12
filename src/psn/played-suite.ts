import {AuthorizationPayload} from "psn-api";


const BATCH_SIZE = 200

export interface PsnPlayedSuite {
    id: string
    name: string
    iconUrl: string
    platforms: string[]
    hasTrophyGroups: boolean
    npServiceName: "trophy" | "trophy2"
    lastPlayedAt: string
}


export async function fetchPlayedSuites(
    auth: AuthorizationPayload,
    accountId: string,
    startTime: Date | null = null,
) {
    const {getUserTitles} = await import("psn-api");

    const result = []
    let offset: number | undefined = 0;
    let continueLoop = true;
    while (continueLoop) {
        const options = {limit: BATCH_SIZE, offset};
        const response = await getUserTitles(auth, accountId, options);

        const playedTrophyTitles: PsnPlayedSuite[] = [];
        for (const trophyTitle of response.trophyTitles) {
            const lastPlayedAtDate = new Date(trophyTitle.lastUpdatedDateTime);
            const shouldKeep = startTime === null || lastPlayedAtDate > startTime;
            if (!shouldKeep) continue;

            playedTrophyTitles.push({
                id: trophyTitle.npCommunicationId,
                name: trophyTitle.trophyTitleName,
                iconUrl: trophyTitle.trophyTitleIconUrl,
                platforms: trophyTitle.trophyTitlePlatform.split(','),
                hasTrophyGroups: trophyTitle.hasTrophyGroups,
                npServiceName: trophyTitle.npServiceName,
                lastPlayedAt: trophyTitle.lastUpdatedDateTime,
            } as PsnPlayedSuite);

            if (startTime !== null && lastPlayedAtDate > startTime) {
                continueLoop = false;
                break;
            }
        }
        result.push(...playedTrophyTitles);

        if (!continueLoop) break;

        // End of loop
        offset = response.nextOffset;
        continueLoop = offset !== undefined && offset !== null;
    }

    return result;
}