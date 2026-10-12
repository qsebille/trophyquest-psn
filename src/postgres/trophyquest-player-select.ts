import {buildPostgresPool} from "./utils/pool";
import {TrophyQuestPlayerToRefresh} from "../trophyquest/player-to-refresh";


/**
 * Selects a list of players from the database, from the most ancien update to the most recent.
 * @param limit
 */
export async function selectPlayers(limit: number): Promise<TrophyQuestPlayerToRefresh[]> {
    const pool = buildPostgresPool();
    const result = await pool.query(`
        SELECT p.pseudo,
               p.updated_at,
               MAX(ps.last_played_at) AS last_played_suite
        FROM psn.player p
                 JOIN psn.played_suite ps on ps.player_id = p.id
        GROUP BY p.pseudo, p.updated_at
        ORDER BY updated_at
        LIMIT ${limit}
    `);

    return result.rows.map(row => ({
        pseudo: row.pseudo,
        lastPlayedSuite: row.last_played_suite
    }));
}