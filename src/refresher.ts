import {getMandatoryParam} from "./config/get-mandatory-param";
import {insertFailureMetadata, insertSuccessMetadata} from "./postgres/trophyquest-metadata-insert";
import {recordRefreshFailure, selectPlayers} from "./postgres/trophyquest-player-select";
import {buildPostgresPool} from "./postgres/utils/pool";
import {getAuthorizationPayload} from "./psn/auth";
import {synchronizePlayer} from "./trophyquest/player-sync";

const lambdaName = "psn-refresher";

function readInteger(name: string, value: string, minimum: number) {
    const result = Number(value);
    if (!/^\d+$/.test(value) || !Number.isInteger(result) || result < minimum || result > 2_147_483_647) {
        throw new Error(`${name} must be an integer of at least ${minimum}`);
    }
    return result;
}

async function runRefresher(): Promise<void> {
    const startTime = Date.now();
    console.info("🟢 PSN Refresher: Start");

    try {
        const playerLimit = readInteger("PLAYER_LIMIT", getMandatoryParam("PLAYER_LIMIT"), 1);
        const reconciliationInterval = readInteger("RECONCILIATION_INTERVAL_DAYS", process.env.RECONCILIATION_INTERVAL_DAYS ?? "7", 1);
        const reconciliationLimit = readInteger("RECONCILIATION_PLAYER_LIMIT", process.env.RECONCILIATION_PLAYER_LIMIT ?? "1", 0);
        const pool = buildPostgresPool();
        try {
            const players = await selectPlayers(pool, playerLimit, reconciliationInterval);
            if (players.length > 0) {
                const auth = await getAuthorizationPayload(getMandatoryParam("NPSSO"));
                const failures: unknown[] = [];
                let reconciliationBudget = reconciliationLimit;
                for (const player of players) {
                    const reconcile = player.reconciliationDue && reconciliationBudget > 0;
                    if (reconcile) reconciliationBudget--;
                    try {
                        const deletedLinks = await synchronizePlayer(pool, auth, player.pseudo, reconcile ? "reconcile" : "incremental", player);
                        if (deletedLinks === null) {
                            console.info(`PSN refresh skipped for ${player.id}: player changed concurrently`);
                        } else if (reconcile) {
                            console.info(`PSN reconciliation succeeded for ${player.id}: ${deletedLinks} links removed`);
                        }
                    } catch (err) {
                        console.error(`PSN ${reconcile ? "reconciliation" : "refresh"} failed for ${player.id}`, err);
                        failures.push(err);
                        try {
                            await recordRefreshFailure(pool, player, reconcile);
                        } catch (recordError) {
                            console.error(`Could not record the failed attempt for ${player.id}`, recordError);
                        }
                    }
                }
                if (failures.length > 0) {
                    throw new AggregateError(failures, `${failures.length} PSN player refreshes failed`);
                }
            }
        } finally {
            await pool.end();
        }

        await insertSuccessMetadata(lambdaName, Date.now() - startTime);
        console.info("✅ PSN Refresher: Success");
    } catch (err) {
        await insertFailureMetadata(lambdaName, String(err));
        throw err;
    }
}

export const handler = async (): Promise<void> => {
    await runRefresher();
};

if (!process.env.LAMBDA_TASK_ROOT) {
    runRefresher().catch((e) => {
        console.error(e);
        process.exitCode = 1;
    });
}
