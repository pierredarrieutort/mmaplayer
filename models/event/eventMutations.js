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
      },
      created_at: {
        name: 'created_at',
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve: event.addEvent
  },
  deleteById: {
    type: eventType,
    args: {
      _id: {
        type: GraphQLString
      }
    },
    resolve: event.deleteEventById
  }
}
