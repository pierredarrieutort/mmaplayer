let retrievedData = {};

(function scrapUrl(after = '') {
    fetch(`https://www.reddit.com/domain/mmashare.fullfight.video/new/.json?limit=100&after=${after}`)
        .then(d => d.json())
        .then(({ data: dataParent }) => {
            dataParent.children.forEach(({ data }) => retrievedData[data.url] = [data.title, data.url])
            retrievedData = Object.values(retrievedData)

            if (dataParent.after)
                scrapUrl(dataParent.after)
            else
                startTreatment()
        })
})()

function startTreatment() {
    // console.log(retrievedData)
    retrievedData.reverse().forEach(([title, source], i) => setTimeout(
        async () => {
            await feedTreatment(title, source)
            console.info(`${parseInt((i + 1) / retrievedData.length * 100)}%`)
        },
        1000 * i
    ))
}

async function feedTreatment(title, source) {
    title = title.match(new RegExp(/(?:updated\s?:\s?)?(.+$)/, 'i'))[1]

    const responseScrap = await fetch(/*'https://cors-anywhere.herokuapp.com/' + */source)
    const dataScrap = await responseScrap.text()

    const template = document.createElement('template')
    template.innerHTML = dataScrap

    source = [...new Set(
        // Array.from(template.content.querySelectorAll('iframe[src*=dailymotion], source[src]'))
        Array.from(template.content.querySelectorAll('video>source[src]'))
            .map(({ src }) => src)
    )]

    if (title && source.length) {
        await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: ` mutation {
                    addEvent(title: "${title}", source: "${source}") {
                        title
                        source
                    }
                }`
            }),
        })
    } /*else return console.warn(title, 'source error')*/
}
