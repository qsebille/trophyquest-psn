import assert from "node:assert";
import test from "node:test";

import {buildPostgresInsertPlaceholders} from "./build-postgres-insert-placeholders.js";

test("builds placeholders for the first row", () => {
    const placeholders = buildPostgresInsertPlaceholders(["id", "name"], 0);

    assert.strictEqual(placeholders, "($1, $2)");
});

test("builds placeholders with the proper offset", () => {
    const placeholders = buildPostgresInsertPlaceholders(["first", "second", "third"], 2);

    assert.strictEqual(placeholders, "($7, $8, $9)");
});
