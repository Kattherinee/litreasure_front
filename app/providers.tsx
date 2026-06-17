"use client";

import {
	QueryClient,
	QueryClientProvider,
	type QueryClientConfig,
} from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import PwaStatus from "@/shared/pwa/PwaStatus";
import GlobalStyle from "@/shared/theme/GlobalStyle";

function ScrollToTop() {
	const pathname = usePathname();
	useEffect(() => {
		window.scrollTo(0, 0);
	}, [pathname]);
	return null;
}

const queryClientConfig: QueryClientConfig = {
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			gcTime: 5 * 60_000,
			refetchOnWindowFocus: false,
			retry: 1,
		},
		mutations: {
			retry: 0,
		},
	},
};

export default function Providers({ children }: { children: ReactNode }) {
	const [queryClient] = useState(() => new QueryClient(queryClientConfig));

	return (
		<QueryClientProvider client={queryClient}>
			<GlobalStyle />
			<ScrollToTop />
			{children}
			<PwaStatus />
		</QueryClientProvider>
	);
}
