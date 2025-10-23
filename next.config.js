/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14, no need for experimental flag
  images: {
    domains: [
      'api.builder.io',
      'example.com',
      'backendcatalog.qliq.ae',
      'images.unsplash.com',
      'source.unsplash.com',
      'picsum.photos',
      'image.shutterstock.com',
      'via.placeholder.com',
      'placehold.co',
      'dummyimage.com',
      'logo.clearbit.com',
      'upload.wikimedia.org'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
    // Allow unoptimized images (for external sources)
    unoptimized: process.env.NODE_ENV === 'development',
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
}

module.exports = nextConfig
