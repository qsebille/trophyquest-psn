import {PlayedSuiteSnapshot} from "../postgres/trophyquest-player-select";
import {PsnPlayedSuite} from "../psn/played-suite";
import {computeTrophyQuestSuiteUuid} from "../utils/uuid";

export async function planReconciliation(
    snapshot: PlayedSuiteSnapshot[],
    fetchInventory: () => Promise<PsnPlayedSuite[]>,
) {
    const localSuites = new Map(snapshot.map(suite => [suite.suiteId, suite]));
    const readInventory = async () => {
        const suites = await fetchInventory();
        if (suites.length === 0 && localSuites.size > 0) {
            throw new Error("PSN returned an empty inventory for a player with known suites");
        }
        return new Map(suites.map(suite => [computeTrophyQuestSuiteUuid(suite.id), suite]));
    };

    let visibleSuites = await readInventory();
    let removedLinks = snapshot.filter(suite => !suite.hasEarnedTrophies && !visibleSuites.has(suite.suiteId));
    if (removedLinks.length > 0) {
        visibleSuites = await readInventory();
        removedLinks = removedLinks.filter(suite => !visibleSuites.has(suite.suiteId));
    }

    const suitesToImport: PsnPlayedSuite[] = [];
    for (const [suiteId, suite] of visibleSuites) {
        const localSuite = localSuites.get(suiteId);
        if (!localSuite || (suite.lastPlayedAt !== null &&
            (localSuite.lastPlayedAt === null || Date.parse(suite.lastPlayedAt) > localSuite.lastPlayedAt.getTime()))) {
            suitesToImport.push(suite);
        }
    }
    return {suitesToImport, removedLinks, visibleSuiteCount: visibleSuites.size};
}
