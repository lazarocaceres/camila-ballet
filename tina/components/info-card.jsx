import { tinaField } from 'tinacms/dist/react'

export default function InfoCard({ icon, alt, title, tina = '', children }) {
    return (
        <div
            className='text-center space-y-7'
            data-tina-field={tinaField(tina)}
        >
            <img
                src={icon}
                alt={alt}
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
