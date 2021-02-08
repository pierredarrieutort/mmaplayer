import mongoose from 'mongoose'

var eventSchema = new mongoose.Schema({
    title: String,
    source: String,
    created_at: String,
})

let event = mongoose.model('event', eventSchema)

module.exports = event

module.exports.getListOfEvents = () => {
    return new Promise((resolve, reject) => {
        event.find({})
            .sort({ created_at: -1 })
            .exec((err, res) => {
                err ? reject(err) : resolve(res)
            })
    })
}

module.exports.getEventBySource = (root, { source }) => {
    return new Promise((resolve, reject) => {
        event.findOne({
            source: source
        }).exec((err, res) => {
            err ? reject(err) : resolve(res)
        })
    })
}

module.exports.getLatestEventBySource = () => {
    return new Promise((resolve, reject) => {
        event.findOne({})
        .sort({ created_at: -1 })
            .exec((err, res) => {
                err ? reject(err) : resolve(res)
            })
    })
}

module.exports.addEvent = (root, { title, source, created_at }) => {
    let newEvent = new event({ title: title, source: source, created_at: created_at })

    return new Promise((resolve, reject) => {
        newEvent.save((err, res) => {
            err ? reject(err) : resolve(res)
        })
    })
}

module.exports.deleteEventById = (root, { _id }) => {
    return new Promise((resolve, reject) => {
        event.findOneAndDelete({
            _id: _id
        }).exec((err, res) => {
            err ? reject(err) : resolve(res)
        })
    })
}
