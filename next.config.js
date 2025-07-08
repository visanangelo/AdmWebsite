/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        // Suppress the Supabase Realtime critical dependency warning
        config.ignoreWarnings = [{
            module: /node_modules\/@supabase\/realtime-js/,
            message: /Critical dependency: the request of a dependency is an expression/,
        }, ];

        return config;
    },
};

module.exports = nextConfig;