import {getMandatoryParam} from "./config/get-mandatory-param";
import {getAuthorizationPayload} from "./psn/auth";
import {insertFailureMetadata, insertSuccessMetadata} from "./postgres/trophyquest-metadata-insert";
import {selectPlayers} from "./postgres/trophyquest-player-select";
import {fetchPsnPlayer} from "./psn/player";
import {fetchPlayedSuites} from "./psn/played-suite";
import {fetchPlayerTrophies} from "./psn/suite-data";
import {buildTrophyquestPlayerData, EMPTY_TROPHYQUEST_DATA, mergeTrophyQuestData} from "./trophyquest/trophyquest-data";
import {insertTrophyQuestData} from "./postgres/trophyquest-app-insert";

const lambdaName = "psn-refresher";

async function runRefresher(): Promise<void> {
    const startTime = Date.now();
    console.info("🟢 PSN Refresher: Start");


    try {
        // Reading job params
        const npsso = getMandatoryParam("NPSSO");
        const playerLimit = Number(getMandatoryParam("PLAYER_LIMIT"));
        console.info(`Refreshing PSN data for ${playerLimit} players`);

        // Select players to refresh
        const playersToRefresh = await selectPlayers(playerLimit);
        console.info(`Found ${playersToRefresh.length} players to refresh`);

        // Authenticate and fetch user info
        const auth = await getAuthorizationPayload(npsso);
        console.info(`Authenticated with PSN`);

        // Refresh data for players
        let trophyQuestData = EMPTY_TROPHYQUEST_DATA;
        for (const playerToRefresh of playersToRefresh) {
            const pseudo = playerToRefresh.pseudo;
            const lastPlayedSuiteDate = playerToRefresh.lastPlayedSuite;
            console.info(`Refreshing data for player ${pseudo} until ${lastPlayedSuiteDate}`);

            const player = await fetchPsnPlayer(auth, pseudo);
            const accountId = player.id;
            console.info(`Fetched player data for profile ${pseudo} with id ${accountId}`);

            const playedSuites = await fetchPlayedSuites(auth, accountId, lastPlayedSuiteDate);
            console.info(`Fetched ${playedSuites.length} played suites for player ${pseudo}`);

            const trophyData = await fetchPlayerTrophies(auth, accountId, playedSuites);
            console.info(`Fetched ${trophyData.trophies.length} trophies for player ${pseudo}`)
            console.info(`Fetched ${trophyData.earnedTrophies.length} earned trophies for player ${pseudo}`)
            console.info(`Fetched ${trophyData.groups.length} groups of trophy for player ${pseudo}`)

            // Building Trophyquest data
            const playerData = buildTrophyquestPlayerData(accountId, [player], playedSuites, trophyData.trophies, trophyData.earnedTrophies, trophyData.groups);
            trophyQuestData = mergeTrophyQuestData(trophyQuestData, playerData);
            console.info(`Built TrophyQuest data for player ${pseudo}`);
        }
        console.info(`Built ${trophyQuestData.suites.length} suites`);
        console.info(`Built ${trophyQuestData.groups.length} groups of trophy`);
        console.info(`Built ${trophyQuestData.trophies.length} trophies`);
        console.info(`Built ${trophyQuestData.playedSuites.length} played suites`);
        console.info(`Built ${trophyQuestData.earnedTrophies.length} earned trophies`);

        // Inserting data into database
        await insertTrophyQuestData(trophyQuestData)

        // End of job
        const durationMillis = Date.now() - startTime;
        const durationSeconds = durationMillis / 1000;
        await insertSuccessMetadata(lambdaName, durationMillis)
        console.info("✅ PSN Refresher: Success");
        console.info(`Total processing time: ${durationSeconds.toFixed(2)} s`);
    } catch (err) {
        await insertFailureMetadata(lambdaName, String(err))
        throw err;
    }
}

export const handler = async (
    _event: any = {},
    _context: any = {}
): Promise<void> => {
    await runRefresher();
};

if (!process.env.LAMBDA_TASK_ROOT) {
    runRefresher().catch((e) => {
        console.error(e);
        process.exitCode = 1;
    });
}