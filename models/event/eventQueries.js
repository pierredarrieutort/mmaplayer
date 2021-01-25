import { GraphQLString, GraphQLList } from 'graphql'

import eventType from './eventType'
import event from './eventSchema'

export default {
  events: {
    type: new GraphQLList(eventType),
    resolve: event.getListOfEvents
  },
  eventByTitle: {
    type: eventType,
    args: {
      title: {
        type: GraphQLString
      }
    },
    resolve: event.getEventByTitle
  }
}
