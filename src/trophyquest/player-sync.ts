import {AuthorizationPayload} from "psn-api";
import {Pool} from "pg";
import {insertTrophyQuestData} from "../postgres/trophyquest-app-insert";
import {loadPlayedSuiteSnapshot, loadPlayerSyncState} from "../postgres/trophyquest-player-select";
import {fetchPsnPlayer} from "../psn/player";
import {fetchPlayedSuiteInventory, fetchPlayedSuites} from "../psn/played-suite";
import {fetchPlayerTrophies} from "../psn/suite-data";
import {computeTrophyQuestPlayerUuid} from "../utils/uuid";
import {planReconciliation} from "./suite-reconciliation";
import {TrophyQuestPlayerToRefresh} from "./player-to-refresh";
import {buildTrophyquestPlayerData} from "./trophyquest-data";

export async function synchronizePlayer(
    pool: Pool,
    auth: AuthorizationPayload,
    pseudo: string,
    mode: "import" | "incremental" | "reconcile",
    scheduledPlayer?: TrophyQuestPlayerToRefresh,
) {
    const player = await fetchPsnPlayer(auth, pseudo);
    const playerId = computeTrophyQuestPlayerUuid(player.id);
    if (scheduledPlayer && playerId !== scheduledPlayer.id) {
        throw new Error("The PSN account does not match the scheduled player");
    }

    const state = await loadPlayerSyncState(pool, playerId);
    if (scheduledPlayer && state?.version !== scheduledPlayer.version) return null;
    const cutoff = state?.cutoff ?? null;

    let playedSuites;
    let removedLinks = null;
    if (mode === "reconcile") {
        const snapshot = await loadPlayedSuiteSnapshot(pool, playerId);
        const reconciliation = await planReconciliation(snapshot, () => fetchPlayedSuiteInventory(auth, player.id));
        playedSuites = reconciliation.suitesToImport;
        removedLinks = reconciliation.removedLinks;
        console.info(`PSN inventory for ${playerId}: ${reconciliation.visibleSuiteCount} visible, ${removedLinks.length} confirmed missing`);
    } else {
        playedSuites = await fetchPlayedSuites(auth, player.id, mode === "import" ? null : cutoff);
    }

    const {trophies, earnedTrophies, groups} = await fetchPlayerTrophies(auth, player.id, playedSuites);
    const data = buildTrophyquestPlayerData(player.id, [player], playedSuites, trophies, earnedTrophies, groups);
    return insertTrophyQuestData(pool, data, state?.version ?? null, cutoff, removedLinks);
}
