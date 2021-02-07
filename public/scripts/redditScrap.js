class RedditScrap {
    constructor() {
        this.retrievedData = {}
    }

    scrapUrl(after = '') {
        fetch(`https://www.reddit.com/domain/mmashare.fullfight.video/new.json?limit=100&after=${after}`)
            .then(d => d.json())
            .then(({ data: dataParent }) => {
                dataParent.children.forEach(({ data }) => this.retrievedData[data.url] = [data.title, data.url])
                this.retrievedData = Object.values(this.retrievedData)

                dataParent.after
                    ? this.scrapUrl(dataParent.after)
                    : this.startTreatment()
            })
    }

    async startTreatment() {
        // console.log(this.retrievedData)

        for (const [i, [title, source]] of this.retrievedData.reverse().entries()) {
            await this.feedTreatment(title, source)
            console.info(`${parseInt((i + 1) / this.retrievedData.length * 100)}%`)
        }
    }

    async feedTreatment(title, source) {
        title = title
            .replaceAll(/updated/ig, '')
            .replace(':', '')
            .replace(/\s+/g, ' ')
            .trim()

        const responseScrap = await fetch(source)

        if (responseScrap.status !== 404) {
            const
                dataScrap = await responseScrap.text(),
                template = document.createElement('template')

            template.innerHTML = dataScrap

            source = template.content.querySelector('video>source[src]')?.src

            if (title && source) {
                fetch('http://localhost:3000/graphql', {
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
                }).then(() => console.log(`${source} has been added`))
            }
        }
    }
}


document.getElementById('redditScrap').addEventListener('click', () => new RedditScrap().scrapUrl())
