import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'cpu-features': 'commonjs cpu-features',
        './crypto/build/Release/sshcrypto.node': 'commonjs ./crypto/build/Release/sshcrypto.node'
      });
    }

    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'cpu-features': false,
    };

    return config;
  },
};

export default nextConfig;
