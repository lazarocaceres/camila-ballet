import AOS from 'aos'

function initAOS() {
    AOS.init({
        duration: 600,
        once: false,
        offset: 120,
    })
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAOS, { once: true })
} else {
    initAOS()
}

document.addEventListener('astro:page-load', () => {
    initAOS()
    AOS.refreshHard()
})
