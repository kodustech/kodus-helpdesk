import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
    reactStrictMode: true,
    outputFileTracingRoot: path.join(__dirname, '../../'),
    transpilePackages: [
        '@dnd-kit/core',
        '@dnd-kit/sortable',
        '@dnd-kit/utilities',
    ],
    turbopack: {
        root: path.join(__dirname, '../../'),
    },
    webpack: (config) => {
        config.resolve.modules = [
            path.resolve(__dirname, '../../node_modules'),
            ...config.resolve.modules,
        ];
        return config;
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    env: {
        WEB_NODE_ENV: process.env.WEB_NODE_ENV,
        WEB_HOSTNAME_API: process.env.WEB_HOSTNAME_API,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003',
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
