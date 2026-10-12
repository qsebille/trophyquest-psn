import {v5 as uuidv5} from "uuid";

const NS_ROOT = 'f80e96f2-342c-45d5-9108-b24d9a5aa41c'

const NAMESPACES = {
    player: uuidv5("trophyquest:player", NS_ROOT),
    suite: uuidv5("trophyquest:suite", NS_ROOT),
    group: uuidv5("trophyquest:group", NS_ROOT),
    trophy: uuidv5("trophyquest:trophy", NS_ROOT),
};

export function computeTrophyQuestPlayerUuid(accountId: string) {
    return uuidv5(accountId, NAMESPACES.player);
}

export function computeTrophyQuestSuiteUuid(suiteId: string) {
    return uuidv5(suiteId, NAMESPACES.suite);
}

export function computeTrophyQuestGroupUuid(groupId: string) {
    return uuidv5(groupId, NAMESPACES.group);
}

export function computeTrophyQuestTrophyUuid(trophyId: string) {
    return uuidv5(trophyId, NAMESPACES.trophy);
}