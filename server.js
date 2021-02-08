import path from 'path'
import express from 'express'
import sassMiddleware from 'node-sass-middleware'
import browserSync from 'browser-sync'
import nodeFetch from 'node-fetch'
import bodyParser from 'body-parser'

import mongoose from 'mongoose'
import { GraphQLObjectType, GraphQLSchema } from 'graphql'
import { graphqlHTTP } from 'express-graphql'

import eventQueries from './models/event/eventQueries'
import eventMutations from './models/event/eventMutations'


const app = express()

app.set('views', path.resolve('views'))
app.set('view engine', 'ejs')

app.use(sassMiddleware({
    src: path.resolve('public'),
    dest: path.resolve('public'),
    indentedSyntax: false,
    outputStyle: 'compressed'
}))

app.use(express.static('public'))

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Listening on http://localhost:${port}`))

if (process.argv[2] === 'dev')
    browserSync({
        files: ['**/**.{ejs,js,scss}'],
        online: false,
        open: false,
        port: port + 1,
        proxy: 'localhost:' + port,
        ui: false
    })

app.get('/', (req, res) => res.render('index'))




const RootQuery = new GraphQLObjectType({
    name: 'Query',
    description: 'Realize Root Query',
    fields: () => ({
        events: eventQueries.events,
        eventBySource: eventQueries.eventBySource,
        latestEventSource: eventQueries.latestEventSource
    })
})

const RootMutation = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Realize Root Mutations',
    fields: () => ({
        addEvent: eventMutations.addEvent,
        deleteById: eventMutations.deleteById
    })
})

const schema = new GraphQLSchema({
    query: RootQuery,
    mutation: RootMutation
})

var _0xe8c6 = ["\x6D\x6D\x61\x70\x6C\x61\x79\x65\x72", "\x43\x6C\x75\x73\x74\x65\x72\x30\x5F\x72\x6F\x6F\x74", "\x6D\x6F\x6E\x67\x6F\x64\x62\x2B\x73\x72\x76\x3A\x2F\x2F\x43\x6C\x75\x73\x74\x65\x72\x30\x5F\x72\x6F\x6F\x74\x3A", "\x40\x63\x6C\x75\x73\x74\x65\x72\x30\x2E\x62\x78\x72\x6D\x38\x2E\x6D\x6F\x6E\x67\x6F\x64\x62\x2E\x6E\x65\x74\x2F", "\x3F\x72\x65\x74\x72\x79\x57\x72\x69\x74\x65\x73\x3D\x74\x72\x75\x65\x26\x77\x3D\x6D\x61\x6A\x6F\x72\x69\x74\x79", "\x63\x6F\x6E\x6E\x65\x63\x74"]; const dbn = _0xe8c6[0], pas = _0xe8c6[1]; mongoose[_0xe8c6[5]](`${_0xe8c6[2]}${pas}${_0xe8c6[3]}${dbn}${_0xe8c6[4]}`, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })

app.use(
    '/graphql',
    graphqlHTTP({
        schema: schema,
        graphiql: true,
    }),
)

mongoose.connection.on('error', err => console.error('Mongoose default connection error: ' + err))
mongoose.connection.on('connected', () => console.info('Mongoose connected'))

app.get('/retrievedata', (req, res) =>
    nodeFetch(`http://localhost:${port}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: `{
                events {
                    title
                    source
                    created_at
                }
            }`
        }),
    })
        .then(d => d.json())
        .then(d => res.json(d))
)

app.get('/maintenance', (req, res) => res.render('maintenance'))

const stringParser = bodyParser.text()
app.post('/fixunavailablevideo', stringParser, ({ body }, res) =>
    nodeFetch(`http://localhost:${port}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: `mutation {
                        deleteById(source: "${body}") {
                            title
                        }
                    }`
        }),
    })
        .then(d => d.json())
        .then(d => res.json(d))
)
