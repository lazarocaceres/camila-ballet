const ChevronDown = ({ open = false, className = '', ...props }) => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        stroke='currentColor'
        strokeWidth={2}
        viewBox='0 0 24 24'
        className={`w-4 h-4 transform transition-transform ${open ? 'rotate-180' : ''} ${className}`}
        {...props}
    >
        <path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7' />
    </svg>
)

export default ChevronDown
