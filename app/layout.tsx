import type { Metadata, Viewport } from "next";

import Providers from "@/app/providers";
import StyledComponentsRegistry from "@/app/styled-components-registry";
import { Header } from "@/shared/ui/Header";
import PageBackButton from "@/shared/ui/PageBackButton/PageBackButton";

import "react-advanced-cropper/dist/style.css";
import "./globals.css";

export const metadata: Metadata = {
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "Litreasure",
	},
	applicationName: "Litreasure",
	title: "Litreasure",
	description:
		"Discover your next favorite book with Litreasure - your personalized book recommendation platform. Explore curated collections, find hidden gems, and dive into a world of literary treasures tailored just for you.",
	formatDetection: {
		telephone: false,
	},
	icons: {
		apple: "/favicon.ico",
		icon: "/favicon.ico",
		shortcut: "/favicon.ico",
	},
	manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
	themeColor: "#233d4d",
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>
				<StyledComponentsRegistry>
					<Providers>
						<Header />
						<PageBackButton />
						<main>{children}</main>
					</Providers>
				</StyledComponentsRegistry>
			</body>
		</html>
	);
}
