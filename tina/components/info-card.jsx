import { tinaField } from 'tinacms/dist/react'
import Image from 'components/react/image'

export default function InfoCard({
    icon,
    alt,
    title,
    tina = '',
    children,
    ...props
}) {
    return (
        <div
            className='text-center space-y-7'
            data-tina-field={tinaField(tina)}
            {...props}
        >
            <Image
                src={icon}
                alt={alt}
                width={56}
                className='size-14 mx-auto'
                data-tina-field={tinaField(tina, 'icon')}
            />
            <h3
                className='font-playfair-display text-3xl lg:text-4xl'
                data-tina-field={tinaField(tina, 'title')}
            >
                {title}
            </h3>
            {children}
        </div>
    )
}
