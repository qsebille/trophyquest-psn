import {PoolClient} from "pg";
import {buildPostgresInsertPlaceholders} from "../utils/build-postgres-insert-placeholders.js";
import {TrophyQuestPlayedSuite} from "../../trophyquest/played-suite";

export async function insertPlayedSuites(
    client: PoolClient,
    playedSuites: TrophyQuestPlayedSuite[]
) {
    if (playedSuites.length === 0) {
        console.warn("🟡 No data to insert into psn.played_suite table.");
        return {rowsInserted: 0, rowsIgnored: 0};
    }

    const batchSize: number = playedSuites.length > 1000 ? 1000 : playedSuites.length;
    let rowsInserted: number = 0;

    for (let i = 0; i < playedSuites.length; i += batchSize) {
        const batch = playedSuites.slice(i, i + batchSize);
        const values: string[] = [];
        const placeholders: string = batch.map((pts, idx) => {
            const currentValues = [
                pts.playerId,
                pts.suiteId,
                pts.lastPlayedAt,
            ]
            values.push(...currentValues);
            return buildPostgresInsertPlaceholders(currentValues, idx);
        }).join(',');
        const insert = await client.query(`
            INSERT INTO psn.played_suite (player_id, suite_id, last_played_at)
            VALUES
            ${placeholders} 
            ON CONFLICT (player_id, suite_id)
            DO UPDATE SET last_played_at=EXCLUDED.last_played_at
        `, values);

        rowsInserted += insert.rowCount ?? 0;
    }

    return {rowsInserted, rowsIgnored: 0};
}