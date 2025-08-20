export default function SectionLink({
    section,
    duration = 2000,
    offset = 0,
    onClick,
    children,
    ...props
}) {
    const handleClick = e => {
        e.preventDefault()
        if (typeof onClick === 'function') {
            onClick()
        }

        const target = document.getElementById(section)
        if (!target) return

        if (window.location.hash !== `#${section}`) {
            history.replaceState(null, '', `#${section}`)
        }

        const startY = window.pageYOffset
        const targetY = target.getBoundingClientRect().top + startY + offset
        const distance = targetY - startY

        let startTime = null

        // easeInOutCubic
        const ease = (t, b, c, d) => {
            t /= d / 2
            if (t < 1) return (c / 2) * t * t * t + b
            t -= 2
            return (c / 2) * (t * t * t + 2) + b
        }

        const animateScroll = currentTime => {
            if (startTime === null) startTime = currentTime
            const timeElapsed = currentTime - startTime
            const nextY = ease(timeElapsed, startY, distance, duration)
            window.scrollTo(0, nextY)
            if (timeElapsed < duration) {
                requestAnimationFrame(animateScroll)
            }
        }

        requestAnimationFrame(animateScroll)
    }

    return (
        <a href={`#${section}`} onClick={handleClick} {...props}>
            {children}
        </a>
    )
}
