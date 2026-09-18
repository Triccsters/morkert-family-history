/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: no server needed. Vercel serves the files directly.
  output: "export",
  images: { unoptimized: true },
  // Writes folder/index.html so the site works on any static host, not just Vercel.
  trailingSlash: true,
};

export default nextConfig;
