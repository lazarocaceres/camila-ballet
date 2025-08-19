import { useState, useEffect } from 'react'
import { tinaField } from 'tinacms/dist/react'
import SmartLink from './smart-link'
import 'lite-youtube-embed/src/lite-yt-embed.css'

let ytDefined = false
const resolutionCache = new Map()

async function detectResolution(videoId) {
    if (resolutionCache.has(videoId)) return resolutionCache.get(videoId)

    const options = ['maxresdefault', 'hqdefault', 'sddefault']
    for (const res of options) {
        try {
            const response = await fetch(
                `https://img.youtube.com/vi/${videoId}/${res}.jpg`,
                { method: 'HEAD' },
            )
            if (response.ok) {
                resolutionCache.set(videoId, res)
                return res
            }
        } catch {}
    }
    resolutionCache.set(videoId, 'sddefault')
    return 'sddefault'
}

export default function Media({
    videoId,
    target,
    image,
    alt,
    title,
    tina = '',
    children,
}) {
    const [resolution, setResolution] = useState('sddefault')

    useEffect(() => {
        if (image) return
        if (ytDefined) return
        ;(async () => {
            try {
                await import('lite-youtube-embed/src/lite-yt-embed.js')
                ytDefined = true
            } catch {}
        })()
    }, [image])

    useEffect(() => {
        if (!videoId) return
        let cancelled = false
        detectResolution(videoId).then(res => {
            if (!cancelled) setResolution(res)
        })
        return () => {
            cancelled = true
        }
    }, [videoId])

    const Wrapper = image ? SmartLink : 'div'
    const wrapperProps = image
        ? {
              href: target,
              className: 'space-y-7',
              'data-tina-field': tinaField(tina),
          }
        : { className: 'space-y-7', 'data-tina-field': tinaField(tina) }

    return (
        <Wrapper {...wrapperProps}>
            <div
                className={`${image ? 'relative w-full aspect-[3/2]' : ''} rounded-2xl overflow-hidden`}
                data-tina-field={tinaField(tina, image ? 'image' : 'url')}
            >
                {image ? (
                    <img
                        src={image}
                        alt={alt}
                        loading='lazy'
                        className='w-full object-cover'
                    />
                ) : (
                    <lite-youtube
                        key={`${videoId}-${resolution}`}
                        videoid={videoId}
                        videotitle={title}
                        posterquality={resolution}
                        nocookie
                    />
                )}
            </div>

            <h3
                className='font-playfair-display text-3xl lg:text-4xl'
                data-tina-field={tinaField(tina, 'title')}
            >
                {title}
            </h3>
            {children}
        </Wrapper>
    )
}
