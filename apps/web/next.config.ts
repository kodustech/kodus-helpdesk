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
        NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS: process.env.ALLOWED_PARENT_ORIGINS || 'http://localhost:3000 https://app.kodus.io',
    },
    async headers() {
        const allowedOrigins = (process.env.ALLOWED_PARENT_ORIGINS || 'http://localhost:3000 https://app.kodus.io').split(' ');
        const frameAncestors = `frame-ancestors 'self' ${allowedOrigins.join(' ')}`;

        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: frameAncestors,
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
