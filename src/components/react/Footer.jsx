import { useTina, tinaField } from 'tinacms/dist/react'

export default function Footer(globalData) {
    const {
        data: { global },
    } = useTina(globalData)
    const footer = global.footer

    return (
        <footer
            className='pt-20 bg-secondary-background text-white text-sm'
            data-tina-field={tinaField(footer)}
        >
            <div className='container'>
                <div className='pt-8 pb-20 border-t border-neutral-200/20 flex gap-5 flex-col lg:flex-row justify-between lg:items-center'>
                    <a href='/'>
                        <img
                            src={footer.logo}
                            alt={global.genericAlt}
                            className='w-full max-w-[120px]'
                            data-tina-field={tinaField(footer, 'logo')}
                        />
                    </a>
                    <span data-tina-field={tinaField(footer, 'advise')}>
                        {footer.advise}
                    </span>
                </div>
            </div>
        </footer>
    )
}
