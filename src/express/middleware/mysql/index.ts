// const dbConfig = require('firebase-functions').config().db

import { NextFunction, Request, Response } from 'express'
import mysql from 'promise-mysql'
import { MysqlInit, PoolConfigType, ProvideConfig } from '~/types'

interface DataMissingError extends ErrorConstructor {
    detail: any[]
    missing: any[]
    // addDetail: (message: string, code: string) => void
}
class DataMissingError extends Error {
    constructor(message: any, missing = [], code = 'DATA.MISSING') {
        super(message) // (1)
        this.name = 'DataMissingError' // (2)

        // (3)
        this.detail = []
        this.addDetail(message, code)
        this.missing = missing
    }

    addDetail(message: any, code = 'DATA.MISSING') {
        this.detail.push({ code, message })
    }

    getDetails() {
        return {
            log: this.detail,
            missing: this.missing,
        }
    }
}
const isDataMissingError = (value: unknown): value is DataMissingError => {
    if (typeof value !== 'object' || value === null) {
        return false
    }
    return value.constructor === DataMissingError
}

export const CONNECTION_TYPES = {
    TCP: 1,
    SOCKET: 2,
} as const
export type ConnectionType =
    typeof CONNECTION_TYPES[keyof typeof CONNECTION_TYPES]

export const MESSAGE_TYPE = {
    ERROR: 'ERROR',
    RECORD: 'RECORD',

    INFO: 'INFO',
    CONTENT: 'CONTENT',
} as const
export type MessageTypes = typeof MESSAGE_TYPE[keyof typeof MESSAGE_TYPE]

let connectionPool: mysql.Pool | undefined
let poolPromise: Promise<mysql.Pool> | undefined

export const init = (
    dbConfig: ProvideConfig,
    poolConfig?: PoolConfigType,
): MysqlInit => {
    const configMain = {
        user: dbConfig.user,
        password: dbConfig.pass,
        database: dbConfig.database,

        // Set UTC as timezone
        timezone: 'Z',
    }

    const dbTcpAddr = dbConfig.host ? dbConfig.host.split(':') : ''.split(':')
    const configTcp = {
        host: dbTcpAddr[0],
        port: parseInt(dbTcpAddr[1]),
    }

    const dbSocketPath = dbConfig.socket_path || '/cloudsql' //process.env.db.socket_path || '/cloudsql'
    const configSocket = {
        socketPath: `${dbSocketPath}/${dbConfig.connection_name}`, // process.env.db.connection_name
    }

    const connectionType = dbConfig.host
        ? CONNECTION_TYPES.TCP
        : CONNECTION_TYPES.SOCKET

    const createTcpPool = async (config: PoolConfigType) => {
        // Establish a connection to the database
        return await mysql.createPool(
            Object.assign(configMain, configTcp, config),
        )
    }

    const createUnixSocketPool = async (config: PoolConfigType) => {
        // Establish a connection to the database
        return await mysql.createPool(
            Object.assign(configMain, configSocket, config),
        )
    }

    const createPool = async () => {
        const config: PoolConfigType = {
            ...{
                // 'connectionLimit' is the maximum number of connections the pool is allowed
                // to keep at once.
                connectionLimit: 15,

                // 'connectTimeout' is the maximum number of milliseconds before a timeout
                // occurs during the initial connection to the database.
                connectTimeout: 10000, // 10 seconds
                // 'acquireTimeout' is the maximum number of milliseconds to wait when
                // checking out a connection from the pool before a timeout error occurs.
                acquireTimeout: 10000, // 10 seconds
                // 'waitForConnections' determines the pool's action when no connections are
                // free. If true, the request will queued and a connection will be presented
                // when ready. If false, the pool will call back with an error.
                waitForConnections: true, // Default: true
                // 'queueLimit' is the maximum number of requests for connections the pool
                // will queue at once before returning an error. If 0, there is no limit.
                queueLimit: 0, // Default: 0

                // The mysql module automatically uses exponential delays between failed
                // connection attempts.
            },
            ...poolConfig,
        }

        if (connectionType === CONNECTION_TYPES.TCP) {
            return await createTcpPool(config)
        } else {
            return await createUnixSocketPool(config)
        }
    }

    if (!poolPromise) {
        poolPromise = createPool()
            .then(async pool => {
                return pool
            })
            .catch(err => {
                console.log(err)
                process.exit(1)
            })
    }

    /** ---- Provided methoods ---- */

    const mysqlMiddleware = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        if (connectionPool) {
            return next()
        }
        try {
            connectionPool = await poolPromise
            return next()
        } catch (err) {
            console.log(err)
            return next(err)
        }
    }

    const mysqlSimpleStart = async () => {
        if (connectionPool) {
            return true
        }
        try {
            connectionPool = await poolPromise
            return true
        } catch (err) {
            console.log(err)
            return false
        }
    }

    return {
        mysqlMiddleware,
        mysqlSimpleStart,
    }
}

interface MysqlClient {
    startTransaction: () => Promise<boolean>
    rollback: () => Promise<void>
    commit: () => Promise<void>
    inTransaction: () => boolean
    finishConnection: () => Promise<void>
    query: (statement: string, variables: any[]) => Promise<any>
    getWithModel: (
        queryTemplate: string,
        criteriaFields: Record<string, any>,
        model: Record<string, any>,
        firstOnly?: boolean,
    ) => Promise<any>
    createWithModel: (
        json: Record<string, any>,
        model: Record<string, any>,
        sql?: string | undefined,
    ) => Promise<any>
    updateWithModel: (
        json: Record<string, any>,
        model: Record<string, any>,
    ) => Promise<any>
}
export const getMysqlClient = (): MysqlClient => {
    let conn: mysql.PoolConnection | undefined
    let transactionMode = false

    const startTransaction = async () => {
        if (!connectionPool) {
            return false
        }
        if (!conn) {
            try {
                const newConn = await connectionPool.getConnection()
                conn = newConn
                conn?.beginTransaction()
                transactionMode = true
            } catch (err) {
                return false
            }
        }
        return true
    }

    const rollback = async () => {
        if (conn) {
            await conn.rollback()
            transactionMode = false
            await finishConnection()
        }
    }

    const commit = async () => {
        if (conn) {
            await conn.commit()
            transactionMode = false
            await finishConnection()
        }
    }

    const inTransaction = () => transactionMode

    const finishConnection = async () => {
        if (conn) {
            await conn.release()
            conn = undefined
            // hooks.forEach(func => func())
        }
    }

    const query = async (statement: string, variables: any[]) => {
        if (conn) {
            // console.debug('Connection Query:\n', mysql.format(statement, variables))
            return await conn.query(statement, variables)
        }
        // console.debug('Pool Query:\n', mysql.format(statement, variables))
        if (!connectionPool) {
            return Promise.reject() // TODO: check if it is ok
        }
        return await connectionPool.query(statement, variables)
    }

    const getWithModel = async (
        queryTemplate: string,
        criteriaFields: Record<string, any>,
        model: Record<string, any>, // TODO: correct type
        firstOnly = false,
    ) => {
        const criteria = Array.isArray(criteriaFields)
            ? criteriaFields
            : [criteriaFields]
        try {
            const records = await query(queryTemplate, criteria)
            if (!records || records.length <= 0) {
                return { type: MESSAGE_TYPE.RECORD, record: '' }
            }
            const record = model.getJson(firstOnly ? records[0] : records)
            return { type: MESSAGE_TYPE.RECORD, record }
        } catch (error) {
            if (isDataMissingError(error)) {
                if (inTransaction()) throw new Error(error.message)
                return { type: MESSAGE_TYPE.ERROR, message: error.message }
            }
            return { type: MESSAGE_TYPE.ERROR, message: '' }
        }
    }

    const createWithModel = async (
        json: Record<string, any>,
        model: Record<string, any>, // TODO: correct type
        sql: string | undefined = undefined,
    ) => {
        let sqlToExecute = model.SQL.create
        if (sql) {
            sqlToExecute = sql
        }
        try {
            const createObject = model.getCreateObject(json)
            // console.log('SQL CREATEWITHMODEL ', createObject)
            const result = await query(sqlToExecute, [createObject.record])
            return { type: MESSAGE_TYPE.INFO, message: { result } }
        } catch (error) {
            if (isDataMissingError(error)) {
                if (inTransaction()) throw error
                return { type: MESSAGE_TYPE.ERROR, message: error.message }
            }
            return { type: MESSAGE_TYPE.ERROR, message: '' }
        }
    }

    const updateWithModel = async (
        json: Record<string, any>,
        model: Record<string, any>, // TODO: correct type
    ) => {
        const updateObject = model.getUpdateObject(json)
        // console.log('### UPDATE RECORD', updateObject)
        try {
            const whereArray = Object.keys(updateObject.where).reduce(
                (final, fieldName) => {
                    final.push(updateObject.where[fieldName])
                    return final
                },
                [] as any[],
            )
            const whereValues = [updateObject.record].concat(whereArray)
            await query(model.SQL.update, whereValues)
            return { type: MESSAGE_TYPE.INFO, message: 'SUCCESS' }
        } catch (error) {
            if (isDataMissingError(error)) {
                if (inTransaction()) throw new Error(error.message)
                return { type: MESSAGE_TYPE.ERROR, message: error.message }
            }
            return { type: MESSAGE_TYPE.ERROR, message: '' }
        }
    }

    return {
        startTransaction,
        rollback,
        commit,
        inTransaction,
        finishConnection,

        query,
        getWithModel,
        createWithModel,
        updateWithModel,
    }
}
