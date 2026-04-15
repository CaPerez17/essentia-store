/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "essentia-products.s3.us-east-2.amazonaws.com",
        pathname: "/products/**",
      },
    ],
  },
};

export default nextConfig;
