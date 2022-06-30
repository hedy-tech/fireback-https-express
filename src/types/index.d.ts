import { Request, Response, NextFunction } from 'express'

export type ProvidedOptionsType = {
    cors?: boolean
    allowedOrigins?: Array<string>
    security?: boolean
    dbMiddleware?: MiddlewareMethod
}

export type MiddlewareMethod = (
    req: Request,
    res: Response,
    next: NextFunction,
) => Promise<void>

export interface MysqlInit {
    mysqlMiddleware: MiddlewareMethod
    mysqlSimpleStart: () => Promise<boolean>
}
