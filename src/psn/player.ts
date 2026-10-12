import {AuthorizationPayload} from "psn-api";

export interface PsnPlayer {
    id: string,
    pseudo: string,
    avatarUrl: string,
}


export async function fetchPsnPlayer(
    auth: AuthorizationPayload,
    profileName: string,
): Promise<PsnPlayer> {
    const {getProfileFromUserName} = await import("psn-api");

    const userPsn = await getProfileFromUserName(auth, profileName);
    const avatarUrls = userPsn.profile.avatarUrls;
    const avatarUrl = avatarUrls[avatarUrls.length - 1]?.avatarUrl ?? null;
    const profilePictureUrls = userPsn.profile.personalDetail?.profilePictureUrls ?? [];
    const profilePictureUrl = profilePictureUrls[profilePictureUrls.length - 1]?.profilePictureUrl ?? null;
    return {
        id: userPsn.profile.accountId,
        pseudo: userPsn.profile.onlineId,
        avatarUrl: profilePictureUrl ?? avatarUrl ?? null
    } as PsnPlayer;
}