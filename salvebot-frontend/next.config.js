/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  images: {
    unoptimized: true
  },
  assetPrefix: '',
  basePath: '',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://salvebot-api.fideleamazing.workers.dev',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://salvebot.com'
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Configure webpack for better JavaScript output
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ensure proper semicolon insertion in client-side builds
      config.optimization.minimizer.forEach((minimizer) => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.terserOptions = {
            ...minimizer.options.terserOptions,
            output: {
              ...minimizer.options.terserOptions?.output,
              semicolons: true,
              beautify: false,
            },
            compress: {
              ...minimizer.options.terserOptions?.compress,
              sequences: true,
            },
          }
        }
      })
    }
    return config
  },
}

module.exports = nextConfig