import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#18181b',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20%',
          border: '1px solid',
          borderColor: '#a855f7',
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          
          <path
            d="M20 8v10.5a3.5 3.5 0 0 1-3.5 3.5 3.5 3.5 0 0 1-3.5-3.5 3.5 3.5 0 0 1 3.5-3.5c.54 0 1.05.12 1.5.34V8l2 0z"
            fill="url(#gradient1)"
          />
          
          <rect x="8" y="20" width="3" height="4" fill="url(#gradient2)" opacity="0.8" />
          <rect x="12" y="17" width="3" height="7" fill="url(#gradient2)" opacity="0.8" />
          <rect x="16" y="14" width="3" height="10" fill="url(#gradient2)" opacity="0.8" />
          <rect x="20" y="19" width="3" height="5" fill="url(#gradient2)" opacity="0.8" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}