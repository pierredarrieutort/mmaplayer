import { GraphQLString, GraphQLNonNull } from 'graphql'

import eventType from './eventType'
import event from './eventSchema'

export default {
    addEvent: {
        type: eventType,
        args: {
            title: {
                name: 'title',
                type: new GraphQLNonNull(GraphQLString)
            },
            source: {
                name: 'source',
                type: new GraphQLNonNull(GraphQLString)
            }
        },
        resolve: event.addEvent
    }
}
