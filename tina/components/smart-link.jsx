import { isEmail } from 'lib/utils'
import SectionLink from './section-link'

export default function SmartLink({ href = '/', children, ...props }) {
    const sectionMatch = href.match(/^\/?#(.+)/)
    if (sectionMatch) {
        return (
            <SectionLink section={sectionMatch[1]} {...props}>
                {children}
            </SectionLink>
        )
    }

    if (!href.startsWith('/')) {
        return (
            <a href={href} target='_blank' rel='noopener noreferrer' {...props}>
                {children}
            </a>
        )
    }

    return (
        <a
            href={
                isEmail(href)
                    ? `mailto:${href}`
                    : typeof href === 'string'
                      ? href
                      : '/'
            }
            {...props}
        >
            {children}
        </a>
    )
}
