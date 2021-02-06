function fetchData() {
    fetch('http://localhost:3000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: `{
                    events {
                        _id
                        source
                    }
                }`
        }),
    })
        .then(e => e.json())
        .then(({ data }) => findAndDeleteDuplicates(data.events))
}


function findAndDeleteDuplicates(data) {
    const
        dataValues = data.map(Object.values),
        dataSubSources = data.map(val => Object.values(val)[1]),
        dataSubIds = data.map(val => Object.values(val)[0])

    dataValues.forEach(([_, val], i) => {
        const index = dataSubSources.indexOf(val, i + 1)

        if (index > 0) {
            fetch('http://localhost:3000/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `mutation {
                        deleteById(_id: "${dataSubIds[index]}") {
                            _id
                            title
                            source
                        }
                    }`
                }),
            })
        }
    })
}


document.getElementById('findAndDeleteDuplicates').addEventListener('click', fetchData)
