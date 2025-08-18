import AOS from 'aos'

function initAOS() {
    AOS.init({
        disable: 'mobile',
        offset: 20,
        duration: 800,
        delay: 0,
        easing: 'ease-in-out-sine',
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
