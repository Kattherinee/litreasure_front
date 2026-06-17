import { Suspense } from "react";

import SearchPageClient from "./SearchPageClient";

export const metadata = {
	title: "Search - Litreasure",
};

export default function SearchRoute() {
	return (
		<Suspense>
			<SearchPageClient />
		</Suspense>
	);
}
