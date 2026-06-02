/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@campus-qa/ai",
    "@campus-qa/database",
    "@campus-qa/knowledge",
    "@campus-qa/shared"
  ],
  webpack(config) {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"]
    };

    return config;
  }
};

export default nextConfig;
