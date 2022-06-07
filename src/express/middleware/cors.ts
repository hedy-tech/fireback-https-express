export const originValidator =
    (origins: Array<string>) =>
    (
        origin: string | undefined,
        callback: (error: Error | null, options?: any) => void,
    ): void => {
        console.log('CORS: Requesting Origin', origin) // undefined
        console.log('CORS: Allower', origins)
        if (origin && origins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            const err = new Error('Not allowed by CORS')
            err.stack = ''
            callback(err)
        }
    }
