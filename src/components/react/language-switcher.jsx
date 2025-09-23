import { useState, useRef, useEffect } from 'react'
import { i18n } from 'i18n'
import Image from 'components/react/image'
import ChevronDown from 'icons/chevron-down'
import Check from 'icons/check'

const localeConfig = {
    en: { label: 'English', flagCode: 'gb' },
    es: { label: 'Español', flagCode: 'es' },
    fr: { label: 'Français', flagCode: 'fr' },
}

export default function LanguageSwitcher({ locale, pathname: path }) {
    const pathname = path === '/' ? '' : path

    const languages = i18n.locales.map(code => ({
        code,
        label: (localeConfig[code] && localeConfig[code].label) || code,
        flagCode: (localeConfig[code] && localeConfig[code].flagCode) || code,
    }))

    const active = languages.find(l => l.code === locale) || languages[0]

    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        function onClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', onClickOutside)
        return () => document.removeEventListener('mousedown', onClickOutside)
    }, [])

    const buildHref = code => {
        const isDefault = code === i18n.defaultLocale
        const base = isDefault ? pathname || '/' : `/${code}${pathname || ''}`
        return `${base}?lang=${encodeURIComponent(code)}`
    }

    return (
        <div
            ref={ref}
            className='fixed bottom-5 right-5 z-50 inline-block text-left'
        >
            <button
                type='button'
                onClick={() => setOpen(o => !o)}
                className={`flex items-center space-x-1.5 ${open ? 'bg-neutral-100' : 'bg-white'} border border-neutral-200 shadow-sm rounded-full px-3 py-2 transition-all ease-in hover:bg-neutral-100 focus:outline-none cursor-pointer`}
            >
                <Image
                    src={`/${active.flagCode}.png`}
                    alt={active.label}
                    width={24}
                    className='w-6 h-6 rounded-sm'
                />
                <ChevronDown open={open} />
            </button>

            <div
                className={`absolute right-0 bottom-full mb-2 w-44 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden transform-gpu transition-all duration-300 ease-in-out origin-bottom ${
                    open
                        ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                        : 'opacity-0 translate-y-0.5 scale-95 pointer-events-none'
                }`}
            >
                {languages.map(lang => (
                    <button
                        key={lang.code}
                        type='button'
                        onClick={() => {
                            setOpen(false)
                            window.location.href = buildHref(lang.code)
                        }}
                        className='w-full flex items-center space-x-2 px-4 py-2 hover:bg-neutral-100 focus:outline-none text-left cursor-pointer'
                    >
                        <Image
                            src={`/${lang.flagCode}.png`}
                            alt=''
                            width={24}
                            className='w-6 h-6 rounded-sm'
                        />
                        <span className='flex-1'>{lang.label}</span>
                        {lang.code === active.code && <Check />}
                    </button>
                ))}
            </div>
        </div>
    )
}
