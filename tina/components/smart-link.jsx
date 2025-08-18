import { isEmail } from 'lib/utils'
import SectionLink from './section-link'

export default function SmartLink({ href = '/', children, ...props }) {
    const rawHref = String(href ?? '/')

    const isPureHash = rawHref.startsWith('#') || rawHref.startsWith('/#')
    if (isPureHash) {
        const section = rawHref.replace(/^\/?#/, '')
        return (
            <SectionLink section={section} {...props}>
                {children}
            </SectionLink>
        )
    }

    let finalHref = rawHref
    if (isEmail(rawHref) && !rawHref.startsWith('mailto:')) {
        finalHref = `mailto:${rawHref}`
    }

    const isExternal =
        !finalHref.startsWith('/') && !finalHref.startsWith('mailto:')

    return (
        <a
            href={finalHref}
            {...(isExternal
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            {...props}
        >
            {children}
        </a>
    )
}
