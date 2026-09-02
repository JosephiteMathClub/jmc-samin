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
      {
        source: '/registration',
        destination: '/events/register',
        permanent: false,
      },
      {
        source: '/register',
        destination: '/register-member',
        permanent: false,
      },
      {
        source: '/signup',
        destination: '/login?mode=signup',
        permanent: false,
      },
      {
        source: '/dashboard',
        destination: '/profile',
        permanent: false,
      },
      {
        source: '/event-register',
        destination: '/events/register',
        permanent: false,
      },
      {
        source: '/inter-register',
        destination: '/events/register?type=inter',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

