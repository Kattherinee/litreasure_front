"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import styled from "styled-components";

import { CreateAuthorModal } from "@/components/pages/author/CreateAuthorModal";
import { MyCreatorsTabs } from "@/components/pages/my-treasures/tabs/MyCreatorsTabs";
import type { IMyCreatorsTab } from "@/components/pages/my-treasures/tabs/MyCreatorsTabs";
import type { IAuthorsSort } from "@/shared/api/authors";
import { useMyAuthorsQuery } from "@/shared/api/authors";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import { AppPagination } from "@/shared/ui/AppPagination";
import { AuthorCard } from "@/shared/ui/AuthorCard";
import { PageHero } from "@/shared/ui/PageHero";

const AUTHORS_LIMIT = 27;
const LOADER_LIMIT = 27;

const sortOptions: Array<{ label: string; value: IAuthorsSort }> = [
	{ label: "Popular", value: "popular" },
	{ label: "More books", value: "books_desc" },
	{ label: "Fewer books", value: "books_asc" },
	{ label: "A-Z", value: "name_asc" },
	{ label: "Z-A", value: "name_desc" },
];

const MyAuthorsPage = () => {
	const router = useRouter();
	const session = useAuthStore((state) => state.session);
	const [page, setPage] = useState(1);
	const [sort, setSort] = useState<IAuthorsSort>("popular");
	const [isSortOpen, setIsSortOpen] = useState(false);
	const [isCreateAuthorOpen, setIsCreateAuthorOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<IMyCreatorsTab>("all");
	const params = useMemo(
		() => ({
			sort,
		}),
		[sort],
	);
	const {
		data: authorsResponse,
		error,
		isError,
		isLoading,
	} = useMyAuthorsQuery(
		{ ...params, limit: LOADER_LIMIT },
		{ enabled: Boolean(session) },
	);
	const mineAuthors = useMemo(
		() => authorsResponse?.items ?? [],
		[authorsResponse?.items],
	);
	const authors = useMemo(() => {
		if (activeTab === "mine") {
			return mineAuthors.filter((author) => author.isOwned);
		}

		if (activeTab === "public") {
			return mineAuthors.filter((author) => author.isPublic);
		}

		return mineAuthors;
	}, [activeTab, mineAuthors]);
	const visibleAuthors = useMemo(() => {
		const startIndex = (page - 1) * AUTHORS_LIMIT;
		return authors.slice(startIndex, startIndex + AUTHORS_LIMIT);
	}, [authors, page]);
	const pages = Math.max(1, Math.ceil(authors.length / AUTHORS_LIMIT));
	const total = authors.length;
	const publicTotal = mineAuthors.filter((author) => author.isPublic).length;
	const mineTotal = mineAuthors.filter((author) => author.isOwned).length;
	const selectedSortOption =
		sortOptions.find((option) => option.value === sort) ?? sortOptions[0];

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
				actionLabel="Create author"
				copyWidth="min(72rem, 100%)"
				text="All saved authors in your personal treasury."
				title="My authors"
				onAction={() => setIsCreateAuthorOpen(true)}
			/>

			<Content>
				<ControlsRow>
					<MyCreatorsTabs
						activeTab={activeTab}
						allCount={total}
						className="creators-tabs"
						mineCount={mineTotal}
						publicCount={publicTotal}
						onChange={(tab) => {
							setActiveTab(tab);
							setPage(1);
						}}
					/>

					<FiltersBar
						onBlur={(event) => {
							if (
								!event.currentTarget.contains(
									event.relatedTarget as Node | null,
								)
							) {
								setIsSortOpen(false);
							}
						}}
					>
						<DropdownField>
							<FilterLabel>Search type</FilterLabel>
							<DropdownButton
								aria-expanded={isSortOpen}
								type="button"
								onClick={() => setIsSortOpen((current) => !current)}
							>
								<DropdownValue>{selectedSortOption.label}</DropdownValue>
								<ChevronIcon $isOpen={isSortOpen} aria-hidden="true" />
							</DropdownButton>
							<DropdownMenu $isOpen={isSortOpen}>
								{sortOptions.map((option) => (
									<DropdownMenuItem
										key={option.value}
										$isSelected={option.value === sort}
										type="button"
										onClick={() => {
											setSort(option.value);
											setPage(1);
											setIsSortOpen(false);
										}}
									>
										{option.label}
									</DropdownMenuItem>
								))}
							</DropdownMenu>
						</DropdownField>

						<ResultsBadge aria-label={`Authors found: ${total}`}>
							<ResultsNumber>{total}</ResultsNumber>
							<ResultsText>authors</ResultsText>
						</ResultsBadge>
					</FiltersBar>
				</ControlsRow>

				{isLoading ? (
					<StateMessage>Loading your authors...</StateMessage>
				) : isError ? (
					<StateMessage>Could not load authors: {error.message}</StateMessage>
				) : visibleAuthors.length === 0 ? (
					<StateMessage>No saved authors yet.</StateMessage>
				) : (
					<>
						<AuthorGrid>
							{visibleAuthors.map((author) => (
								<AuthorCard key={author.id} author={author} />
							))}
						</AuthorGrid>
						{pages > 1 ? (
							<AppPagination count={pages} page={page} onChange={setPage} />
						) : null}
					</>
				)}
			</Content>

			{isCreateAuthorOpen ? (
				<CreateAuthorModal onClose={() => setIsCreateAuthorOpen(false)} />
			) : null}
		</Page>
	);
};

export default MyAuthorsPage;

const Page = styled.div`
	min-height: 100dvh;
	background: ${theme.colors.background};
	padding: 0 clamp(1.5rem, 2.78vw, 2.5rem) clamp(3rem, 5vw, 4.5rem);
`;

const Content = styled.section`
	width: min(72rem, 100%);
	margin: 0 auto;
`;

const ControlsRow = styled.div`
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 1rem;
	margin-top: 1.25rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		flex-direction: column;
		align-items: stretch;
	}
`;

const FiltersBar = styled.div`
	display: flex;
	align-items: end;
	justify-content: space-between;
	gap: 0.8rem;
	min-width: 0;
	flex: 0 0 auto;
`;

const DropdownField = styled.div`
	position: relative;
	display: flex;
	min-width: 0;
	flex-direction: column;
	gap: 0.25rem;
`;

const FilterLabel = styled.label`
	color: ${theme.colors.softForeground};
	font-size: 0.76rem;
	line-height: 1.2;
`;

const DropdownButton = styled.button`
	display: flex;
	min-width: 12.5rem;
	min-height: 2.35rem;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	border: 0.0625rem solid rgb(211 202 196 / 0.7);
	border-radius: 0.75rem;
	background: rgb(242 239 237 / 0.58);
	padding: 0 0.7rem;
	color: ${theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	font-size: 0.9rem;
	text-align: left;
`;

const DropdownValue = styled.span`
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const ChevronIcon = styled(KeyboardArrowDownIcon)<{ $isOpen: boolean }>`
	&& {
		width: 1.05rem;
		height: 1.05rem;
		flex: 0 0 auto;
		color: ${theme.colors.orangeDark};
		transform: rotate(${({ $isOpen }) => ($isOpen ? "180deg" : "0deg")});
		transition: transform 160ms ease;
	}
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
	position: absolute;
	z-index: 12;
	top: calc(100% + 0.4rem);
	left: 0;
	width: min(16rem, calc(100vw - 2rem));
	border: 0.0625rem solid rgb(238 179 141 / 0.65);
	border-radius: 0.75rem;
	background: #e8e2de;
	box-shadow: 0 1rem 2.5rem rgb(4 18 26 / 0.18);
	opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
	padding: 0.4rem;
	pointer-events: ${({ $isOpen }) => ($isOpen ? "auto" : "none")};
	transform: translateY(${({ $isOpen }) => ($isOpen ? "0" : "-0.35rem")});
	transition:
		opacity 160ms ease,
		transform 180ms ease;
`;

const DropdownMenuItem = styled.button<{ $isSelected: boolean }>`
	display: flex;
	width: 100%;
	align-items: center;
	border: 0;
	border-radius: 0.6rem;
	background: ${({ $isSelected }) =>
		$isSelected ? "rgb(218 142 91 / 0.16)" : "transparent"};
	padding: 0.55rem 0.65rem;
	color: ${({ $isSelected }) => ($isSelected ? "#d4641c" : "#233d4d")};
	cursor: pointer;
	font: inherit;
	font-size: 0.9rem;
	font-weight: 600;
	text-align: left;
`;

const ResultsBadge = styled.div`
	display: inline-flex;
	min-height: 2.35rem;
	align-items: baseline;
	justify-content: center;
	gap: 0.42rem;
	border: 0.0625rem solid rgb(218 142 91 / 0.22);
	border-radius: 62.4375rem;
	background: rgb(242 239 237 / 0.72);
	padding: 0.48rem 0.85rem;
	white-space: nowrap;
`;

const ResultsNumber = styled.span`
	color: ${theme.colors.orangeDark};
	font-family: ${theme.fonts.serif};
	font-size: 1.18rem;
	font-weight: 600;
	line-height: 1;
`;

const ResultsText = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.86rem;
	line-height: 1;
`;

const AuthorGrid = styled.div`
	display: grid;
	gap: 1rem;
	grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
	margin-top: 2rem;
`;

const StateMessage = styled.p`
	margin: 2.5rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 1rem;
	line-height: 1.5;
`;
