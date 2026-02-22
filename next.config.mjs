/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.axelpick.app" }],
        destination: "https://axelpick.app/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
