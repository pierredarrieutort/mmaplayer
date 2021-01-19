import regeneratorRuntime from "regenerator-runtime"

export default class Extractor {
    constructor() {
        this.domain = 'https://feeds.feedburner.com/ffvideo'
        this.feed = localStorage.getItem('treatedMMA')
            ? JSON.parse(localStorage.getItem('treatedMMA'))
            : null
    }

    loading(status) {
        if (status) {
            document.body.classList.add('loading')
        } else {
            document.body.classList.remove('loading')
        }
    }

    async getMainPage() {
        this.loading(true)

        const lastTimeUpdate = parseInt(new Date(
            new Date - new Date(localStorage.getItem('lastUpdate'))
        ).getTime() / (1000 * 60))

        if (this.feed && lastTimeUpdate < 30)
            this.displayFeed()
        else {
            let response = await fetch(`https://cors-anywhere.herokuapp.com/${this.domain}`)
            let data = await response.text()

            const template = document.createElement('template')
            template.innerHTML = data

            this.feed = template.content.getElementById("bodyblock").getElementsByTagName('LI')
            localStorage.setItem('lastUpdate', new Date)

            this.feedTreatment()
        }
    }

    async feedTreatment() {
        const treatingData = [...this.feed].map(async el => {
            const
                [itemTitle] = el.querySelector('.itemtitle').textContent.match(new RegExp(/[^(?<=updated\s?:\s?)]\S.*/, 'i')),
                rawDataLink = el.querySelector('.itemcontent a').href

            const response = await fetch('https://cors-anywhere.herokuapp.com/' + rawDataLink)
            const data = await response.text()

            const template = document.createElement('template')
            template.innerHTML = data

            const
                videoPlayer = template.content.querySelector('video'),
                videoSource = videoPlayer?.querySelector('source').src

            if (videoPlayer && videoSource) {
                return {
                    title: itemTitle,
                    source: videoSource
                }
            } else {
                console.warn(itemTitle)
                return
            }
        })

        const res = await Promise.all(treatingData)

        this.feed = res.filter(Boolean)
        localStorage.setItem('treatedMMA', JSON.stringify(this.feed))

        this.displayFeed()
    }

    displayFeed() {
        const feedWrapper = document.createElement('section')

        feedWrapper.id = 'thumbsContainer'

        this.feed.forEach(({ title, source }) => {
            if (title && source) {
                const elementContainer = document.createElement('article')
                elementContainer.className = 'item'
                elementContainer.textContent = title

                const
                    videoTag = document.createElement('video'),
                    sourceTag = document.createElement('source'),
                    videoCurrentTime = localStorage.getItem(JSON.stringify(title)) ?? 0.5

                videoTag.onmouseenter = () => videoTag.setAttribute('controls', true)
                videoTag.onmouseleave = () => videoTag.removeAttribute('controls')
                videoTag.onerror = function () {
                    console.log(title, this.error)
                    this.parentElement.remove()
                }

                sourceTag.dataset.preload = `${source}#t=${videoCurrentTime}`

                videoTag.append(sourceTag)
                elementContainer.append(videoTag)
                feedWrapper.append(elementContainer)
            }
        })

        document.body.append(feedWrapper)
        this.applyElementsEvents()
        this.loading(false)
    }

    applyElementsEvents() {
        const items = document.getElementsByClassName('item')

        Array.from(items).forEach(el => {
            new IntersectionObserver(([entry]) => {
                const
                    isInWindow = entry.isIntersecting,
                    sourceTag = el.firstElementChild.firstElementChild,
                    preloadPath = sourceTag.dataset.preload

                if (preloadPath && isInWindow) {
                    sourceTag.src = preloadPath
                    sourceTag.removeAttribute('data-preload')
                    el.firstElementChild.load()
                }

                el.firstElementChild.preload = isInWindow ? 'metadata' : 'none'
                entry.target.style.opacity = Number(isInWindow)
                // entry.target.style.contentVisibility = isInWindow ? 'visible' : 'hidden'
            }, { threshold: .25 }).observe(el)
        })
    }
}

function filterItems() {
    Array.from(document.getElementById('thumbsContainer').children).forEach(item => {
        const isIncluded = item.textContent.toLowerCase().includes(this.value.toLowerCase())
        item.style.display = (isIncluded || !this.value) ? 'flex' : 'none'
    })
}

addEventListener('DOMContentLoaded', function () {
    new Extractor().getMainPage()

    document.getElementById('searchBar').addEventListener('keyup', filterItems)

    addEventListener("beforeunload",
        () => Array.from(document.getElementById('thumbsContainer').children).forEach(item => {
            const videoTime = item.firstElementChild.currentTime

            if (videoTime > 5)
                localStorage.setItem(JSON.stringify(item.textContent), videoTime)
        })
    )
})
