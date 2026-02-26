import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {

    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        // Opsional: batasi port jika perlu, tapi dikosongkan agar fleksibel
        port: '3000', 
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
