import {buildPostgresPool} from "./utils/pool";

export async function insertSuccessMetadata(lambdaName: string,
                                            durationMillis: number): Promise<void> {
    const pool = buildPostgresPool();
    const client = await pool.connect();
    try {
        await client.query(`
            INSERT INTO metadata.lambda_monitoring (lambda_name, status, duration_time_ms)
            VALUES ($1, 'SUCCESS', $2)`, [lambdaName, durationMillis])

        console.info("Inserted metadata into Postgres")
    } catch (err) {
        console.error("Error while inserting metadata into Postgres")
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}


export async function insertFailureMetadata(lambdaName: string,
                                            errorMessage: string): Promise<void> {
    const pool = buildPostgresPool();
    const client = await pool.connect();
    try {
        await client.query(`
            INSERT INTO metadata.lambda_monitoring (lambda_name, status, error_message)
            VALUES ($1, 'FAILURE', $2)`, [lambdaName, errorMessage])

        console.info("Inserted metadata into Postgres")
    } catch (err) {
        console.error("Error while inserting metadata into Postgres")
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

