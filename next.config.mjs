const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Serve the static public/index.html at root while keeping the app in place
      { source: '/', destination: '/index.html' },
    ];
  },
};

export default nextConfig;
