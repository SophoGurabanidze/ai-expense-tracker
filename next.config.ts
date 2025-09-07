import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },     
      { protocol: "https", hostname: "images.clerk.dev" },  
      { protocol: "https", hostname: "images.clerk.com" },  
      { protocol: "https", hostname: "placehold.co" },      
    ],
  },
};

export default nextConfig;
