(function scrapUrl(after = '') {
    nodeFetch(`https://www.reddit.com/domain/mmashare.fullfight.video.json?limit=100&after=${after}`)
        .then(d => d.json())
        .then(d => {
            d.data.children.forEach(({ data }) => {
                // console.info(data.title, data.url)
                nodeFetch('http://localhost:4000/graphql', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: ` mutation {
                            addEvent(title: "${data.title}", source: "${data.url}") {
                                title
                                source
                            }
                        }`
                    }),
                })
                    .then(d => d.json())
                    .then(console.info)
            })
            return d.data.after && scrapUrl(d.data.after)
        })
})()
