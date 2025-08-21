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

    // ---------- FILL ----------
    if (fill) {
        let ar = undefined
        if (
            Number.isFinite(width) &&
            Number.isFinite(height) &&
            width > 0 &&
            height > 0
        ) {
            ar = width / height
        } else if (Number.isFinite(ratio) && ratio > 0) {
            ar = ratio
        }

        if (!ar && isDev) {
            console.warn(
                '[Image] <Image fill> sin width/height ni ratio. Añade width/height o ratio para evitar CLS y mejorar LCP.',
            )
        }

        const intrinsicW =
            Number.isFinite(width) && width > 0
                ? Math.round(width)
                : ar
                  ? 1000
                  : undefined
        const intrinsicH =
            Number.isFinite(height) && height > 0
                ? Math.round(height)
                : ar && intrinsicW
                  ? Math.round(intrinsicW / ar)
                  : undefined

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
                    decoding={priority ? 'auto' : 'async'}
                    loading={priority ? 'eager' : 'lazy'}
                    fetchPriority={priority ? 'high' : undefined}
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

    // ---------- NON-FILL ----------
    let w = Number.isFinite(width) ? Math.round(width) : 0
    let h = Number.isFinite(height) ? Math.round(height) : undefined

    if (!w) {
        if (isDev)
            console.warn(
                '[Image] En non-fill, "width" es obligatorio. Usando 800 por defecto.',
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
            decoding={priority ? 'auto' : 'async'}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            className={imgClassName || className}
            style={{ ...aspectStyle }}
            {...rest}
        />
    )
}
