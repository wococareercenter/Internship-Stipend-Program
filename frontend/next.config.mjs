/** @type {import('next').NextConfig} */
const nextConfig = {
    rewrites: async () => {
        // Only use rewrites in development
        if (process.env.NODE_ENV === "development") {
            return [
                {
                    source: "/api/:path*",
                    destination: "http://127.0.0.1:8000/api/:path*",
                },
                {
                    source: "/docs",
                    destination: "http://127.0.0.1:8000/docs",
                },
                {
                    source: "/openapi.json",
                    destination: "http://127.0.0.1:8000/openapi.json",
                },
            ];
        }
        return [];
    },
};

export default nextConfig;
