export type ProvideConfig = {
    user: string
    pass: string
    database: string
    host: string
    socket_path: string
    connection_name: string
    timezone: string // = 'Z',
}

export type PoolConfigType = {
    // 'connectionLimit' is the maximum number of connections the pool is allowed
    // to keep at once.
    connectionLimit: number

    // 'connectTimeout' is the maximum number of milliseconds before a timeout
    // occurs during the initial connection to the database.
    connectTimeout: number // 10 seconds
    // 'acquireTimeout' is the maximum number of milliseconds to wait when
    // checking out a connection from the pool before a timeout error occurs.
    acquireTimeout: number // 10 seconds
    // 'waitForConnections' determines the pool's action when no connections are
    // free. If true, the request will queued and a connection will be presented
    // when ready. If false, the pool will call back with an error.
    waitForConnections: boolean // Default: true
    // 'queueLimit' is the maximum number of requests for connections the pool
    // will queue at once before returning an error. If 0, there is no limit.
    queueLimit: number // Default: 0

    // The mysql module automatically uses exponential delays between failed
    // connection attempts.
}

export type ProvidedOptionsType = {
    cors?: boolean
    allowedOrigins?: Array<string>
    security?: boolean
    mysql?: {
        dbConfig: ProvideConfig
        poolConfig?: PoolConfigType
    }
}

export interface MysqlInit {
    mysqlMiddleware: (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => Promise<void>
    mysqlSimpleStart: () => Promise<boolean>
}
