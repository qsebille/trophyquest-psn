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

    const result: PsnPlayedSuite[] = [];
    let offset: number | undefined = 0;
    while (offset !== undefined && offset !== null) {
        const options = {limit: BATCH_SIZE, offset};
        const response = await getUserTitles(auth, accountId, options);

        for (const trophyTitle of response.trophyTitles) {
            if (startTime !== null) {
                const lastPlayedAt = Date.parse(trophyTitle.lastUpdatedDateTime);
                if (Number.isNaN(lastPlayedAt)) continue;

                // PSN returns titles from most recently updated to oldest.
                if (lastPlayedAt <= startTime.getTime()) return result;
            }

            result.push({
                id: trophyTitle.npCommunicationId,
                name: trophyTitle.trophyTitleName,
                iconUrl: trophyTitle.trophyTitleIconUrl,
                platforms: trophyTitle.trophyTitlePlatform.split(','),
                hasTrophyGroups: trophyTitle.hasTrophyGroups,
                npServiceName: trophyTitle.npServiceName,
                lastPlayedAt: trophyTitle.lastUpdatedDateTime,
            });
        }

        offset = response.nextOffset;
    }

    return result;
}
