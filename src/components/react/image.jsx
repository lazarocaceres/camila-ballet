import { isDev } from 'lib/utils'

function isVectorOrGif(src) {
    return /\.svg(?:\?|$)|\.gif(?:\?|$)/i.test(src || '')
}
function isRemoteHttp(src) {
    return /^https?:\/\//i.test(src || '')
}
function buildOptimizedUrl(src, w, quality) {
    return `/_vercel/image?url=${encodeURIComponent(src)}&w=${w}&q=${quality}`
}
function buildSrcSet(src, widths, q) {
    return widths.map(w => `${buildOptimizedUrl(src, w, q)} ${w}w`).join(', ')
}

const BASE_WIDTHS = [
    32, 64, 96, 128, 160, 192, 256, 320, 480, 640, 960, 1280, 1600,
]
const DEFAULT_MAX_W = 1920
const DEFAULT_FILL_SIZES =
    '(min-width:1536px) 1536px, (min-width:1280px) 1280px, (min-width:1024px) 1024px, (min-width:768px) 768px, (min-width:640px) 640px, (min-width:480px) 480px, (min-width:360px) 360px, 100vw'

function getCandidates(minW, maxW) {
    return BASE_WIDTHS.filter(w => w >= minW && w <= maxW)
}
function pickSrcWidth(candidates, layoutW) {
    return (
        candidates.find(w => w >= layoutW) ?? candidates[candidates.length - 1]
    )
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
        ratio,
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
    const decoding = priority ? 'auto' : 'async'
    const loading = priority ? 'eager' : 'lazy'
    const fetchPriority = priority ? 'high' : undefined

    if (fill) {
        const hasWH =
            Number.isFinite(width) &&
            width > 0 &&
            Number.isFinite(height) &&
            height > 0
        const ar = hasWH
            ? width / height
            : Number.isFinite(ratio) && ratio > 0
              ? ratio
              : undefined
        if (!ar && isDev)
            console.warn(
                '[Image] <Image fill> without width/height or ratio. Add width/height or ratio to avoid CLS and improve LCP.',
            )

        const intrinsicW = hasWH ? Math.round(width) : ar ? 1000 : undefined
        const intrinsicH = hasWH
            ? Math.round(height)
            : ar && intrinsicW
              ? Math.round(intrinsicW / ar)
              : undefined

        const candidates = getCandidates(minW, maxW)
        const src0 = canOpt
            ? buildOptimizedUrl(src, candidates[0], quality)
            : src
        const srcSet = canOpt
            ? buildSrcSet(src, candidates, quality)
            : undefined
        const sizesAttr = sizes || DEFAULT_FILL_SIZES

        return (
            <span
                className={className}
                style={{
                    position: 'relative',
                    display: 'block',
                    ...(ar ? { aspectRatio: `${ar}` } : null),
                    ...style,
                }}
            >
                <img
                    src={src0}
                    srcSet={srcSet}
                    sizes={sizesAttr}
                    alt={alt}
                    decoding={decoding}
                    loading={loading}
                    fetchPriority={fetchPriority}
                    className={imgClassName}
                    width={intrinsicW}
                    height={intrinsicH}
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

    let w = Number.isFinite(width) ? Math.round(width) : 0
    let h = Number.isFinite(height) ? Math.round(height) : undefined
    if (!w) {
        if (isDev)
            console.warn(
                '[Image] In non-fill, "width" is required. Using 800 by default.',
            )
        w = 800
    }

    const hardMax = Math.min(maxW, Math.max(w * 2, w))
    const candidates = getCandidates(minW, hardMax)
    const srcW = candidates.length
        ? pickSrcWidth(candidates, w)
        : Math.min(w, maxW)
    const src1 = canOpt ? buildOptimizedUrl(src, srcW, quality) : src
    const srcSet = canOpt ? buildSrcSet(src, candidates, quality) : undefined
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
            decoding={decoding}
            loading={loading}
            fetchPriority={fetchPriority}
            className={imgClassName || className}
            style={{ ...aspectStyle }}
            {...rest}
        />
    )
}
