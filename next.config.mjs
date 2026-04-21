/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "essentia-products.s3.us-east-2.amazonaws.com",
        pathname: "/products/**",
      },
      { protocol: "https", hostname: "fimgs.net" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "disfragancias.com" },
    ],
  },
};

export default nextConfig;
