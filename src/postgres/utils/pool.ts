import {Pool} from "pg";
import {getMandatoryParam} from "../../config/get-mandatory-param";

export function buildPostgresPool(): Pool {
    return new Pool({
        host: getMandatoryParam("PG_HOST"),
        port: Number(getMandatoryParam("PG_PORT")),
        database: getMandatoryParam("PG_DATABASE"),
        user: getMandatoryParam("PG_USER"),
        password: getMandatoryParam("PG_PASSWORD"),
        ssl: process.env.PG_SSL === "true" ? {rejectUnauthorized: false} : undefined,
    });
}