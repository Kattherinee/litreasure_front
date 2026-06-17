"use client";

import dynamic from "next/dynamic";

const GenresPage = dynamic(() => import("@/components/pages/GenresPage"), {
	ssr: false,
});

export default function GenresPageClient() {
	return <GenresPage />;
}
