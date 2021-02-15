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

        const
            videoTag = document.createElement('video'),
            sourceTag = document.createElement('source'),
            [videoCurrentTime, videoDuration] = localStorage.getItem(source)?.split(',') ?? [0.5, 0.5],
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
            // console.error(title, this.error)
            fixUnavailableVideo(this.firstElementChild)
        }
        videoTag.ontimeupdate = () => {
            if (videoTag.readyState === 4 && videoTag.currentTime > 5)
                this.updateVideoProgressbar(videoTag)
        }
        videoTag.onloadeddata = () => {
            videoTag.style.background = 'none'
            videoTag.previousElementSibling.style.opacity = 1
        }

        sourceTag.dataset.preload = `${source}#t=${videoCurrentTime}`

        progressTag.max = 100
        progressTag.value = videoDuration === 0.5
            ? 0
            : (videoCurrentTime / videoDuration) * 100

        figcaptionTag.append(progressTag)
        figureTag.append(figcaptionTag, videoTag)
        videoTag.append(sourceTag)
        containerTag.append(figureTag)
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
        localStorage.setItem(item.querySelector('[src]').src.match(/.+(?=#)/)[0], [video.currentTime, video.duration])
}

function filterItems() {
    if (!this.value.length) {
        scrollToTop()
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

function scrollToTop() {
    scroll({
        top: 0,
        left: 0,
        behavior: 'smooth'
    })
}

function fixUnavailableVideo(target) {
    if (target.tagName === 'SOURCE' && target.src) {
        fetch('/fixunavailablevideo', {
            method: 'POST',
            body: target.src.match(/.+(?=#)/)[0]
        })
        // .then(e => e.json())
        // .then(console.log)

        target.closest('.item').remove()
    }
}

addEventListener('DOMContentLoaded', () => fetch('/retrievedata')
    .then(d => d.json())
    .then(({ data }) => {
        displayFeed(data.events)
        document.getElementById('searchBar').addEventListener('input', filterItems)
        document.getElementById('logo').onclick = scrollToTop

        addEventListener('error', ({ target }) => fixUnavailableVideo(target), true)

        addEventListener("beforeunload",
            () => Array.from(document.getElementById('thumbsContainer').children).forEach(item =>
                updateVideoProgressbar(item, true)
            )
        )
    })
)




//? RETRIEVE LATEST DATA START

let latestSource = ''

function fetchData() {
    fetch(`${location.href}graphql`, {
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
            latestSource = data?.latestEventSource?.source ?? ''
            // console.log(data, latestSource)
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
                .replaceAll(/updated?|\shd\s|\shd|hd\s|full fight|video/ig, '')
                .replace(':', '')
                .replace(/\s+/g, ' ')
                .trim()

            if (title && source && created_at)
                fetch(`${location.href}graphql`, {
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
            // console.info('Up to date, db cleaning...')
            duplicates_fetchData()
        }
    }
}
fetchData()
//? RETRIEVE LATEST DATA END





//? DELETE DUPLICATES START
function duplicates_fetchData() {
    fetch(`${location.href}graphql`, {
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
        .then(({ data }) => duplicatesCleaning(data.events))
}


function duplicatesCleaning(data) {
    const
        dataValues = data.map(Object.values),
        dataSubSources = data.map(val => Object.values(val)[1]),
        dataSubIds = data.map(val => Object.values(val)[0])

    dataValues.forEach(([_, val], i) => {
        const index = dataSubSources.indexOf(val, i + 1)

        if (index > 0) {
            fetch(`${location.href}graphql`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `mutation {
                        deleteById(_id: "${dataSubIds[index]}") {
                            _id
                            title
                            source
                        }
                    }`
                }),
            })
        }
    })
}
//? DELETE DUPLICATES END
