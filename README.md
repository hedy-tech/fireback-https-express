<p align="center">
    <a href="https://travis-ci.com/github/dev-vortex/fireback-https-express"><img src="https://badgen.net/travis/dev-vortex/fireback-https-express?icon=travis&label=build"/></a>
    <a href="https://www.npmjs.com/package/@dev-vortex/fireback-https-express"><img src="https://badgen.net/npm/v/@dev-vortex/fireback-https-express?icon=npm&label"/></a>
    <a href="https://www.npmjs.com/package/@dev-vortex/fireback-https-express"><img src="https://badgen.net/npm/license/@dev-vortex/fireback-https-express?icon=npm"/></a> 
    <a href="https://www.npmjs.com/package/@dev-vortex/fireback-https-express"><img src="https://badgen.net/npm/types/@dev-vortex/fireback-https-express?icon=typescript"/></a> 
</p>

<p align="center">
    <a href="https://codeclimate.com/github/dev-vortex/fireback-https-express/maintainability"><img src="https://api.codeclimate.com/v1/badges/5419722b298d8f094d55x/maintainability"/></a>
    <a href="https://codeclimate.com/github/dev-vortex/fireback-https-express/test_coverage"><img src="https://api.codeclimate.com/v1/badges/5419722b298d8f094d55x/test_coverage"/></a>
</p>

<p align="center">
    <a href="http://commitizen.github.io/cz-cli/"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg"/></a>
    <a href="https://www.conventionalcommits.org/"><img src="https://img.shields.io/badge/conventional-commits-pink"/></a>
</p>

# Firebase Backend Https Plugin
This package aims to assist the firebase backend helper with a solution in express as the https engine. This will allow you to expose API endpoints with multiple functionality ouut of the box and allow you to add a DB middleware of your choice.

## Installation
```
yarn add @dev-vortex/fireback-https-express
```

or

```
npm install @dev-vortex/fireback-https-express
```

## Configuration
When preparing a route (entity functionality group), you will need to provide a configuuration that will be applied for all of them. This will need to follow the `ProvidedOptionsType`.

### Options
| Attribute      | Type               | Default     | Required |
| -------------- | ------------------ | ----------- | -------- |
| cors           | `boolean`          | `false`     | No       |
| allowedOrigins | `string[]`         | `undefined` | No       |
| security       | `boolean`          | `false`     | No       |
| dbMiddleware   | `MiddlewareMethod` | `undefined` | No       |

The service will apply the required rules and middlewares to add each one to it.

Security will ensure that the requesting party is authenticated and has a valid token.

Cors will only allow provided origins present in `allowedOrigins`.

If provided the service will ensure a connection pool to the database.

## Start a route
By calling `initHttpsRoute` it will return you with an express route interface with all the options applied.

This route interface will be the one to pass to fireback to be registered.

