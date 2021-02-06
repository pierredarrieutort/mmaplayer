import { GraphQLString, GraphQLList } from 'graphql'

import eventType from './eventType'
import event from './eventSchema'

export default {
  events: {
    type: new GraphQLList(eventType),
    resolve: event.getListOfEvents
  },
  eventBySource: {
    type: eventType,
    args: {
      source: {
        type: GraphQLString
      }
    },
    resolve: event.getEventBySource
  },
  latestEventSource: {
    type: eventType,
    args: {
      source: {
        type: GraphQLString
      }
    },
    resolve: event.getLatestEventBySource
  }
}
