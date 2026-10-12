import {AuthorizationPayload, exchangeAccessCodeForAuthTokens, exchangeNpssoForAccessCode} from "psn-api";


export async function getAuthorizationPayload(npsso: string): Promise<AuthorizationPayload> {
    const accessCode = await exchangeNpssoForAccessCode(npsso);
    return await exchangeAccessCodeForAuthTokens(accessCode);
}