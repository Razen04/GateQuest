// src/shared/components/tier-rings/PlatinumRing.tsx
import { useId } from 'react';

interface RingProps {
    className?: string;
}

export function PlatinumRing({ className }: RingProps) {
    const uid = useId();
    const goldId = `platinum-gold-${uid}`;
    const goldSId = `platinum-goldS-${uid}`;

    return (
        <svg
            viewBox="0 0 340 340"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
            focusable="false"
            preserveAspectRatio="xMidYMid meet"
        >
            <defs>
                <linearGradient
                    id={goldId}
                    x1="-112"
                    y1="-112"
                    x2="112"
                    y2="112"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#E9CF95" />
                    <stop offset=".5" stopColor="#BE9253" />
                    <stop offset="1" stopColor="#E8C98B" />
                </linearGradient>
                <linearGradient id={goldSId} x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#FFF3D5" />
                    <stop offset=".5" stopColor="#E8CD95" />
                    <stop offset="1" stopColor="#C09A5E" />
                </linearGradient>
            </defs>
            <g transform="translate(170 170)">
                <circle
                    r="107"
                    stroke="#EAE2F5"
                    strokeWidth="14"
                    className="tier-halo"
                    fill="none"
                />
                <circle
                    r="112"
                    stroke={`url(#${goldId})`}
                    strokeWidth="2.5"
                    fill="none"
                />
                <circle r="101" stroke="#7961A6" strokeWidth="4" fill="none" />
                <circle r="96" stroke="#BEA176" fill="none" />
                <circle
                    r="112"
                    pathLength={1000}
                    stroke="#FFF3D5"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="tier-sw"
                    style={{
                        strokeDasharray: '140 860',
                        animationDuration: '6s',
                    }}
                    fill="none"
                />
                <circle
                    r="101"
                    pathLength={1000}
                    stroke="#D9C6F0"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    className="tier-sw tier-sw-rev"
                    style={{ strokeDasharray: '120 880' }}
                    fill="none"
                />
                <circle
                    r="96"
                    pathLength={1000}
                    stroke="#fff"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    className="tier-sw"
                    style={{
                        strokeDasharray: '50 950',
                        animationDuration: '4s',
                    }}
                    fill="none"
                />
                <circle
                    className="tier-spin"
                    r="148"
                    stroke="#C5AC7B"
                    strokeDasharray="1 9"
                    strokeLinecap="round"
                    opacity={0.7}
                    fill="none"
                />

                {/* Corner filigree — repeated at 90° intervals */}
                {[0, 90, 180, 270].map((deg) => (
                    <g key={deg} transform={deg ? `rotate(${deg})` : undefined}>
                        <path
                            d="M37.7 -116.03A122 122 0 0 1 116.03 -37.7"
                            stroke="#C5AC7B"
                            strokeLinecap="round"
                            fill="none"
                        />
                        <path
                            d="M59.86 -112.58A127.5 127.5 0 0 1 112.58 -59.86"
                            stroke="#C5AC7B"
                            strokeWidth=".65"
                            strokeLinecap="round"
                            fill="none"
                        />
                        <path
                            d="M60.94 -97.53L64.12 -102.61"
                            stroke="#AA8BC6"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                        <path
                            d="M81.32 -81.32L85.56 -85.56"
                            stroke="#AA8BC6"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                        <path
                            d="M97.53 -60.94L102.61 -64.12"
                            stroke="#AA8BC6"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                        <circle
                            className="tier-pulse"
                            cx="37.7"
                            cy="-116.03"
                            r="2.8"
                            fill="#C5AC7B"
                        />
                        <circle
                            className="tier-pulse"
                            cx="116.03"
                            cy="-37.7"
                            r="2.8"
                            fill="#C5AC7B"
                        />
                    </g>
                ))}

                <path
                    d="M125.83 -61.37A140 140 0 0 1 125.83 61.37M-125.83 61.37A140 140 0 0 1 -125.83 -61.37"
                    stroke="#7961A6"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    fill="none"
                />
                <path
                    d="M137.9 -44.81A145 145 0 0 1 137.9 44.81M-137.9 44.81A145 145 0 0 1 -137.9 -44.81"
                    stroke="#BA9B68"
                    strokeWidth=".7"
                    strokeLinecap="round"
                    fill="none"
                />

                <g className="tier-pulse">
                    <circle cx="112" r="5.5" fill="#E8CD95" stroke="#BFA16E" />
                    <circle cx="-112" r="5.5" fill="#E4D4F1" stroke="#7961A6" />
                    <circle cx="140" r="3.2" fill="#BFA16E" />
                    <circle cx="-140" r="3.2" fill="#7961A6" />
                </g>

                <path
                    d="M-56.11 -115.05A128 128 0 0 1 56.11 -115.05"
                    stroke="#BA9B68"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                />

                {/* Twinkle stars */}
                <g transform="translate(0 -139) scale(1.2)">
                    <path
                        className="tier-tw"
                        d="M0-14C.7-5.3 5.3-.7 14 0 5.3.7.7 5.3 0 14-.7 5.3-5.3.7-14 0-5.3-.7-.7-5.3 0-14Z"
                        fill="#C09A5E"
                    />
                    <path
                        className="tier-tw"
                        style={{ animationDelay: '.3s' }}
                        d="M0-8C.4-3 3-.4 8 0 3 .4.4 3 0 8-.4 3-3 .4-8 0-3-.4-.4-3 0-8Z"
                        fill="#FFF3D5"
                    />
                </g>
                <g transform="translate(112.96 -101.71) scale(0.5)">
                    <path
                        className="tier-tw"
                        style={{ animationDelay: '0.5s' }}
                        d="M0-14C.7-5.3 5.3-.7 14 0 5.3.7.7 5.3 0 14-.7 5.3-5.3.7-14 0-5.3-.7-.7-5.3 0-14Z"
                        fill="#BD9B63"
                    />
                </g>
                <g transform="translate(-112.96 101.71) scale(0.5)">
                    <path
                        className="tier-tw"
                        style={{ animationDelay: '1.3s' }}
                        d="M0-14C.7-5.3 5.3-.7 14 0 5.3.7.7 5.3 0 14-.7 5.3-5.3.7-14 0-5.3-.7-.7-5.3 0-14Z"
                        fill="#9D79C1"
                    />
                </g>
                <g transform="translate(-112.96 -101.71) scale(0.38)">
                    <path
                        className="tier-tw"
                        style={{ animationDelay: '2s' }}
                        d="M0-14C.7-5.3 5.3-.7 14 0 5.3.7.7 5.3 0 14-.7 5.3-5.3.7-14 0-5.3-.7-.7-5.3 0-14Z"
                        fill="#9D79C1"
                    />
                </g>
                <g transform="translate(112.96 101.71) scale(0.38)">
                    <path
                        className="tier-tw"
                        style={{ animationDelay: '0.9s' }}
                        d="M0-14C.7-5.3 5.3-.7 14 0 5.3.7.7 5.3 0 14-.7 5.3-5.3.7-14 0-5.3-.7-.7-5.3 0-14Z"
                        fill="#BD9B63"
                    />
                </g>

                {/* Heart badge */}
                <g className="tier-hp" style={{ transformOrigin: '0 124px' }}>
                    <g transform="translate(-1236 -397)">
                        <path
                            d="M1236 510.103C1229.1 498.98 1213 501.452 1213 513.811C1213 523.698 1224.5 531.113 1236 541C1247.5 531.113 1259 523.698 1259 513.811C1259 501.452 1242.9 498.98 1236 510.103Z"
                            fill="#F5EEDB"
                            stroke="#BA9A61"
                            strokeLinecap="round"
                        />
                        <path
                            d="M1236 515L1241 521L1236 531L1231 521Z"
                            fill={`url(#${goldSId})`}
                            stroke="#BA9A61"
                            strokeWidth=".6"
                            strokeLinejoin="round"
                        />
                        <path
                            className="tier-glint"
                            d="M1233 520L1236 517L1237 522Z"
                            fill="#fff"
                        />
                    </g>
                </g>

                <g transform="translate(0 160) scale(0.55)">
                    <path
                        className="tier-tw"
                        style={{ animationDelay: '1.6s' }}
                        d="M0-14C.7-5.3 5.3-.7 14 0 5.3.7.7 5.3 0 14-.7 5.3-5.3.7-14 0-5.3-.7-.7-5.3 0-14Z"
                        fill="#BA9A61"
                    />
                </g>
            </g>
        </svg>
    );
}
