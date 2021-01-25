import mongoose from 'mongoose'

var eventSchema = new mongoose.Schema({
    title: String,
    source: String,
})

let event = mongoose.model('event', eventSchema)

module.exports = event

module.exports.getListOfEvents = () => {
    return new Promise((resolve, reject) => {
        event.find({}).exec((err, res) => {
            err ? reject(err) : resolve(res)
        })
    })
}

module.exports.getEventByTitle = (root, { title }) => {
    return new Promise((resolve, reject) => {
        event.findOne({
            title: title
        }).exec((err, res) => {
            err ? reject(err) : resolve(res)
        })
    })
}

module.exports.addEvent = (root, { title, source }) => {
    var newEvent = new event({ title: title, source : source })

    return new Promise((resolve, reject) => {
        newEvent.save((err, res) => {
            err ? reject(err) : resolve(res)
        })
    })
}
