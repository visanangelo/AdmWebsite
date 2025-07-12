/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [{
            protocol: 'https',
            hostname: 'images.unsplash.com',
            port: '',
            pathname: '/**',
        }, ],
    },
    allowedDevOrigins: [
        'localhost:3000',
        '127.0.0.1:3000',
        '172.20.10.2:3000',
        '172.20.10.2',
    ],
}

module.exports = nextConfig