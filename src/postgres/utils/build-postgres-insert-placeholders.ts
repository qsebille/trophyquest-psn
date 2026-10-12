export function buildPostgresInsertPlaceholders(array: string[], idx: number): string {
    const length = array.length;
    const base = idx * length;

    let stringBuffer: string[] = ["("];
    for (let i = 0; i < length; i++) {
        stringBuffer.push(`$${base + i + 1}`)
        if (i === length - 1) {
            stringBuffer.push(")");
        } else {
            stringBuffer.push(", ");
        }
    }

    return stringBuffer.join("");
}