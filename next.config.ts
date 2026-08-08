import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/inter-events',
        destination: '/events/register?type=inter',
        permanent: false,
      },
      {
        source: '/inter-registration',
        destination: '/events/register?type=inter',
        permanent: false,
      },
      {
        source: '/events/register-inter',
        destination: '/events/register?type=inter',
        permanent: false,
      },
      {
        source: '/inter-event-register',
        destination: '/events/register?type=inter',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

