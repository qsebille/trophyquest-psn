import {PoolClient} from "pg";
import {buildPostgresInsertPlaceholders} from "../utils/build-postgres-insert-placeholders.js";
import {TrophyQuestGroup} from "../../trophyquest/group";

export async function insertGroups(
    client: PoolClient,
    groups: TrophyQuestGroup[],
) {
    if (groups.length === 0) {
        console.warn("🟡 No data to insert into psn.group table.");
        return {rowsInserted: 0, rowsIgnored: 0};
    }

    const batchSize: number = groups.length > 1000 ? 1000 : groups.length;
    let rowsInserted: number = 0;
    let rowsIgnored: number = 0;

    for (let i = 0; i < groups.length; i += batchSize) {
        const batch = groups.slice(i, i + batchSize);
        const values: string[] = [];
        const placeholders: string = groups.map((group, idx) => {
            const currentValues = [
                group.id,
                group.suiteId,
                group.psnId,
                group.name,
            ]
            values.push(...currentValues);
            return buildPostgresInsertPlaceholders(currentValues, idx);
        }).join(',');
        const insert = await client.query(`
            INSERT INTO psn.group (id, suite_id, psn_id, name)
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