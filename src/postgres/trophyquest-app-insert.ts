import {insertPlayers} from "./insert/psn-player";
import {insertSuites} from "./insert/psn-suite";
import {insertGroups} from "./insert/psn-group";
import {insertPlayedSuites} from "./insert/psn-played-suite";
import {insertTrophies} from "./insert/psn-trophy";
import {insertEarnedTrophies} from "./insert/psn-earned-trophy";
import {TrophyQuestData} from "../trophyquest/trophyquest-data";
import {Pool} from "pg";
import {PlayedSuiteSnapshot} from "./trophyquest-player-select";

export async function insertTrophyQuestData(
    pool: Pool,
    data: TrophyQuestData,
    expectedVersion: string | null,
    cutoff: Date | null,
    reconciliation: PlayedSuiteSnapshot[] | null,
) {
    const playerId = data.players[0].id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN')
        // Serialize writes, including the first import before the player row exists.
        await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [playerId]);
        const current = await client.query<{version: string}>(`
            SELECT xmin::text AS version FROM psn.player WHERE id = $1 FOR UPDATE
        `, [playerId]);
        if ((current.rows[0]?.version ?? null) !== expectedVersion) {
            await client.query('ROLLBACK');
            return null;
        }

        const playerInsert = await insertPlayers(client, data.players)
        const suiteInsert = await insertSuites(client, data.suites)
        const groupInsert = await insertGroups(client, data.groups)
        const trophyInsert = await insertTrophies(client, data.trophies)
        const playedSuiteInsert = await insertPlayedSuites(client, data.playedSuites)
        const earnedTrophyInsert = await insertEarnedTrophies(client, data.earnedTrophies)
        let deletedLinks = 0;
        if (reconciliation?.length) {
            const result = await client.query(`
                DELETE FROM psn.played_suite ps
                USING unnest($2::uuid[], $3::text[]) AS candidate(suite_id, version)
                WHERE ps.player_id = $1 AND ps.suite_id = candidate.suite_id AND ps.xmin::text = candidate.version
                  AND NOT EXISTS (
                      SELECT 1 FROM psn.trophy t
                      JOIN psn.earned_trophy et ON et.trophy_id = t.id
                      WHERE t.suite_id = ps.suite_id AND et.player_id = ps.player_id
                  )
            `, [playerId, reconciliation.map(suite => suite.suiteId), reconciliation.map(suite => suite.version)]);
            deletedLinks = result.rowCount ?? 0;
        }
        await client.query(`
            UPDATE psn.player
            SET last_synced_title_at = GREATEST(last_synced_title_at, $2::timestamptz, (
                    SELECT MAX(last_played_at) FROM psn.played_suite WHERE player_id = $1
                )),
                last_reconciled_at = CASE WHEN $3 THEN now() ELSE last_reconciled_at END,
                last_reconciliation_attempt_at = CASE WHEN $3 THEN now() ELSE last_reconciliation_attempt_at END
            WHERE id = $1
        `, [playerId, cutoff, reconciliation !== null]);
        await client.query('COMMIT')

        console.info("Inserted data into Postgres: Success")
        logInsertResult('psn.player', playerInsert);
        logInsertResult('psn.suite', suiteInsert);
        logInsertResult('psn.group', groupInsert);
        logInsertResult('psn.played_suite', playedSuiteInsert);
        logInsertResult('psn.trophy', trophyInsert);
        logInsertResult('psn.earned_trophy', earnedTrophyInsert);
        return deletedLinks;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

function logInsertResult(
    tableName: string,
    result: { rowsInserted: number, rowsIgnored: number }
) {
    const ignoredLog = result.rowsIgnored > 0 ? `(${result.rowsIgnored} ignored)` : '';
    console.info(`Postgres: inserted ${result.rowsInserted} lines into ${tableName} table ${ignoredLog}`);
}
