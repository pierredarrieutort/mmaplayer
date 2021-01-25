import { GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLID } from 'graphql'

export default new GraphQLObjectType({
  name: 'Event',
  description: 'Event object',
  fields: () => ({
    _id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    title: {
      type: new GraphQLNonNull(GraphQLString)
    },
    source: {
      type: new GraphQLNonNull(GraphQLString)
    }
  })
})
