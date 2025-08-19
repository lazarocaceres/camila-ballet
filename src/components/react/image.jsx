export default function Image({
    src,
    alt,
    widths = [320, 640, 960, 1200, 1600],
    q = 75,
    sizes = '100vw',
    ...rest
}) {
    const enc = encodeURIComponent
    const toUrl = w => `/_vercel/image?url=${enc(src)}&w=${w}&q=${q}`
    const srcSet = widths.map(w => `${toUrl(w)} ${w}w`).join(', ')

    return (
        <img
            src={toUrl(widths[0])}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            loading='lazy'
            decoding='async'
            {...rest}
        />
    )
}
