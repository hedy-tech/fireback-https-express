// Following https://firebase.google.com/docs/functions/unit-testing
import { expect } from 'chai'

import { initHttpsRoute } from '../src/index'

const checkIfIsExpressService = (service: any) => {
    expect(service.get).to.exist
    expect(service.post).to.exist
    expect(service.put).to.exist
    expect(service.delete).to.exist
    expect(Array.isArray(service.stack)).to.true
}

const hasCookieParser = (service: any) => {
    const stack: Record<string, any>[] = service.stack
    return !!stack.find(item => item.name === 'cookieParser')
}

const hasMultipartFormData = (service: any) => {
    const stack: Record<string, any>[] = service.stack
    return !!stack.find(item => item.name === 'multipartFormDataMiddleware')
}

const hasJsonParser = (service: any) => {
    const stack: Record<string, any>[] = service.stack
    return !!stack.find(item => item.name === 'jsonParser')
}

const hasCorsMiddleware = (service: any) => {
    const stack: Record<string, any>[] = service.stack
    return !!stack.find(item => item.name === 'corsMiddleware')
}

const hasSecurityMiddleware = (service: any) => {
    const stack: Record<string, any>[] = service.stack
    return !!stack.find(item => item.name === 'securityMiddleware')
}

const hasCheckForUserMiddleware = (service: any) => {
    const stack: Record<string, any>[] = service.stack
    return !!stack.find(item => item.name === 'checkForUserMiddleware')
}

describe('fireback-https-express', () => {
    describe('initHttpsRoute', () => {
        it('should return an Express Route', () => {
            const toTest = initHttpsRoute()
            checkIfIsExpressService(toTest)
            expect(toTest.stack).to.length(6)
        })
        it('should return the same Express Route if requested again', () => {
            const toTest = initHttpsRoute()
            checkIfIsExpressService(toTest)
            expect(toTest.stack).to.length(6)
        })

        it('should return the Express Route with minimum setup', () => {
            const toTest = initHttpsRoute('/', {
                cors: false,
                security: false,
            })
            checkIfIsExpressService(toTest)

            expect(hasCookieParser(toTest)).to.true
            expect(hasMultipartFormData(toTest)).to.true
            expect(hasJsonParser(toTest)).to.true
            expect(hasCorsMiddleware(toTest)).to.false
            expect(hasSecurityMiddleware(toTest)).to.false
            expect(hasCheckForUserMiddleware(toTest)).to.false
        })

        it('should return the Express Route with minimum setup + cors', () => {
            const toTest = initHttpsRoute('/', {
                cors: true,
                security: false,
                allowedOrigins: ['*.correia.pw'],
            })
            checkIfIsExpressService(toTest)

            expect(hasCookieParser(toTest)).to.true
            expect(hasMultipartFormData(toTest)).to.true
            expect(hasJsonParser(toTest)).to.true
            expect(hasCorsMiddleware(toTest)).to.true
            expect(hasSecurityMiddleware(toTest)).to.false
            expect(hasCheckForUserMiddleware(toTest)).to.false
        })

        it('should return the Express Route with minimum setup + Security', () => {
            const toTest = initHttpsRoute('/', {
                cors: false,
                security: true,
            })
            checkIfIsExpressService(toTest)
            expect(hasCookieParser(toTest)).to.true
            expect(hasMultipartFormData(toTest)).to.true
            expect(hasJsonParser(toTest)).to.true
            expect(hasCorsMiddleware(toTest)).to.false
            expect(hasSecurityMiddleware(toTest)).to.true
            expect(hasCheckForUserMiddleware(toTest)).to.true
        })

        it('should return the Express Route with minimum setup + Mysql', () => {
            const toTest = initHttpsRoute('/', {
                cors: false,
                mysql: {
                    dbConfig: {
                        database: 'name',
                        host: 'local',
                        user: 'me',
                        pass: 'pass',
                        connection_name: 'connection',
                        socket_path: 'socker',
                        timezone: 'Stockholm/Europe',
                    },
                },
                security: false,
            })
            checkIfIsExpressService(toTest)

            expect(hasCookieParser(toTest)).to.true
            expect(hasMultipartFormData(toTest)).to.true
            expect(hasJsonParser(toTest)).to.true
            expect(hasCorsMiddleware(toTest)).to.false
            expect(hasSecurityMiddleware(toTest)).to.false
            expect(hasCheckForUserMiddleware(toTest)).to.false
        })
    })
})
