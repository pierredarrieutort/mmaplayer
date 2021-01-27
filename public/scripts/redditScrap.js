let retrievedData = {};

(function scrapUrl(after = '') {
    fetch(`https://www.reddit.com/domain/mmashare.fullfight.video/new/.json?limit=100&after=${after}`)
        .then(d => d.json())
        .then(({ data: dataParent }) => {
            dataParent.children.forEach(({ data }) => retrievedData[data.url] = [data.title, data.url])
            retrievedData = Object.values(retrievedData)

            dataParent.after
                ? scrapUrl(dataParent.after)
                : startTreatment()
        })
})()

function startTreatment() {
    // console.log(retrievedData)
    retrievedData.reverse().forEach(([title, source], i) => setTimeout(
        async () => {
            await feedTreatment(title, source)
            console.info(`${parseInt((i + 1) / retrievedData.length * 100)}%`)
        },
        i
    ))
}

async function feedTreatment(title, source) {
    title = title.replaceAll(/updated/ig, '').replace(':', '').replace(/\s+/g, ' ').trim()

    const responseScrap = await fetch(/*'https://cors-anywhere.herokuapp.com/' + */source)
    const dataScrap = await responseScrap.text()

    const template = document.createElement('template')
    template.innerHTML = dataScrap

    source = Array.from(template.content.querySelector('video>source[src]')).map(({ src }) => src)

    if (title && source.length) {
        await fetch('http://localhost:3000/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: ` mutation {
                    addEvent(title: "${title}", source: "${source}") {
                        title
                        source
                    }
                }`
            })
        })
    }
    // else console.warn(title, 'source error')
}
