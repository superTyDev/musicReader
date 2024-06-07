// next.config.js

module.exports = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "rdwzxcyl6ptcoxme.public.blob.vercel-storage.com",
                pathname: "**",
            },
        ],
    },
};
