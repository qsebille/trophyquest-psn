import {PoolClient} from "pg";
import {buildPostgresInsertPlaceholders} from "../utils/build-postgres-insert-placeholders.js";
import {TrophyQuestEarnedTrophy} from "../../trophyquest/earned-trophy";

export async function insertEarnedTrophies(
    client: PoolClient,
    earnedTrophies: TrophyQuestEarnedTrophy[],
) {
    if (earnedTrophies.length === 0) {
        console.warn("🟡 No data to insert into psn.earned_trophy table.");
        return {rowsInserted: 0, rowsIgnored: 0};
    }

    const batchSize: number = earnedTrophies.length > 1000 ? 1000 : earnedTrophies.length;
    let rowsInserted: number = 0;
    let rowsIgnored: number = 0;

    for (let i = 0; i < earnedTrophies.length; i += batchSize) {
        const batch = earnedTrophies.slice(i, i + batchSize);
        const values: string[] = [];
        const placeholders: string = batch.map((earnedTrophy, idx) => {
            const currentValues = [
                earnedTrophy.playerId,
                earnedTrophy.trophyId,
                earnedTrophy.earnedAt,
            ]
            values.push(...currentValues);
            return buildPostgresInsertPlaceholders(currentValues, idx);
        }).join(',');
        const insert = await client.query(`
            INSERT INTO psn.earned_trophy (player_id, trophy_id, earned_at)
            VALUES
            ${placeholders}
            ON CONFLICT (player_id, trophy_id)
            DO NOTHING
        `, values);

        rowsInserted += insert.rowCount ?? 0;
        rowsIgnored += (batch.length - (insert.rowCount ?? 0));
    }

    return {rowsInserted, rowsIgnored};
}