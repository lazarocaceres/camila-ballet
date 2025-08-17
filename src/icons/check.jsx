const Check = ({ className = 'w-5 h-5 text-primary', ...props }) => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        stroke='currentColor'
        strokeWidth={3}
        viewBox='0 0 24 24'
        className={className}
        {...props}
    >
        <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
    </svg>
)

export default Check
