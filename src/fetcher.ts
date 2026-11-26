import {getMandatoryParam} from "./config/get-mandatory-param.js";
import {insertFailureMetadata, insertSuccessMetadata} from "./postgres/trophyquest-metadata-insert";
import {buildPostgresPool} from "./postgres/utils/pool";
import {getAuthorizationPayload} from "./psn/auth";
import {synchronizePlayer} from "./trophyquest/player-sync";

const lambdaName = "psn-fetcher";

async function runFetcher(profileName?: string): Promise<void> {
    const startTime = Date.now();
    console.info("🟢 PSN Fetcher: Start");

    try {
        profileName = profileName || getMandatoryParam("PROFILE_NAME");
        console.info(`Fetching all PSN data for profile ${profileName}`);
        const auth = await getAuthorizationPayload(getMandatoryParam("NPSSO"));
        const pool = buildPostgresPool();
        try {
            const result = await synchronizePlayer(pool, auth, profileName, "import");
            if (result === null) {
                throw new Error("The player changed during the PSN import. Retry the import.");
            }
        } finally {
            await pool.end();
        }

        await insertSuccessMetadata(lambdaName, Date.now() - startTime);
        console.info("✅ PSN Fetcher: Success");
    } catch (err) {
        await insertFailureMetadata(lambdaName, String(err));
        throw err;
    }
}

export const handler = async (event: {profileName?: string} = {}): Promise<void> => {
    await runFetcher(event.profileName);
};

if (!process.env.LAMBDA_TASK_ROOT) {
    runFetcher().catch((e) => {
        console.error(e);
        process.exitCode = 1;
    });
}
