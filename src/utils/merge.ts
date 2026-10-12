export function mergeByKey<T>(
    acc: T[],
    current: T[],
    getKey: (t: T) => string
): T[] {
    const seen = new Set(acc.map(getKey));
    const result = [...acc];

    for (const item of current) {
        const key = getKey(item);
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(item);
    }

    return result;
}