import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  async redirects() {
    return [
      { source: "/arena", destination: "/hackathons", permanent: false },
      { source: "/workspace", destination: "/dashboard", permanent: false },
      { source: "/teams", destination: "/collaborate", permanent: false },
      { source: "/post", destination: "/post-problem", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  serverExternalPackages: ["@libsql/client"],
};
export default config;
