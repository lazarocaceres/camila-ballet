const isDev = import.meta.env.DEV

function isVectorOrGif(src) {
    return /\.svg(?:\?|$)|\.gif(?:\?|$)/i.test(src || '')
}
function isRemoteHttp(src) {
    return /^https?:\/\//i.test(src || '')
}
function buildOptimizedUrl(src, w, quality) {
    return `/_vercel/image?url=${encodeURIComponent(src)}&w=${w}&q=${quality}`
}

const BASE_WIDTHS = [
    32, 64, 96, 128, 160, 192, 256, 320, 480, 640, 960, 1280, 1600,
]
const DEFAULT_MAX_W = 1920

function getCandidates(minW, maxW) {
    return BASE_WIDTHS.filter(w => w >= minW && w <= maxW)
}
function pickSrcWidth(candidates, layoutW) {
    for (let i = 0; i < candidates.length; i++) {
        if (candidates[i] >= layoutW) return candidates[i]
    }
    return candidates[candidates.length - 1]
}

export default function Image(props) {
    const {
        src,
        alt = '',
        fill = false,
        sizes,
        objectFit = 'cover',
        className,
        imgClassName,
        style,
        width,
        height,
        quality = 75,
        priority = false,
        maxW = DEFAULT_MAX_W,
        minW = 16,
        ...rest
    } = props

    if (!src) {
        if (isDev) console.error('[Image] "src" is required.')
        return null
    }

    const canOpt = !isDev && isRemoteHttp(src) && !isVectorOrGif(src)

    // ---------- FILL ----------
    if (fill) {
        const candidates = getCandidates(minW, maxW)
        const src0 = canOpt
            ? buildOptimizedUrl(src, candidates[0], quality)
            : src
        const srcSet = canOpt
            ? candidates
                  .map(w => `${buildOptimizedUrl(src, w, quality)} ${w}w`)
                  .join(', ')
            : undefined
        const sizesAttr = sizes || '100vw'

        return (
            <span
                className={className}
                style={{ position: 'relative', display: 'block', ...style }}
            >
                <img
                    src={src0}
                    srcSet={srcSet}
                    sizes={sizesAttr}
                    alt={alt}
                    loading={priority ? 'eager' : 'lazy'}
                    fetchPriority={priority ? 'high' : undefined}
                    decoding='async'
                    className={imgClassName}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit,
                    }}
                    {...rest}
                />
            </span>
        )
    }

    // ---------- NON-FILL ----------
    let w = Number.isFinite(width) ? Math.round(width) : 0
    let h = Number.isFinite(height) ? Math.round(height) : undefined

    if (!w) {
        if (isDev)
            console.warn(
                '[Image] In non-fill mode, "width" is required to avoid CLS. Falling back to 800.',
            )
        w = 800
    }

    const hardMax = Math.min(maxW, Math.max(w * 2, w))
    const candidates = getCandidates(minW, hardMax)
    const srcW = candidates.length
        ? pickSrcWidth(candidates, w)
        : Math.min(w, maxW)

    const src1 = canOpt ? buildOptimizedUrl(src, srcW, quality) : src
    const srcSet = canOpt
        ? candidates
              .map(W => `${buildOptimizedUrl(src, W, quality)} ${W}w`)
              .join(', ')
        : undefined
    const sizesAttr = sizes || `${w}px`
    const aspectStyle = w && h ? { aspectRatio: `${w}/${h}` } : undefined

    return (
        <img
            src={src1}
            srcSet={srcSet}
            sizes={sizesAttr}
            alt={alt}
            width={w}
            height={h}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding='async'
            className={imgClassName || className}
            style={{ ...aspectStyle }}
            {...rest}
        />
    )
}
