import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "iconsultant-pro.vercel.app",
        "*.vercel.app",
        "iconsultantpro.com",
        "*.iconsultantpro.com",
      ],
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.neon.tech" },
      { protocol: "https", hostname: "*.iconsultantpro.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ]
  },
}

export default nextConfig
