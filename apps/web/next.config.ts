import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    env: {
        WEB_NODE_ENV: process.env.WEB_NODE_ENV,
        WEB_HOSTNAME_API: process.env.WEB_HOSTNAME_API,
        NEXT_PUBLIC_API_URL: process.env.WEB_HOSTNAME_API || 'http://localhost:3003',
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
