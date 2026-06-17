"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

import { PaperBooksSection } from "@/components/pages/paper-books/PaperBooksSection";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import { PageHero } from "@/shared/ui/PageHero";

const MyPaperBooksPage = () => {
	const router = useRouter();
	const session = useAuthStore((state) => state.session);

	useEffect(() => {
		if (!session) {
			router.replace("/?auth=required");
		}
	}, [router, session]);

	if (!session) {
		return null;
	}

	return (
		<Page>
			<PageHero
				copyWidth={`min(calc(100% - (${theme.layout.contentGutter} * 2)), ${theme.layout.contentMaxWidth})`}
				text="Track owned copies, books you want to buy, and books you have given away, with notes attached to each card."
				title="My paper books"
			/>
			<Content>
				<PaperBooksSection variant="page" />
			</Content>
		</Page>
	);
};

export default MyPaperBooksPage;

const Page = styled.div`
	min-height: 100dvh;
	background: ${theme.colors.background};
	padding-bottom: 4rem;
`;

const Content = styled.section`
	padding-top: clamp(2rem, 4vw, 3.25rem);
`;
