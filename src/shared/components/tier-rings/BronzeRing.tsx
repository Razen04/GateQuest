// src/shared/components/tier-rings/BronzeRing.tsx
interface RingProps {
    className?: string;
}

export function BronzeRing({ className }: RingProps) {
    return (
        <svg
            viewBox="0 0 340 340"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
            focusable="false"
            preserveAspectRatio="xMidYMid meet"
        >
            <g transform="translate(170 170)">
                <circle
                    r="107"
                    stroke="#DBE4F7"
                    strokeWidth="11"
                    className="tier-halo"
                    fill="none"
                />
                <circle
                    r="103"
                    stroke="#4264BA"
                    strokeWidth="2.5"
                    fill="none"
                />
                <circle r="96" stroke="#A5B8E8" fill="none" />
                <circle
                    r="103"
                    pathLength={1000}
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="tier-sw"
                    opacity={0.9}
                    fill="none"
                />
                <path
                    d="M100.75 21.41A103 103 0 0 1 38.58 95.5"
                    stroke="#4264BA"
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="none"
                />
                <path
                    d="M-100.75 -21.41A103 103 0 0 1 -38.58 -95.5"
                    stroke="#4264BA"
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="none"
                />
                <g className="tier-rib" style={{ transformOrigin: '0 98px' }}>
                    <path d="M-15 98H15V151L0 140L-15 151Z" fill="#4264BA" />
                    <path d="M-8 108H8V135L0 129L-8 135Z" fill="#A5B8E8" />
                    <g transform="translate(0 119) scale(.4)">
                        <path
                            d="M0-14C.7-5.3 5.3-.7 14 0 5.3.7.7 5.3 0 14-.7 5.3-5.3.7-14 0-5.3-.7-.7-5.3 0-14Z"
                            fill="#fff"
                        />
                    </g>
                </g>
            </g>
        </svg>
    );
}
