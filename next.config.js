/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ant-design/pro-chat', 'react-intersection-observer'],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = nextConfig;
