/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@campus-qa/ai",
    "@campus-qa/database",
    "@campus-qa/knowledge",
    "@campus-qa/shared"
  ]
};

export default nextConfig;
