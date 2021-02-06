function fetchLatestData() {
    fetch('http://localhost:3000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: `{
                    latestEventSource {
                        source
                    }
                }`
        }),
    })
        .then(e => e.json())
        .then(console.log)
}

document.getElementById('updateList').addEventListener('click', fetchLatestData)
