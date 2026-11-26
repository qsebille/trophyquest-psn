import {Pool} from "pg";
import {TrophyQuestPlayerToRefresh} from "../trophyquest/player-to-refresh";

export async function selectPlayers(pool: Pool, limit: number, reconciliationIntervalDays: number) {
    const result = await pool.query<TrophyQuestPlayerToRefresh>(`
        SELECT id, pseudo, version, "reconciliationDue"
        FROM (
            SELECT id, pseudo, xmin::text AS version, updated_at, last_reconciliation_attempt_at,
                   (last_reconciled_at IS NULL OR last_reconciled_at <= now() - make_interval(days => $2))
                   AND (last_reconciliation_attempt_at IS NULL
                        OR last_reconciliation_attempt_at <= now() - interval '1 day') AS "reconciliationDue"
            FROM psn.player
            ORDER BY updated_at, id
            LIMIT $1
        ) AS refresh_batch
        ORDER BY "reconciliationDue" DESC, last_reconciliation_attempt_at NULLS FIRST, updated_at, id
    `, [limit, reconciliationIntervalDays]);

    return result.rows;
}

export async function recordRefreshFailure(pool: Pool, player: TrophyQuestPlayerToRefresh, reconcile: boolean) {
    await pool.query(`
        UPDATE psn.player
        SET last_reconciliation_attempt_at = CASE WHEN $3 THEN now() ELSE last_reconciliation_attempt_at END
        WHERE id = $1 AND xmin::text = $2
    `, [player.id, player.version, reconcile]);
}

export async function loadPlayerSyncState(pool: Pool, playerId: string) {
    const result = await pool.query<{version: string; cutoff: Date | null}>(`
        SELECT p.xmin::text AS version,
               COALESCE(p.last_synced_title_at, (
                   SELECT MAX(last_played_at) FROM psn.played_suite WHERE player_id = p.id
               )) AS cutoff
        FROM psn.player p
        WHERE p.id = $1
    `, [playerId]);
    return result.rows[0];
}

export interface PlayedSuiteSnapshot {
    suiteId: string;
    version: string;
    lastPlayedAt: Date | null;
    hasEarnedTrophies: boolean;
}

export async function loadPlayedSuiteSnapshot(pool: Pool, playerId: string) {
    const result = await pool.query<PlayedSuiteSnapshot>(`
        SELECT ps.suite_id AS "suiteId", ps.xmin::text AS version, ps.last_played_at AS "lastPlayedAt",
               EXISTS (
                   SELECT 1 FROM psn.trophy t
                   JOIN psn.earned_trophy et ON et.trophy_id = t.id
                   WHERE t.suite_id = ps.suite_id AND et.player_id = ps.player_id
               ) AS "hasEarnedTrophies"
        FROM psn.played_suite ps
        WHERE ps.player_id = $1
    `, [playerId]);
    return result.rows;
}
