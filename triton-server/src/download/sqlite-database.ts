import { Database } from "./download-types"
import SQLite from "better-sqlite3"
import { readFileSync } from "fs"
import { Kysely, SqliteDialect } from "kysely"
import { logger } from "../logger"

export async function createSQLite(
    path: string,
    schemaPath: string | undefined,
) {
    const database = new SQLite(path)

    if (schemaPath !== undefined) {
        const whitespaceOnlyRegex = /^\s*$/g
        const sqlExpressions = readFileSync(schemaPath, "utf8")
            .replace(/(\/\*(\n|[^\n])*?\*\/)|(--[^\n]*)/gm, "") // remove comments
            .split(";")
            .filter((s) => !whitespaceOnlyRegex.test(s)) // remove whitespace only string
            .map((s) => s.replace(/\n/g, ""))

        sqlExpressions.forEach((s) => {
            try {
                // await sql`${s}`.execute(db)
                const statement = database.prepare(s)
                statement.run()
            } catch (e) {
                logger.warn({ sql: s }, `createSQLite Error: ${String(e)}`)
            }
        })
    }
    const dialect = new SqliteDialect({
        database,
    })
    return new Kysely<Database>({
        dialect,
    })
}
