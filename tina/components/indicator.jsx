import ChevronRight from 'icons/chevron-right'

export default function Indicator({ children }) {
    return (
        <div className='flex gap-2 items-center'>
            <span>{children}</span>
            <ChevronRight />
        </div>
    )
}
