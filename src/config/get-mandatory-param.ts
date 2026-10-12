export function getMandatoryParam(configParam: string): string {
    if (process.env[configParam] === undefined) {
        throw new Error(`${configParam} params must be provided`)
    } else {
        return process.env[configParam];
    }
}