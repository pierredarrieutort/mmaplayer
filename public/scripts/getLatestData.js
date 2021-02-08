let latestSource = ''

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
        .then(({ data }) => {
            latestSource ??= data.latestEventSource.source

            getLastRedditEvent()
        })
}


function getLastRedditEvent(after = '') {
    fetch(`https://www.reddit.com/domain/mmashare.fullfight.video/new.json?limit=1&after=${after}`)
        .then(e => e.json())
        .then(({ data: dataParent }) =>
            dataParent.children[0]
                ? feedTreatment(
                    dataParent.children[0]?.data.title,
                    dataParent.children[0]?.data.url,
                    dataParent.children[0]?.data.created_utc,
                    dataParent.after
                )
                : console.info('scrap ended')
        )
}

async function feedTreatment(title, source, created_at, after) {
    const responseScrap = await fetch('https://api.allorigins.win/raw?url=' + source)

    if (responseScrap.status !== 404) {
        const
            dataScrap = responseScrap.ok && await responseScrap.text(),
            template = document.createElement('template')

        template.innerHTML = dataScrap

        source = template.content.querySelector('video>source[src]')?.src

        if (source !== latestSource) {
            title = title
                .replaceAll(/updated/ig, '')
                .replace(':', '')
                .replace(/\s+/g, ' ')
                .trim()

            if (title && source && created_at)
                fetch('http://localhost:3000/graphql', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: `mutation {
                        addEvent(title: "${title}", source: "${source}", created_at: "${created_at}") {
                            title
                            source
                            created_at
                        }
                    }`
                    })
                }).then(() => console.info(`${title} has been added`))

            getLastRedditEvent(after)
        } else {
            console.info('Up to date, db cleaning...')
            fetchData()
        }
    }
}

document.getElementById('updateList').addEventListener('click', fetchLatestData)
