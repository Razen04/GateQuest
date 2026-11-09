// src/shared/components/tier-rings/GoldRing.tsx
interface RingProps {
    className?: string;
}

// Leaf pattern reused for both laurels — separated to keep both instances in sync
function LaurelLeaves() {
    return (
        <>
            <path
                d="M-29.03 116.44A120 120 0 0 0 44.95 -111.26"
                stroke="#287D71"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
            />
            <path
                d="M0 0C5.25 -6.3 14.7 -6.3 21 0C14.7 6.3 5.25 6.3 0 0Z"
                fill="#C5A365"
                className="tier-gl"
                style={{ animationDelay: '0s' }}
                transform="translate(-29.03 116.44) rotate(-26)"
            />
            <path
                d="M0 0C5.25 -6.3 14.7 -6.3 21 0C14.7 6.3 5.25 6.3 0 0Z"
                fill="#287D71"
                transform="translate(-29.03 116.44) rotate(54)"
            />
            <path
                d="M0 0C5.03 -6.03 14.07 -6.03 20.1 0C14.07 6.03 5.03 6.03 0 0Z"
                fill="#9CC9B8"
                transform="translate(6.7 119.81) rotate(-43.2)"
            />
            <path
                d="M0 0C5.03 -6.03 14.07 -6.03 20.1 0C14.07 6.03 5.03 6.03 0 0Z"
                fill="#287D71"
                transform="translate(6.7 119.81) rotate(36.8)"
            />
            <path
                d="M0 0C4.8 -5.76 13.44 -5.76 19.2 0C13.44 5.76 4.8 5.76 0 0Z"
                fill="#C5A365"
                className="tier-gl"
                style={{ animationDelay: '0.74s' }}
                transform="translate(41.83 112.47) rotate(-60.4)"
            />
            <path
                d="M0 0C4.8 -5.76 13.44 -5.76 19.2 0C13.44 5.76 4.8 5.76 0 0Z"
                fill="#287D71"
                transform="translate(41.83 112.47) rotate(19.6)"
            />
            <path
                d="M0 0C4.58 -5.49 12.81 -5.49 18.3 0C12.81 5.49 4.58 5.49 0 0Z"
                fill="#9CC9B8"
                transform="translate(73.22 95.07) rotate(-77.6)"
            />
            <path
                d="M0 0C4.58 -5.49 12.81 -5.49 18.3 0C12.81 5.49 4.58 5.49 0 0Z"
                fill="#287D71"
                transform="translate(73.22 95.07) rotate(2.4)"
            />
            <path
                d="M0 0C4.35 -5.22 12.18 -5.22 17.4 0C12.18 5.22 4.35 5.22 0 0Z"
                fill="#C5A365"
                className="tier-gl"
                style={{ animationDelay: '1.48s' }}
                transform="translate(98.06 69.17) rotate(-94.8)"
            />
            <path
                d="M0 0C4.35 -5.22 12.18 -5.22 17.4 0C12.18 5.22 4.35 5.22 0 0Z"
                fill="#287D71"
                transform="translate(98.06 69.17) rotate(-14.8)"
            />
            <path
                d="M0 0C4.12 -4.95 11.55 -4.95 16.5 0C11.55 4.95 4.12 4.95 0 0Z"
                fill="#9CC9B8"
                transform="translate(114.13 37.08) rotate(-112)"
            />
            <path
                d="M0 0C4.12 -4.95 11.55 -4.95 16.5 0C11.55 4.95 4.12 4.95 0 0Z"
                fill="#287D71"
                transform="translate(114.13 37.08) rotate(-32)"
            />
            <path
                d="M0 0C3.9 -4.68 10.92 -4.68 15.6 0C10.92 4.68 3.9 4.68 0 0Z"
                fill="#C5A365"
                className="tier-gl"
                style={{ animationDelay: '2.22s' }}
                transform="translate(119.99 1.68) rotate(-129.2)"
            />
            <path
                d="M0 0C3.9 -4.68 10.92 -4.68 15.6 0C10.92 4.68 3.9 4.68 0 0Z"
                fill="#287D71"
                transform="translate(119.99 1.68) rotate(-49.2)"
            />
            <path
                d="M0 0C3.67 -4.41 10.29 -4.41 14.7 0C10.29 4.41 3.67 4.41 0 0Z"
                fill="#9CC9B8"
                transform="translate(115.12 -33.88) rotate(-146.4)"
            />
            <path
                d="M0 0C3.67 -4.41 10.29 -4.41 14.7 0C10.29 4.41 3.67 4.41 0 0Z"
                fill="#287D71"
                transform="translate(115.12 -33.88) rotate(-66.4)"
            />
            <path
                d="M0 0C3.45 -4.14 9.66 -4.14 13.8 0C9.66 4.14 3.45 4.14 0 0Z"
                fill="#C5A365"
                className="tier-gl"
                style={{ animationDelay: '2.96s' }}
                transform="translate(99.95 -66.41) rotate(-163.6)"
            />
            <path
                d="M0 0C3.45 -4.14 9.66 -4.14 13.8 0C9.66 4.14 3.45 4.14 0 0Z"
                fill="#287D71"
                transform="translate(99.95 -66.41) rotate(-83.6)"
            />
            <path
                d="M0 0C3.23 -3.87 9.03 -3.87 12.9 0C9.03 3.87 3.23 3.87 0 0Z"
                fill="#9CC9B8"
                transform="translate(75.84 -92.99) rotate(-180.8)"
            />
            <path
                d="M0 0C3.23 -3.87 9.03 -3.87 12.9 0C9.03 3.87 3.23 3.87 0 0Z"
                fill="#287D71"
                transform="translate(75.84 -92.99) rotate(-100.8)"
            />
            <path
                d="M0 0C3 -3.6 8.4 -3.6 12 0C8.4 3.6 3 3.6 0 0Z"
                fill="#C5A365"
                className="tier-gl"
                style={{ animationDelay: '0.5s' }}
                transform="translate(44.95 -111.26) rotate(-198)"
            />
            <path
                d="M0 0C3 -3.6 8.4 -3.6 12 0C8.4 3.6 3 3.6 0 0Z"
                fill="#287D71"
                transform="translate(44.95 -111.26) rotate(-118)"
            />
        </>
    );
}

export function GoldRing({ className }: RingProps) {
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
                    r="102"
                    stroke="#DBEFE8"
                    strokeWidth="15"
                    className="tier-halo"
                    fill="none"
                />
                <circle
                    r="106"
                    stroke="#287D71"
                    strokeWidth="2.5"
                    fill="none"
                />
                <circle r="96" stroke="#287D71" fill="none" />
                <circle
                    r="106"
                    pathLength={1000}
                    stroke="#C5A365"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="tier-sw"
                    style={{
                        strokeDasharray: '110 890',
                        animationDuration: '7s',
                    }}
                    fill="none"
                />
                <circle
                    r="96"
                    pathLength={1000}
                    stroke="#fff"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    className="tier-sw tier-sw-rev"
                    opacity={0.95}
                    fill="none"
                />

                {/* Left laurel */}
                <g className="tier-lauS" style={{ transformOrigin: '0 120px' }}>
                    <LaurelLeaves />
                </g>

                {/* Right laurel (mirrored) */}
                <g transform="scale(-1 1)">
                    <g
                        className="tier-lauS"
                        style={{ transformOrigin: '0 120px' }}
                    >
                        <LaurelLeaves />
                    </g>
                </g>

                {/* Corner pulse dots */}
                <g className="tier-pulse">
                    <circle cx="67.88" cy="67.88" r="3" fill="#C5A365" />
                    <circle cx="-67.88" cy="67.88" r="3" fill="#C5A365" />
                    <circle cx="-67.88" cy="-67.88" r="3" fill="#C5A365" />
                    <circle cx="67.88" cy="-67.88" r="3" fill="#C5A365" />
                </g>

                {/* Book badge */}
                <g transform="translate(-756 -405)">
                    <path
                        d="M707 515C723 509 739.333 511 756 521C772.667 511 789 509 805 515V547C787 542.333 770.667 544.667 756 554C741.333 544.667 725 542.333 707 547V515Z"
                        fill="#287D71"
                    />
                    <path
                        d="M713 509C727.667 505 742 507.667 756 517V546C741.333 538 727 536 713 540V509Z"
                        fill="#FFFCF0"
                        stroke="#BFA36D"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M799 509C784.333 505 770 507.667 756 517V546C770.667 538 785 536 799 540V509Z"
                        fill="#F1E7CF"
                        stroke="#BFA36D"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M722 517C731.333 515.667 739.667 517.333 747 522M722 525C731.333 523.667 739.667 525.333 747 530M765 522C774.333 517.333 782.667 515.667 790 517M765 530C774.333 525.333 782.667 523.667 790 525"
                        stroke="#A7AB91"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        fill="none"
                    />
                    <g className="tier-bob">
                        <path
                            d="M756 515L764 526L756 539L748 526Z"
                            fill="#D5AB61"
                            stroke="#9E7A3A"
                            strokeWidth=".8"
                            strokeLinejoin="round"
                        />
                        <path d="M756 515L764 526H756Z" fill="#F4DC9C" />
                        <path d="M756 539L764 526H756Z" fill="#B88A3C" />
                        <path
                            className="tier-glint"
                            d="M752 521L756 518L758 524Z"
                            fill="#fff"
                        />
                    </g>
                </g>
            </g>
        </svg>
    );
}
