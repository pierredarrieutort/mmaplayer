import path from 'path'
import express from 'express'
import sassMiddleware from 'node-sass-middleware'
import browserSync from 'browser-sync'
import nodeFetch from 'node-fetch'

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

// browserSync({
//     files: ['**/**.{ejs,js,scss}'],
//     online: false,
//     open: false,
//     port: port + 1,
//     proxy: 'localhost:' + port,
//     ui: false
// })

app.get('/', (req, res) => res.render('index'))




const RootQuery = new GraphQLObjectType({
    name: 'Query',
    description: 'Realize Root Query',
    fields: () => ({
        events: eventQueries.events,
        eventByTitle: eventQueries.eventByTitle
    })
})

const RootMutation = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Realize Root Mutations',
    fields: () => ({
        addEvent: eventMutations.addEvent
    })
})

const schema = new GraphQLSchema({
    query: RootQuery,
    mutation: RootMutation
})

const
    dbname = 'mmaplayer',
    password = 'Cluster0_root'

mongoose.connect(`mongodb+srv://Cluster0_root:${password}@cluster0.bxrm8.mongodb.net/${dbname}?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})

app.use(
    '/graphql',
    graphqlHTTP({
        schema: schema,
        graphiql: true,
    }),
)

mongoose.connection.on('connected', () => console.info('Mongoose connected'))
mongoose.connection.on('error', err => console.error('Mongoose default connection error: ' + err))

app.get('/retrievedata', (req, res) =>
    nodeFetch(`http://localhost:${port}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: `{
                events {
                    title
                    source
                }
            }`
        }),
    })
        .then(d => d.json())
        .then(d => res.json(d))
)


app.get('/redditscrap', (req, res) => res.render('redditScrap'))
