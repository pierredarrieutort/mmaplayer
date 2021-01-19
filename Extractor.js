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

        if (this.feed && lastTimeUpdate < 60)
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
                console.info(itemTitle, 'source error :', videoSource)
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
                const
                    containerTag = document.createElement('article'),
                    titleTag = document.createElement('p'),
                    videoTag = document.createElement('video'),
                    sourceTag = document.createElement('source'),
                    [videoCurrentTime, videoDuration] = localStorage.getItem(title)?.split(',') ?? [0.5, 0.5],
                    figureTag = document.createElement('figure'),
                    figcaptionTag = document.createElement('figcaption'),
                    progressTag = document.createElement('progress')

                containerTag.className = 'item'
                titleTag.textContent = title

                videoTag.onmouseenter = () => videoTag.setAttribute('controls', true)
                videoTag.onmouseleave = () => videoTag.removeAttribute('controls')
                videoTag.onplaying = () => {
                    this.updateVideoProgressbar(videoTag)
                    videoTag.previousElementSibling.removeAttribute('style')
                }
                videoTag.onpause = () => {
                    this.updateVideoProgressbar(videoTag)
                    videoTag.previousElementSibling.style.opacity = 1
                }
                videoTag.onerror = function () {
                    console.info(title, this.error)
                    this.closest('.item').remove()
                }
                videoTag.ontimeupdate = () => {
                    if (videoTag.readyState === 4)
                        this.updateVideoProgressbar(videoTag)
                }
                videoTag.onloadeddata = () => videoTag.previousElementSibling.style.opacity = 1

                sourceTag.dataset.preload = `${source}#t=${videoCurrentTime}`

                progressTag.max = 100
                progressTag.value = videoDuration === 0.5
                    ? 0
                    : (videoCurrentTime / videoDuration) * 100

                figcaptionTag.append(progressTag)
                figureTag.append(figcaptionTag, videoTag)
                videoTag.append(sourceTag)
                containerTag.append(titleTag, figureTag)
                feedWrapper.append(containerTag)
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
                    [sourceTag] = el.getElementsByTagName('source'),
                    [videoTag] = el.getElementsByTagName('video'),
                    preloadPath = sourceTag.dataset.preload

                if (preloadPath && isInWindow) {
                    sourceTag.src = preloadPath
                    sourceTag.removeAttribute('data-preload')
                    videoTag.load()
                }

                videoTag.preload = isInWindow ? 'metadata' : 'none'
                entry.target.style.opacity = Number(isInWindow)
            }, { threshold: .25 }).observe(el)
        })
    }

    updateVideoProgressbar(item, loopAll = false) {
        const video = loopAll
            ? item.getElementsByTagName('video')[0]
            : item

        video.previousElementSibling.firstElementChild.value = (video.currentTime / video.duration) * 100

        if (video.currentTime > 5)
            localStorage.setItem(item.textContent, [video.currentTime, video.duration])
    }
}

function filterItems() {
    Array.from(document.getElementById('thumbsContainer').children).forEach(item => {
        const isIncluded = item.textContent.toLowerCase().includes(this.value.toLowerCase())
        item.style.display = (isIncluded || !this.value) ? 'flex' : 'none'
    })
}

addEventListener('DOMContentLoaded', () => {
    const extractor = new Extractor()
    extractor.getMainPage()

    document.getElementById('searchBar').addEventListener('keyup', filterItems)

    addEventListener("beforeunload",
        () => Array.from(document.getElementById('thumbsContainer').children).forEach(item =>
            extractor.updateVideoProgressbar(item, true)
        )
    )
})
