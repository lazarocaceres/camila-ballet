import { useRef } from 'react'
import { tinaField } from 'tinacms/dist/react'
import Image from 'components/react/image'
import SmartLink from './smart-link'
import { useNearViewport } from '../hooks/useNearViewport'
import { useLiteYouTube } from '../hooks/useLiteYouTube'
import { usePosterQuality } from '../hooks/usePosterQuality'

export default function Media({
    videoId,
    target,
    image,
    alt,
    title,
    tina = '',
    children,
}) {
    const containerRef = useRef(null)
    const hasVideo = !!videoId && !image

    const near = useNearViewport(containerRef, { rootMargin: '1200px 0px' })
    const ytReady = useLiteYouTube(hasVideo && near)
    const { ready: qReady, quality } = usePosterQuality(
        videoId,
        hasVideo && near,
    )

    const canRenderVideo = hasVideo && near && ytReady && qReady
    const videoKey = canRenderVideo ? `yt-${videoId}-${quality}` : undefined

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
                ref={containerRef}
                className={`relative w-full ${!image ? 'aspect-[16/9]' : ''} rounded-2xl overflow-hidden`}
                data-tina-field={tinaField(tina, image ? 'image' : 'url')}
            >
                {image ? (
                    <Image
                        src={image}
                        alt={alt}
                        fill
                        ratio={3 / 2}
                        className='w-full h-full'
                    />
                ) : canRenderVideo ? (
                    <lite-youtube
                        key={videoKey}
                        videoid={videoId}
                        videotitle={title}
                        posterquality={quality}
                        nocookie
                    />
                ) : (
                    <div
                        aria-label={title}
                        role='img'
                        className='absolute inset-0 bg-neutral-200'
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
