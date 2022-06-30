import express, { Express, Router } from 'express'
import corsMiddleware from 'cors'
import cookieParserMiddleware from 'cookie-parser'
import bodyParserMiddleware from 'body-parser'
import { multipartFormDataMiddleware } from './middleware/multipartFormData'
import { originValidator as originValidatorCreator } from './middleware/cors'
import { ProvidedOptionsType } from '../types'
import {
    securityMiddleware,
    checkForUserMiddleware,
} from './middleware/security'

// TODO: should use rete limiter to prevent denial of service https://lgtm.com/rules/1506065727959/

const defaultOptions: ProvidedOptionsType = {
    cors: true,
    security: true,
}
let expressService: Express | undefined

const prepareOptions = (providedOptions: ProvidedOptionsType) =>
    Object.assign(defaultOptions, providedOptions)

const initMiddleware = (
    service: Express | Router,
    options: ProvidedOptionsType,
) => {
    if (service) {
        // PREPARE
        // ==============================================
        const { cors, security, allowedOrigins, dbMiddleware } =
            prepareOptions(options)

        // INSTALL MIDDLEWARE
        // ==============================================
        if (cors) {
            if (allowedOrigins) {
                const originValidator = originValidatorCreator(allowedOrigins)
                service.use(corsMiddleware({ origin: originValidator }))
            } else {
                service.use(corsMiddleware({ origin: true }))
            }
        }

        service.use(cookieParserMiddleware())
        service.use(multipartFormDataMiddleware)
        service.use(bodyParserMiddleware.json())

        if (security) {
            service.use(securityMiddleware)
            service.use(checkForUserMiddleware)
        }

        if (dbMiddleware) {
            service.use(dbMiddleware)
        }
    }

    return service
}

const initHttpsService = (options: ProvidedOptionsType): Express => {
    if (!expressService) {
        // INIT SERVICE
        // ==============================================
        expressService = express()
        expressService = initMiddleware(expressService, options) as Express
    }

    return expressService
}

export const getHttpsService = (options: ProvidedOptionsType = {}): Express =>
    initHttpsService(options)

const useFeature = (path: string, feature: Router) => {
    if (expressService) {
        expressService.use(path, feature)
    }
}

export const initHttpsRoute = (
    path = '/',
    options: ProvidedOptionsType = {},
    initAppOptions: ProvidedOptionsType = {},
): Router => {
    getHttpsService(initAppOptions)
    let featureRouter = express.Router({ mergeParams: true })
    featureRouter = initMiddleware(featureRouter, options) as Router
    useFeature(path, featureRouter)
    return featureRouter
}
