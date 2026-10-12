import {PoolClient} from "pg";
import {buildPostgresInsertPlaceholders} from "../utils/build-postgres-insert-placeholders.js";
import {TrophyQuestTrophy} from "../../trophyquest/trophy";

export async function insertTrophies(
    client: PoolClient,
    trophies: TrophyQuestTrophy[]
) {
    if (trophies.length === 0) {
        console.warn("🟡 No data to insert into psn.trophy table.");
        return {rowsInserted: 0, rowsIgnored: 0};
    }

    const batchSize: number = trophies.length > 1000 ? 1000 : trophies.length;
    let rowsInserted: number = 0;
    let rowsIgnored: number = 0;

    for (let i = 0; i < trophies.length; i += batchSize) {
        const batch = trophies.slice(i, i + batchSize);
        const values: string[] = [];
        const placeholders: string = batch.map((trophy, idx) => {
            const currentValues = [
                trophy.id,
                trophy.suiteId,
                trophy.groupId,
                trophy.rank.toString(),
                trophy.title,
                trophy.description,
                trophy.color,
                trophy.isHidden.toString(),
                trophy.psnIconUrl,
            ]
            values.push(...currentValues);
            return buildPostgresInsertPlaceholders(currentValues, idx);
        }).join(',');
        const insert = await client.query(`
            INSERT INTO psn.trophy (id, suite_id, group_id, rank, title, description,
                                    color, is_hidden, psn_icon_url)
            VALUES
            ${placeholders} 
            ON CONFLICT (id)
            DO NOTHING
        `, values);

        rowsInserted += insert.rowCount ?? 0;
        rowsIgnored += (batch.length - (insert.rowCount ?? 0));
    }

    return {rowsInserted, rowsIgnored};
}