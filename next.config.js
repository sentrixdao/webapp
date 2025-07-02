const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["@supabase/supabase-js", "ethers"],
    missingSuspenseWithCSRBailout: false,
    workerThreads: false,
    cpus: 1
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "unsafe-none",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "unsafe-none",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ]
  },
  async rewrites() {
    // Only add rewrite if NEXT_PUBLIC_SUPABASE_URL is defined and valid
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl || supabaseUrl === "" || supabaseUrl === "undefined") {
      console.warn("NEXT_PUBLIC_SUPABASE_URL is not defined, skipping Supabase rewrite");
      return [];
    }

    return [
      {
        source: "/api/supabase/:path*",
        destination: `${supabaseUrl}/:path*`,
      },
    ];
  },
}

module.exports = nextConfig