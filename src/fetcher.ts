import {getAuthorizationPayload} from "./psn/auth";
import {getMandatoryParam} from "./config/get-mandatory-param.js";
import {fetchPsnPlayer} from "./psn/player";
import {fetchPlayerTrophies} from "./psn/suite-data";
import {buildTrophyquestPlayerData} from "./trophyquest/trophyquest-data";
import {insertTrophyQuestData} from "./postgres/trophyquest-app-insert";
import {fetchPlayedSuites} from "./psn/played-suite";
import {insertFailureMetadata, insertSuccessMetadata} from "./postgres/trophyquest-metadata-insert";

const lambdaName = "psn-fetcher";

async function runFetcher(): Promise<void> {
    const startTime = Date.now();
    console.info("🟢 PSN Fetcher: Start");

    try {
        // Reading job params
        const npsso = getMandatoryParam('NPSSO');
        const profileName = getMandatoryParam('PROFILE_NAME');
        console.info(`Fetching all PSN data for profile ${profileName}`);

        // Authenticate and fetch user info
        const auth = await getAuthorizationPayload(npsso);
        const player = await fetchPsnPlayer(auth, profileName);
        const accountId = player.id;
        console.info(`Fetched player data for profile ${profileName} with id ${accountId}`);

        // Fetch played suites
        const playedSuites = await fetchPlayedSuites(auth, accountId);
        console.info(`Fetched ${playedSuites.length} suites`)

        // Fetching trophies of played suites and earned trophies
        const trophyData = await fetchPlayerTrophies(auth, accountId, playedSuites);
        console.info(`Fetched ${trophyData.trophies.length} trophies`)
        console.info(`Fetched ${trophyData.earnedTrophies.length} earned trophies`)
        console.info(`Fetched ${trophyData.groups.length} groups of trophy`)

        // Building Trophyquest data
        const tqData = buildTrophyquestPlayerData(accountId, [player], playedSuites, trophyData.trophies, trophyData.earnedTrophies, trophyData.groups);
        console.info(`Built TrophyQuest data for profile ${profileName}`);
        console.info(`Built ${tqData.suites.length} suites`);
        console.info(`Built ${tqData.groups.length} groups of trophy`);
        console.info(`Built ${tqData.trophies.length} trophies`);
        console.info(`Built ${tqData.playedSuites.length} played suites`);
        console.info(`Built ${tqData.earnedTrophies.length} earned trophies`);

        // Inserting data into database
        await insertTrophyQuestData(tqData)

        // End of job
        const durationMillis = Date.now() - startTime;
        const durationSeconds = durationMillis / 1000;
        await insertSuccessMetadata(lambdaName, durationMillis)
        console.info("✅ PSN Fetcher: Success");
        console.info(`Total processing time: ${durationSeconds.toFixed(2)} s`);
    } catch (err) {
        await insertFailureMetadata(lambdaName, String(err))
        throw err;
    }
}

export const handler = async (
    event: any = {},
    _context: any = {}
): Promise<void> => {
    if (event.profileName) {
        process.env.PROFILE_NAME = event.profileName;
    }
    await runFetcher();
};

if (!process.env.LAMBDA_TASK_ROOT) {
    runFetcher().catch((e) => {
        console.error(e);
        process.exitCode = 1;
    });
}
