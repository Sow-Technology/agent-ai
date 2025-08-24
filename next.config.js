/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'net': 'commonjs net',
        'dns': 'commonjs dns',
        'tls': 'commonjs tls',
        'fs': 'commonjs fs',
        'mongodb-client-encryption': 'commonjs mongodb-client-encryption',
        'aws4': 'commonjs aws4',
        'mongodb': 'commonjs mongodb',
        'bson': 'commonjs bson',
        'kerberos': 'commonjs kerberos',
        'snappy': 'commonjs snappy',
        '@mongodb-js/zstd': 'commonjs @mongodb-js/zstd',
        'gcp-metadata': 'commonjs gcp-metadata',
        'socks': 'commonjs socks',
        '@genkit-ai/core': 'commonjs @genkit-ai/core',
        '@genkit-ai/google-genai': 'commonjs @genkit-ai/google-genai',
        '@genkit-ai/ai': 'commonjs @genkit-ai/ai',
        '@genkit-ai/flow': 'commonjs @genkit-ai/flow',
        '@genkit-ai/ai/embedder': 'commonjs @genkit-ai/ai/embedder',
        '@genkit-ai/ai/extract': 'commonjs @genkit-ai/ai/extract',
        '@genkit-ai/ai/model': 'commonjs @genkit-ai/ai/model',
        '@genkit-ai/ai/model/middleware': 'commonjs @genkit-ai/ai/model/middleware'
      });
    } else {
      // Exclude Node.js modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        dns: false,
        tls: false,
        fs: false,
        request: false,
        'mongodb-client-encryption': false,
        aws4: false,
        mongodb: false,
        bson: false,
        'snappy/package.json': false,
        snappy: false,
        'bson-ext': false,
        kerberos: false,
        '@mongodb-js/zstd': false,
        'gcp-metadata': false,
        socks: false,
        '@genkit-ai/core': false,
        '@genkit-ai/google-genai': false,
        '@genkit-ai/ai': false,
        '@genkit-ai/flow': false,
        '@genkit-ai/ai/embedder': false,
        '@genkit-ai/ai/extract': false,
        '@genkit-ai/ai/model': false,
        '@genkit-ai/ai/model/middleware': false,
        'node:util': false,
        'node:fs': false,
        'node:path': false,
        'node:crypto': false,
        'node:stream': false,
        'node:buffer': false,
        'node:events': false,
        'node:os': false,
        'node:url': false,
        'node:querystring': false,
        'node:http': false,
        'node:https': false,
        'node:zlib': false,
        util: false,
        crypto: false,
        stream: false,
        buffer: false,
        events: false,
        os: false,
        url: false,
        querystring: false,
        http: false,
        https: false,
        zlib: false,
        path: false
      };
    }
    return config;
  },
};

module.exports = nextConfig;
