// Top npm packages by weekly downloads — used as typosquat corpus.
// Sourced from npmjs.com/browse/depended and download stats (2026).
export const POPULAR_PACKAGES: readonly string[] = [
  // core utilities
  'lodash', 'underscore', 'ramda', 'date-fns', 'moment', 'dayjs',
  'uuid', 'nanoid', 'shortid', 'cuid',
  'chalk', 'colors', 'kleur', 'picocolors', 'ansi-colors',
  'debug', 'loglevel', 'pino', 'winston', 'bunyan',
  'dotenv', 'cross-env', 'env-var',
  'commander', 'yargs', 'minimist', 'meow', 'caporal', 'cac',
  'inquirer', 'prompts', 'enquirer',
  'ora', 'listr', 'progress',
  'glob', 'fast-glob', 'globby', 'micromatch', 'minimatch', 'picomatch',
  'rimraf', 'del', 'make-dir', 'mkdirp', 'fs-extra', 'graceful-fs',
  'chokidar', 'node-watch',
  'semver', 'compare-versions',

  // http / networking
  'axios', 'node-fetch', 'got', 'superagent', 'needle', 'undici',
  'ky', 'cross-fetch', 'isomorphic-fetch',
  'ws', 'socket.io', 'socket.io-client',
  'http-proxy', 'http-proxy-middleware',
  'express', 'koa', 'fastify', 'hapi', 'restify', 'polka', 'connect',
  'cors', 'helmet', 'morgan', 'body-parser', 'cookie-parser',
  'multer', 'busboy', 'formidable',

  // auth / crypto
  'jsonwebtoken', 'passport', 'passport-local', 'passport-jwt',
  'bcrypt', 'bcryptjs', 'argon2', 'scrypt-js',
  'crypto-js', 'forge', 'node-forge',
  'oauth', 'oauth2',

  // parsing / serialisation
  'xml2js', 'fast-xml-parser', 'cheerio', 'htmlparser2',
  'csv-parse', 'papaparse', 'xlsx',
  'marked', 'markdown-it', 'remark',
  'yaml', 'js-yaml', 'toml',
  'ajv', 'joi', 'yup', 'zod', 'superstruct',

  // bundlers / build
  'webpack', 'rollup', 'parcel', 'esbuild', 'vite', 'turbopack',
  'babel-core', '@babel/core', '@babel/cli',
  'typescript', 'ts-node', 'ts-jest', 'tsup', 'tsc-alias',
  'eslint', 'prettier', 'tslint',
  'postcss', 'tailwindcss', 'autoprefixer',

  // testing
  'jest', 'vitest', 'mocha', 'jasmine', 'ava', 'tap', 'tape',
  'chai', 'sinon', 'nock', 'supertest', 'playwright', 'cypress', 'puppeteer',
  '@testing-library/react', '@testing-library/dom',

  // react / frontend
  'react', 'react-dom', 'react-router', 'react-router-dom',
  'redux', 'react-redux', '@reduxjs/toolkit',
  'mobx', 'zustand', 'jotai', 'recoil', 'valtio',
  'styled-components', 'emotion', '@emotion/react', '@emotion/styled',
  'framer-motion', 'react-spring',
  'next', 'gatsby', 'remix', 'astro', 'nuxt', 'svelte',

  // databases / ORMs
  'mongoose', 'mongodb', 'pg', 'mysql', 'mysql2',
  'sequelize', 'typeorm', 'prisma', 'drizzle-orm', 'knex',
  'redis', 'ioredis', 'memcached',
  'better-sqlite3', 'sqlite3',

  // cloud / infra
  'aws-sdk', '@aws-sdk/client-s3', '@aws-sdk/client-dynamodb',
  'firebase', 'firebase-admin',
  '@google-cloud/storage', '@azure/storage-blob',
  'stripe', 'twilio', 'sendgrid', '@sendgrid/mail',

  // process / system
  'pm2', 'nodemon', 'concurrently', 'npm-run-all',
  'execa', 'cross-spawn', 'shelljs',
  'node-cron', 'cron', 'bull', 'bullmq', 'agenda',
  'compression', 'serve', 'static',

  // misc popular
  'lodash-es', 'core-js', 'tslib', 'regenerator-runtime',
  'classnames', 'clsx',
  'immer', 'immutable',
  'rxjs', 'xstate',
  'p-limit', 'p-queue', 'p-map', 'p-retry',
  'retry', 'async', 'bluebird',
  'mime', 'mime-types', 'content-type',
  'qs', 'query-string', 'urlcat',
  'validator', 'dompurify', 'sanitize-html',
  'socket.io', 'socket.io-client',
  'sharp', 'jimp', 'canvas',
  'pdf-lib', 'pdfkit',
  'nodemailer', 'mailgun-js',
]
