import { defineConfig } from 'vite'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.png', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: {
                name: 'NearYou',
                short_name: 'NearYou',
                description: 'Trouvez ce que vous cherchez autour de vous.',
                theme_color: '#007AFF',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                // Ensure fresh content by not caching API calls aggressively
                runtimeCaching: [{
                    urlPattern: ({ url }) => url.pathname.startsWith('/api'),
                    handler: 'NetworkFirst',
                    options: {
                        cacheName: 'api-cache',
                        expiration: {
                            maxEntries: 10,
                            maxAgeSeconds: 60 * 60 * 24 // 24 hours
                        },
                        networkTimeoutSeconds: 10
                    }
                }]
            }
        })
    ],
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                privacy: resolve(__dirname, 'privacy.html'),
                terms: resolve(__dirname, 'terms.html'),
            },
        },
    },
})
