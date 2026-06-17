import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		background_color: "#e8e2de",
		categories: ["books", "education", "lifestyle"],
		description:
			"Litreasure keeps your book treasures close, even when the network disappears.",
		display: "standalone",
		icons: [
			{
				src: "/favicon.ico",
				sizes: "48x48",
				type: "image/x-icon",
			},
			{
				src: "/icons/favicon.svg",
				sizes: "any",
				type: "image/svg+xml",
				purpose: "any",
			},
			{
				src: "/icons/favicon.svg",
				sizes: "any",
				type: "image/svg+xml",
				purpose: "maskable",
			},
		],
		id: "/",
		lang: "en",
		name: "Litreasure",
		orientation: "portrait",
		scope: "/",
		short_name: "Litreasure",
		start_url: "/?source=pwa",
		theme_color: "#233d4d",
	};
}
