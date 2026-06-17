"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import styled from "styled-components";

import { CreateBookModal } from "@/components/pages/my-books/CreateBookModal";
import { useBookCardsQuery } from "@/shared/api/books";
import {
	useUserBooksQuery,
	type IUserBookStatus,
} from "@/shared/api/user-books";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import { AppPagination } from "@/shared/ui/AppPagination";
import { BookCard } from "@/shared/ui/BookCard";
import { ChipTabs } from "@/shared/ui/ChipTabs";
import { PageHero } from "@/shared/ui/PageHero";

const statusTabs: Array<{ id: IUserBookStatus | "all"; label: string }> = [
	{ id: "all", label: "All books" },
	{ id: "reading", label: "Reading" },
	{ id: "planned", label: "Planned" },
	{ id: "finished", label: "Finished" },
	{ id: "paused", label: "Paused" },
	{ id: "rereading", label: "Rereading" },
	{ id: "dropped", label: "Dropped" },
];

type IBooksTab = IUserBookStatus | "all" | "created";

const MyBooksPage = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const session = useAuthStore((state) => state.session);
	const [page, setPage] = useState(1);
	const [activeStatus, setActiveStatus] = useState<IBooksTab>("all");
	const [isCreateBookOpen, setIsCreateBookOpen] = useState(
		() => searchParams.get("create") === "1",
	);

	const allBooksQuery = useUserBooksQuery(
		{
			limit: 27,
			page,
		},
		{ enabled: Boolean(session) },
	);
	const readingBooksQuery = useUserBooksQuery(
		{ limit: 27, page, status: "reading" },
		{ enabled: Boolean(session) },
	);
	const plannedBooksQuery = useUserBooksQuery(
		{ limit: 27, page, status: "planned" },
		{ enabled: Boolean(session) },
	);
	const finishedBooksQuery = useUserBooksQuery(
		{ limit: 27, page, status: "finished" },
		{ enabled: Boolean(session) },
	);
	const pausedBooksQuery = useUserBooksQuery(
		{ limit: 27, page, status: "paused" },
		{ enabled: Boolean(session) },
	);
	const rereadingBooksQuery = useUserBooksQuery(
		{ limit: 27, page, status: "rereading" },
		{ enabled: Boolean(session) },
	);
	const droppedBooksQuery = useUserBooksQuery(
		{ limit: 27, page, status: "dropped" },
		{ enabled: Boolean(session) },
	);
	const createdBooksQuery = useBookCardsQuery(
		{ limit: 27, onlyMine: true, page },
		{ enabled: Boolean(session) },
	);
	const queriesByStatus = {
		all: allBooksQuery,
		created: createdBooksQuery,
		dropped: droppedBooksQuery,
		finished: finishedBooksQuery,
		paused: pausedBooksQuery,
		planned: plannedBooksQuery,
		reading: readingBooksQuery,
		rereading: rereadingBooksQuery,
	} satisfies Record<
		IBooksTab,
		typeof allBooksQuery | typeof createdBooksQuery
	>;
	const activeTrackedBooksQuery =
		activeStatus === "created"
			? null
			: (queriesByStatus[activeStatus] as typeof allBooksQuery);
	const data =
		activeStatus === "created"
			? createdBooksQuery.data
			: activeTrackedBooksQuery?.data;
	const isError =
		activeStatus === "created"
			? createdBooksQuery.isError
			: (activeTrackedBooksQuery?.isError ?? false);
	const isLoading =
		activeStatus === "created"
			? createdBooksQuery.isLoading
			: (activeTrackedBooksQuery?.isLoading ?? false);
	const trackedBooks =
		activeStatus === "created"
			? []
			: (activeTrackedBooksQuery?.data?.items ?? []);
	const createdBooks =
		activeStatus === "created" ? (createdBooksQuery.data?.items ?? []) : [];
	const pages = data?.pages ?? 1;

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
				actionLabel="Add book"
				copyWidth="60vw"
				text="All books you have added to your treasures."
				title="My books"
				onAction={() => setIsCreateBookOpen(true)}
			/>

			<Content>
				<StatusRow>
					<StatusTabs
						activeId={activeStatus}
						ariaLabel="Book statuses"
						items={statusTabs.map((status) => ({
							count: queriesByStatus[status.id].data?.total ?? 0,
							id: status.id,
							label: status.label,
						}))}
						onChange={(id) => {
							setActiveStatus(id as IBooksTab);
							setPage(1);
						}}
					/>
					<CreatedTabButton
						$isActive={activeStatus === "created"}
						type="button"
						onClick={() => {
							setActiveStatus("created");
							setPage(1);
						}}
					>
						Created by me
						<CreatedCount>
							{queriesByStatus.created.data?.total ?? 0}
						</CreatedCount>
					</CreatedTabButton>
				</StatusRow>

				{isLoading ? (
					<StateMessage>Loading books...</StateMessage>
				) : isError ? (
					<StateMessage>Failed to load your books.</StateMessage>
				) : (activeStatus === "created" ? createdBooks : trackedBooks).length >
				  0 ? (
					<>
						<BookGrid>
							{activeStatus === "created"
								? createdBooks.map((book) => (
										<BookItem key={book.id}>
											<BookCard book={book} size="compact" />
										</BookItem>
									))
								: trackedBooks.map((item) => (
										<BookItem key={item.id}>
											<BookCard
												size="compact"
												book={{
													...item.book,
													isTracked: true,
													myStatus: item.status,
												}}
											/>
										</BookItem>
									))}
						</BookGrid>
						<AppPagination count={pages} page={page} onChange={setPage} />
					</>
				) : (
					<EmptyState>
						<EmptyTitle>No books yet</EmptyTitle>
						<EmptyText>
							Add a book and assign it a status to see it here.
						</EmptyText>
					</EmptyState>
				)}
			</Content>

			{isCreateBookOpen ? (
				<CreateBookModal
					onClose={() => setIsCreateBookOpen(false)}
					onCreated={(book) => router.push(`/books/${book.id}`)}
				/>
			) : null}
		</Page>
	);
};

export default MyBooksPage;

const Page = styled.div`
	min-height: 100dvh;
	background: ${theme.colors.background};
	padding-bottom: 6rem;
`;

const Content = styled.div`
	width: 60vw;
	margin: 0 auto;
`;

const StatusTabs = styled(ChipTabs)``;

const StatusRow = styled.div`
	display: flex;
	justify-content: space-between;
	gap: 1rem;
	align-items: center;
	margin-bottom: 1.25rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		flex-direction: column;
		align-items: stretch;
	}
`;

const CreatedTabButton = styled.button<{ $isActive: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	border: 0.0625rem solid
		${({ $isActive }) =>
			$isActive ? theme.colors.orangeLight : "rgb(211 202 196 / 0.82)"};
	border-radius: 999px;
	background: ${({ $isActive }) =>
		$isActive ? "rgb(218 142 91 / 0.14)" : theme.colors.surface};
	padding: 0.45rem 0.85rem;
	color: ${({ $isActive }) =>
		$isActive ? theme.colors.orangeDark : theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	font-size: 0.9rem;
	font-weight: ${({ $isActive }) => ($isActive ? 700 : 400)};
	white-space: nowrap;

	@media (max-width: ${theme.rubberSize.tablet}) {
		align-self: flex-start;
		width: fit-content;
	}

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;

const CreatedCount = styled.span`
	color: ${theme.colors.orangeDark};
	font-weight: 700;
`;

const BookGrid = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	justify-content: center;
	align-items: flex-start;
	margin-top: clamp(2.5rem, 5vw, 4rem);
`;

const BookItem = styled.div`
	width: fit-content;
`;

const StateMessage = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 1rem;
	line-height: 1.5;
`;

const EmptyState = styled.section`
	border: 0.0625rem dashed ${theme.colors.border};
	border-radius: 1rem;
	background: rgb(255 255 255 / 0.54);
	padding: 1.5rem;
`;

const EmptyTitle = styled.h2`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.5rem;
	line-height: 1.15;
`;

const EmptyText = styled.p`
	max-width: 36rem;
	margin: 0.5rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 0.95rem;
	line-height: 1.45;
`;
