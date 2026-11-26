import {AuthorizationPayload} from "psn-api";


const BATCH_SIZE = 200

export interface PsnPlayedSuite {
    id: string
    name: string
    iconUrl: string
    platforms: string[]
    hasTrophyGroups: boolean
    npServiceName: "trophy" | "trophy2"
    lastPlayedAt: string | null
}


export async function fetchPlayedSuites(
    auth: AuthorizationPayload,
    accountId: string,
    startTime: Date | null = null,
) {
    return readPlayedSuites(auth, accountId, startTime, false);
}

export async function fetchPlayedSuiteInventory(auth: AuthorizationPayload, accountId: string) {
    return readPlayedSuites(auth, accountId, null, true);
}

async function readPlayedSuites(
    auth: AuthorizationPayload,
    accountId: string,
    startTime: Date | null,
    inventory: boolean,
): Promise<PsnPlayedSuite[]> {
    const {getUserTitles} = await import("psn-api");

    const result: PsnPlayedSuite[] = [];
    const seen = new Set<string>();
    let total: number | undefined;
    let pagesRead = 0;
    let offset: number | undefined = 0;
    while (offset !== undefined && offset !== null) {
        const options = {limit: BATCH_SIZE, offset};
        const response = await getUserTitles(auth, accountId, options);
        pagesRead++;
        if (!Array.isArray(response?.trophyTitles)) {
            throw new Error("PSN did not return a trophy title list");
        }
        if (inventory) {
            if (!Number.isSafeInteger(response.totalItemCount) || response.totalItemCount < 0
                || (total !== undefined && response.totalItemCount !== total)) {
                throw new Error("PSN inventory total is invalid or changed during pagination");
            }
            total = response.totalItemCount;
        }

        for (const trophyTitle of response.trophyTitles) {
            const lastPlayedAt = Date.parse(trophyTitle.lastUpdatedDateTime);
            if (startTime !== null) {
                if (Number.isNaN(lastPlayedAt)) continue;

                // PSN returns titles from most recently updated to oldest.
                if (lastPlayedAt <= startTime.getTime()) return result;
            }

            if (inventory && (typeof trophyTitle.npCommunicationId !== "string"
                || !trophyTitle.npCommunicationId || seen.has(trophyTitle.npCommunicationId))) {
                throw new Error("PSN inventory contains a missing or duplicate suite ID");
            }
            if (inventory) seen.add(trophyTitle.npCommunicationId);
            result.push({
                id: trophyTitle.npCommunicationId,
                name: trophyTitle.trophyTitleName,
                iconUrl: trophyTitle.trophyTitleIconUrl,
                platforms: trophyTitle.trophyTitlePlatform.split(','),
                hasTrophyGroups: trophyTitle.hasTrophyGroups,
                npServiceName: trophyTitle.npServiceName,
                lastPlayedAt: Number.isNaN(lastPlayedAt) ? null : trophyTitle.lastUpdatedDateTime,
            });
        }

        offset = response.nextOffset;
        if (offset != null && (!Number.isSafeInteger(offset) || offset <= options.offset)) {
            throw new Error("PSN pagination did not advance");
        }
        if (total !== undefined && (offset != null ? offset !== result.length || offset >= total : result.length !== total)) {
            throw new Error("PSN inventory pagination is incomplete or inconsistent");
        }
    }

    if (inventory) console.info(`Read ${result.length} PSN trophy titles across ${pagesRead} pages`);
    return result;
}
