import { useState } from 'react'
import { useTina, tinaField } from 'tinacms/dist/react'
import Image from 'components/react/image'
import messages from 'messages/global.json'
import SmartLink from 'tina/components/smart-link'

export default function Header({ lang, globalData }) {
    const generic = messages[lang]
    const {
        data: { global },
    } = useTina(globalData)
    const header = global.header
    const [open, setOpen] = useState(false)

    return (
        <header
            className='relative bg-white py-5 border-b border-b-neutral-200/20'
            data-tina-field={tinaField(header)}
        >
            <div className='container mx-auto flex justify-between items-center'>
                <div className='flex gap-12 items-center'>
                    <a href='/' className='shrink-0'>
                        <Image
                            src={header.logo}
                            alt={global.genericAlt}
                            width={105}
                            quality={100}
                            priority='high'
                            className='w-full max-w-[105px]'
                            data-tina-field={tinaField(header, 'logo')}
                        />
                    </a>
                    <div className='hidden lg:flex gap-8 items-center'>
                        {header.nav?.map((link, i) => (
                            <SmartLink
                                key={i}
                                href={link.url}
                                className='underline-hover'
                                data-tina-field={tinaField(link)}
                            >
                                {link.name}
                            </SmartLink>
                        ))}
                    </div>
                </div>

                <div className='hidden lg:flex gap-4 items-center'>
                    <SmartLink
                        href={header.secondaryCta.url}
                        className='secondary-button'
                        data-tina-field={tinaField(header, 'secondaryCta')}
                    >
                        {header.secondaryCta.name}
                    </SmartLink>
                    <SmartLink
                        href={header.principalCta.url}
                        className='primary-button'
                        data-tina-field={tinaField(header, 'principalCta')}
                    >
                        {header.principalCta.name}
                    </SmartLink>
                </div>

                <button
                    type='button'
                    className='lg:hidden p-2 cursor-pointer'
                    aria-label={open ? generic.closeMenu : generic.openMenu}
                    onClick={() => setOpen(v => !v)}
                >
                    <div className='relative w-6 h-6'>
                        <span
                            className={`absolute left-0 top-1/2 w-full h-0.5 bg-current transform transition duration-300 origin-center ${open ? 'translate-y-0 rotate-45' : '-translate-y-[7px]'}`}
                        />
                        <span
                            className={`absolute left-0 top-1/2 w-full h-0.5 bg-current transform transition duration-300 ${open ? 'opacity-0' : 'translate-y-0'}`}
                        />
                        <span
                            className={`absolute left-0 top-1/2 w-full h-0.5 bg-current transform transition duration-300 origin-center ${open ? 'translate-y-0 -rotate-45' : 'translate-y-[7px]'}`}
                        />
                    </div>
                </button>
            </div>

            <div
                className={`lg:hidden absolute top-full left-0 w-full bg-white border-t border-neutral-200/70 shadow-lg z-10 transform-gpu transition-all duration-300 ease-in-out origin-top ${
                    open
                        ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                        : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
                }`}
            >
                <nav className='container flex gap-2.5 flex-col py-4'>
                    {header.nav?.map((link, i) => (
                        <SmartLink
                            key={i}
                            href={link.url}
                            className='underline-hover'
                            onClick={() => setOpen(false)}
                            data-tina-field={tinaField(link)}
                        >
                            {link.name}
                        </SmartLink>
                    ))}
                    <div className='flex gap-2 flex-col'>
                        <SmartLink
                            href={header.secondaryCta.url}
                            className='secondary-button'
                            onClick={() => setOpen(false)}
                            data-tina-field={tinaField(header, 'secondaryCta')}
                        >
                            {header.secondaryCta.name}
                        </SmartLink>
                        <SmartLink
                            href={header.principalCta.url}
                            className='primary-button'
                            onClick={() => setOpen(false)}
                            data-tina-field={tinaField(header, 'principalCta')}
                        >
                            {header.principalCta.name}
                        </SmartLink>
                    </div>
                </nav>
            </div>
        </header>
    )
}
