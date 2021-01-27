(function fetchData() {
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
        .then(({ data }) => console.log(data.events))
})()
