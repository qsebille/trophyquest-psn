import {buildTrophyQuestPlayer, TrophyQuestPlayer} from "./player";
import {buildTrophyQuestGroups, TrophyQuestGroup} from "./group";
import {buildTrophyQuestSuites, TrophyQuestSuite} from "./suite";
import {buildTrophyQuestTrophies, TrophyQuestTrophy} from "./trophy";
import {buildTrophyQuestPlayedSuites, TrophyQuestPlayedSuite} from "./played-suite";
import {buildTrophyQuestEarnedTrophies, TrophyQuestEarnedTrophy} from "./earned-trophy";
import {PsnPlayer} from "../psn/player";
import {PsnPlayedSuite} from "../psn/played-suite";
import {PsnEarnedTrophy} from "../psn/earned-trophy";
import {PsnGroup} from "../psn/group";
import {PsnTrophy} from "../psn/trophy";
import {mergeByKey} from "../utils/merge";

export const EMPTY_TROPHYQUEST_DATA: TrophyQuestData = {
    players: [],
    suites: [],
    groups: [],
    trophies: [],
    playedSuites: [],
    earnedTrophies: [],
} as TrophyQuestData;

export interface TrophyQuestData {
    players: TrophyQuestPlayer[]
    suites: TrophyQuestSuite[]
    groups: TrophyQuestGroup[]
    trophies: TrophyQuestTrophy[]
    playedSuites: TrophyQuestPlayedSuite[]
    earnedTrophies: TrophyQuestEarnedTrophy[]
}

export function mergeTrophyQuestData(acc: TrophyQuestData, current: TrophyQuestData): TrophyQuestData {
    return {
        players: [...acc.players, ...current.players],
        suites: mergeByKey(acc.suites, current.suites, s => s.id),
        groups: mergeByKey(acc.groups, current.groups, g => g.id),
        trophies: mergeByKey(acc.trophies, current.trophies, t => t.id),
        playedSuites: [...acc.playedSuites, ...current.playedSuites],
        earnedTrophies: [...acc.earnedTrophies, ...current.earnedTrophies],
    };
}

export function buildTrophyquestPlayerData(
    accountId: string,
    players: PsnPlayer[],
    playedSuites: PsnPlayedSuite[],
    trophies: PsnTrophy[],
    earnedTrophies: PsnEarnedTrophy[],
    groups: PsnGroup[],
) {
    return {
        players: buildTrophyQuestPlayer(players),
        suites: buildTrophyQuestSuites(playedSuites),
        groups: buildTrophyQuestGroups(groups),
        trophies: buildTrophyQuestTrophies(trophies),
        playedSuites: buildTrophyQuestPlayedSuites(accountId, playedSuites),
        earnedTrophies: buildTrophyQuestEarnedTrophies(accountId, earnedTrophies),
    } as TrophyQuestData
}