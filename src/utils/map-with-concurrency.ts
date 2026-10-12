export async function mapWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let index = 0;

    async function worker() {
        while (true) {
            const i = index++;
            if (i >= items.length) break;
            results[i] = await fn(items[i]);
        }
    }

    const workers = Array.from(
        {length: Math.min(concurrency, items.length)},
        () => worker()
    );

    await Promise.all(workers);
    return results;
}
