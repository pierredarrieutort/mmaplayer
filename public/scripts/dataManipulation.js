import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.esm.min.js'

function displayFeed(feed) {
    const feedWrapper = document.getElementById('thumbsContainer')

    feed.forEach(({ title, source }) => {
        const
            containerTag = document.createElement('article'),
            titleTag = document.createElement('p')

        containerTag.className = 'item'
        titleTag.textContent = title

        containerTag.append(titleTag)

        Array.from(source.split(',')).forEach(link => {

            if (link.includes('dailymotion')) {
                const dailymotionWrapper = document.createElement('div')

                dailymotionWrapper.className = 'dailymotionWrapper'
                dailymotionWrapper.style = 'width:100%;border-radius:10px;overflow:hidden;'
                dailymotionWrapper.innerHTML = `
                    <iframe frameborder="0" type="text/html" 
                    data-src="${link}" 
                    width="100%" height="100%" allowfullscreen>
                    </iframe>
                `

                containerTag.append(dailymotionWrapper)
            } else {
                const
                    videoTag = document.createElement('video'),
                    sourceTag = document.createElement('source'),
                    [videoCurrentTime, videoDuration] = localStorage.getItem(link)?.split(',') ?? [0.5, 0.5],
                    figureTag = document.createElement('figure'),
                    figcaptionTag = document.createElement('figcaption'),
                    progressTag = document.createElement('progress')

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
                    console.error(title, this.error)
                    this.closest('.item').remove()
                }
                videoTag.ontimeupdate = () => {
                    if (videoTag.readyState === 4 && videoTag.currentTime > 5)
                        this.updateVideoProgressbar(videoTag)
                }
                videoTag.onloadeddata = () => {
                    videoTag.style.background = 'none'
                    videoTag.previousElementSibling.style.opacity = 1
                }

                sourceTag.dataset.preload = `${link}#t=${videoCurrentTime}`

                progressTag.max = 100
                progressTag.value = videoDuration === 0.5
                    ? 0
                    : (videoCurrentTime / videoDuration) * 100

                figcaptionTag.append(progressTag)
                figureTag.append(figcaptionTag, videoTag)
                videoTag.append(sourceTag)
                containerTag.append(figureTag)
            }
        })
        feedWrapper.append(containerTag)
    })
    applyElementsEvents()
}

function applyElementsEvents() {
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

function updateVideoProgressbar(item, completeCheckup = false) {
    const video = completeCheckup
        ? item.getElementsByTagName('video')[0]
        : item

    if (!completeCheckup)
        video.previousElementSibling.firstElementChild.value = (video.currentTime / video.duration) * 100

    if (video.currentTime > 5)
        localStorage.setItem(item.querySelector('[src]').src.match(/.*(?=#)/)[0], [video.currentTime, video.duration])
}

function filterItems() {
    if (!this.value.length) {
        scroll({
            top: 0,
            left: 0,
            behavior: 'smooth'
        })
        Array.from(document.getElementById('thumbsContainer').children).forEach(item => item.style.display = 'flex')
    } else {
        const list = Array.from(document.getElementById('thumbsContainer').children).map(item => {
            item.style.display = 'none'

            return {
                domRef: item,
                title: item.textContent
            }
        })

        const fuse = new Fuse(list, { keys: ['title'] })

        fuse.search(this.value)
            .forEach(({ item }) => item.domRef.style.display = 'flex')
    }
}

addEventListener('DOMContentLoaded', () => fetch('/retrievedata')
    .then(d => d.json())
    .then(({ data }) => {
        displayFeed(data.events)
        document.getElementById('searchBar').addEventListener('input', filterItems)

        addEventListener("beforeunload",
            () => Array.from(document.getElementById('thumbsContainer').children).forEach(item =>
                updateVideoProgressbar(item, true)
            )
        )
    })
)