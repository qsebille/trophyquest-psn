import {PoolClient} from "pg";
import {buildPostgresInsertPlaceholders} from "../utils/build-postgres-insert-placeholders.js";
import {TrophyQuestSuite} from "../../trophyquest/suite";


export async function insertSuites(
    client: PoolClient,
    suites: TrophyQuestSuite[],
) {
    if (suites.length === 0) {
        console.warn("🟡 No data to insert intopsn.suite table.");
        return {rowsInserted: 0, rowsIgnored: 0};
    }

    const batchSize: number = suites.length > 1000 ? 1000 : suites.length;
    let rowsInserted: number = 0;
    let rowsIgnored: number = 0;

    for (let i = 0; i < suites.length; i += batchSize) {
        const batch = suites.slice(i, i + batchSize);
        const values: string[] = [];
        const placeholders: string = batch.map((ts, idx) => {
            const currentValues = [
                ts.id,
                ts.name,
                ts.psnIconUrl,
                `{${ts.platforms}}`,
            ]
            values.push(...currentValues);
            return buildPostgresInsertPlaceholders(currentValues, idx);
        }).join(',');
        const insert = await client.query(`
            INSERT INTO psn.suite (id, name, psn_image_url, platforms)
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