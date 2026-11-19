/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  allowedDevOrigins: [
    'preview-chat-f3677a97-c1a2-432e-8a85-63d28c7ca588.space-z.ai',
    '*.space-z.ai',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
