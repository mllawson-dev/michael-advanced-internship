import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{
      protocol: "https",
      hostname: "firebasestorage.googleapis.com",
      pathname: "/v0/b/summaristt.appspot.com/o/books%2Fimages%2F**",
    }],
  },
};

export default nextConfig;
