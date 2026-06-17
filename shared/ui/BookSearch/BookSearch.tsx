"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";

import type {
	ISearchAllResponse,
	ISearchAuthor,
	ISearchBook,
	ISearchCollection,
	ISearchGenre,
	ISearchSeries,
} from "@/shared/api/search";
import type { IBookRecomendation } from "@/shared/api/recomendations/recomendations.types";
import { getRecomendationsByPrompt } from "@/shared/api/recomendations/recomendations.api";
import { useDebouncedValue } from "@/shared/utils/useDebouncedValue";
import {
	useSearchAllQuery,
	useSearchAuthorsQuery,
	useSearchBooksQuery,
	useSearchCollectionsQuery,
	useSearchGenresQuery,
	useSearchSeriesQuery,
} from "@/shared/api/search";

import {
	type ISearchTabActiveId,
	type ISearchTabId,
	SEARCH_TABS,
	SearchTabBar,
} from "./SearchTabBar";
import { theme } from "@/shared/theme";
import { Button } from "@/shared/ui/Button";
import { InputField } from "@/shared/ui/InputField";

import { AuthorResultCard } from "./AuthorResultCard";
import { BookResultCard } from "./BookResultCard";
import { CollectionResultCard } from "./CollectionResultCard";
import { GenreResultCard } from "./GenreResultCard";
import { SeriesResultCard } from "./SeriesResultCard";

const MIN_SEARCH_LENGTH = 2;
const RECENT_SEARCHES_KEY = "litreasure:recent-searches";
const RECOMMENDATION_RECENT_SEARCHES_KEY =
	"litreasure:recent-recommendation-searches";
const RECENT_SEARCHES_LIMIT = 6;
const MODAL_SEARCH_LIMIT = 15;
const RECOMMENDATION_LIMIT = 10;

type ISearchResults = {
	author: ISearchAuthor[];
	book: ISearchBook[];
	collection: ISearchCollection[];
	genre: ISearchGenre[];
	series: ISearchSeries[];
};

const emptySearchResults: ISearchResults = {
	author: [],
	book: [],
	collection: [],
	genre: [],
	series: [],
};

const getStoredRecentSearches = (storageKey: string) => {
	if (typeof window === "undefined") {
		return [];
	}

	const savedSearches = window.localStorage.getItem(storageKey);

	if (!savedSearches) {
		return [];
	}

	try {
		const parsedSearches = JSON.parse(savedSearches);

		if (!Array.isArray(parsedSearches)) {
			return [];
		}

		return parsedSearches
			.filter((search): search is string => typeof search === "string")
			.slice(0, RECENT_SEARCHES_LIMIT);
	} catch {
		window.localStorage.removeItem(RECENT_SEARCHES_KEY);

		return [];
	}
};

const BookSearch = () => {
	const router = useRouter();
	const [searchValue, setSearchValue] = useState("");
	const [recentSearches, setRecentSearches] = useState<string[]>(() =>
		getStoredRecentSearches(RECENT_SEARCHES_KEY),
	);
	const [recommendationRecentSearches, setRecommendationRecentSearches] =
		useState<string[]>(() =>
			getStoredRecentSearches(RECOMMENDATION_RECENT_SEARCHES_KEY),
		);
	const [activeTab, setActiveTab] = useState<ISearchTabActiveId>("all");
	const [isRecommendationMode, setIsRecommendationMode] = useState(false);
	const [submittedRecommendationPrompt, setSubmittedRecommendationPrompt] =
		useState("");
	const [isOpen, setIsOpen] = useState(false);
	const normalizedSearchValue = searchValue.trim();
	const debouncedSearchValue = useDebouncedValue(normalizedSearchValue, 1000);
	const shouldSearch = debouncedSearchValue.length >= MIN_SEARCH_LENGTH;
	const recommendationPrompt = submittedRecommendationPrompt.trim();
	const { data: searchResponse, isFetching: isFetchingAll } = useSearchAllQuery(
		debouncedSearchValue,
		MODAL_SEARCH_LIMIT,
		{ enabled: shouldSearch && !isRecommendationMode },
	);
	const { data: booksResponse, isFetching: isFetchingBooks } =
		useSearchBooksQuery(debouncedSearchValue, 1, MODAL_SEARCH_LIMIT, {
			enabled: shouldSearch && !isRecommendationMode,
		});
	const { data: authorsResponse, isFetching: isFetchingAuthors } =
		useSearchAuthorsQuery(debouncedSearchValue, 1, MODAL_SEARCH_LIMIT, {
			enabled: shouldSearch && !isRecommendationMode,
		});
	const { data: seriesResponse, isFetching: isFetchingSeries } =
		useSearchSeriesQuery(
			debouncedSearchValue,
			1,
			MODAL_SEARCH_LIMIT,
			undefined,
			{
				enabled: shouldSearch && !isRecommendationMode,
			},
		);
	const { data: genresResponse, isFetching: isFetchingGenres } =
		useSearchGenresQuery(debouncedSearchValue, 1, MODAL_SEARCH_LIMIT, {
			enabled: shouldSearch && !isRecommendationMode,
		});
	const { data: collectionsResponse, isFetching: isFetchingCollections } =
		useSearchCollectionsQuery(debouncedSearchValue, 1, MODAL_SEARCH_LIMIT, {
			enabled: shouldSearch && !isRecommendationMode,
		});
	const { data: recommendationBooks, isFetching: isFetchingRecommendations } =
		useQuery<IBookRecomendation[]>({
			enabled:
				isRecommendationMode &&
				recommendationPrompt.length >= MIN_SEARCH_LENGTH,
			queryFn: () =>
				getRecomendationsByPrompt({
					params: { limit: RECOMMENDATION_LIMIT, prompt: recommendationPrompt },
				}),
			queryKey: ["recomendations", "prompt", recommendationPrompt],
		});
	const allSearchResults = useMemo(
		() => getSearchResults(searchResponse),
		[searchResponse],
	);
	const tabSearchResults = useMemo(
		(): ISearchResults => ({
			author: authorsResponse?.items ?? [],
			book: booksResponse?.items ?? [],
			collection: collectionsResponse?.items ?? [],
			genre: genresResponse?.items ?? [],
			series: seriesResponse?.items ?? [],
		}),
		[
			authorsResponse,
			booksResponse,
			collectionsResponse,
			genresResponse,
			seriesResponse,
		],
	);
	const searchResults =
		activeTab === "all" ? allSearchResults : tabSearchResults;
	const resultCountsByTab = useMemo(
		(): Record<ISearchTabId, number> => ({
			author: authorsResponse?.total ?? 0,
			book: booksResponse?.total ?? 0,
			collection: collectionsResponse?.total ?? 0,
			genre: genresResponse?.total ?? 0,
			series: seriesResponse?.total ?? 0,
		}),
		[
			authorsResponse,
			booksResponse,
			collectionsResponse,
			genresResponse,
			seriesResponse,
		],
	);
	const searchTotal =
		searchResponse?.total ?? getResultCountsTotal(resultCountsByTab);
	const activeTabTotal =
		activeTab === "all"
			? searchTotal
			: resultCountsByTab[activeTab as ISearchTabId];
	const isFetching =
		activeTab === "all"
			? isFetchingAll
			: activeTab === "book"
				? isFetchingBooks
				: activeTab === "author"
					? isFetchingAuthors
					: activeTab === "series"
						? isFetchingSeries
						: activeTab === "genre"
							? isFetchingGenres
							: isFetchingCollections;

	const handleRecommendationModeToggle = () => {
		if (isRecommendationMode) {
			setIsRecommendationMode(false);
			setSubmittedRecommendationPrompt("");
			setSearchValue("");
			return;
		}

		setIsRecommendationMode(true);
		setSearchValue("");
	};
	const visibleTabs =
		activeTab === "all"
			? SEARCH_TABS.map((tab) => tab.id)
			: [activeTab as ISearchTabId];

	const recommendationCards = useMemo(
		() =>
			(recommendationBooks ?? []).map((book) => ({
				author: book.author ?? book.authors?.[0]?.name ?? "",
				authorId: book.authors?.[0]?.id,
				coverUrl: book.coverUrl,
				description: (book as { description?: string }).description,
				id: book.id,
				isTracked: book.isTracked,
				orderInSeries: book.orderInSeries ?? undefined,
				searchMatches: (
					book as { searchMatches?: Array<{ field: string; value: string }> }
				).searchMatches,
				myStatus: book.myStatus ?? undefined,
				seriesTitle: book.seriesTitle ?? undefined,
				title: book.title,
			})),
		[recommendationBooks],
	);
	const recommendationTotal = recommendationCards.length;
	const footerTotal = isRecommendationMode
		? recommendationTotal
		: activeTabTotal;
	const shouldShowFooter = isRecommendationMode
		? recommendationPrompt.length >= MIN_SEARCH_LENGTH &&
			!isFetchingRecommendations
		: shouldSearch && !isFetching;
	const footerCountLabel = isRecommendationMode ? "recommendations" : "results";
	const footerButtonLabel = isRecommendationMode ? "View more" : "View all";
	const hasVisibleResults = visibleTabs.some(
		(tab) => searchResults[tab].length > 0,
	);

	const closeSearchAndReset = () => {
		setIsOpen(false);
		setSearchValue("");
		setSubmittedRecommendationPrompt("");
		setIsRecommendationMode(false);
		setActiveTab("all");
	};

	const saveRecentSearch = (value = normalizedSearchValue) => {
		const nextSearch = value.trim();

		if (nextSearch.length < MIN_SEARCH_LENGTH) {
			return;
		}

		setRecentSearches((currentSearches) => {
			const deduplicatedSearches = currentSearches.filter(
				(search) => search.toLowerCase() !== nextSearch.toLowerCase(),
			);
			const nextSearches = [nextSearch, ...deduplicatedSearches].slice(
				0,
				RECENT_SEARCHES_LIMIT,
			);

			window.localStorage.setItem(
				RECENT_SEARCHES_KEY,
				JSON.stringify(nextSearches),
			);

			return nextSearches;
		});
	};

	const saveRecommendationSearch = (value = normalizedSearchValue) => {
		const nextSearch = value.trim();

		if (nextSearch.length < MIN_SEARCH_LENGTH) {
			return;
		}

		setRecommendationRecentSearches((currentSearches) => {
			const deduplicatedSearches = currentSearches.filter(
				(search) => search.toLowerCase() !== nextSearch.toLowerCase(),
			);
			const nextSearches = [nextSearch, ...deduplicatedSearches].slice(
				0,
				RECENT_SEARCHES_LIMIT,
			);

			window.localStorage.setItem(
				RECOMMENDATION_RECENT_SEARCHES_KEY,
				JSON.stringify(nextSearches),
			);

			return nextSearches;
		});
	};

	const clearSearch = () => setSearchValue("");
	const selectTab = (tab: ISearchTabActiveId) => setActiveTab(tab);
	const selectSuggestion = (suggestion: string) => {
		setSearchValue(suggestion);
		setActiveTab("genre");
	};

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				closeSearchAndReset();
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	return (
		<SearchWrap>
			<SearchIcon aria-hidden="true" />
			<SearchInput
				aria-label="Search books"
				placeholder="Title, author, genre"
				type="search"
				value={searchValue}
				onChange={(event) => setSearchValue(event.target.value)}
				onFocus={() => setIsOpen(true)}
			/>

			{isOpen ? (
				<ModalLayer>
					<ModalBackdrop aria-hidden="true" onMouseDown={closeSearchAndReset} />
					<SearchPanel role="dialog" aria-label="Advanced search">
						<SearchPanelHeader>
							{isRecommendationMode ? (
								<RecommendationBanner>Recommendation mode</RecommendationBanner>
							) : null}
							<PanelSearchInputWrap>
								<PanelSearchIcon aria-hidden="true" />
								<PanelSearchInput
									$isRecommendationMode={isRecommendationMode}
									autoFocus
									aria-label="Advanced search"
									placeholder={
										isRecommendationMode
											? "Describe your preferences and we will recommend a fitting book"
											: "Title, author, series, genre"
									}
									type="search"
									value={searchValue}
									onChange={(event) => setSearchValue(event.target.value)}
									onKeyDown={(event) => {
										if (event.key !== "Enter") return;
										if (isRecommendationMode) {
											setSubmittedRecommendationPrompt(normalizedSearchValue);
											saveRecommendationSearch();
											return;
										}
										saveRecentSearch();
									}}
								/>
								{searchValue ? (
									<ClearButton
										aria-label="Clear search"
										type="button"
										onClick={clearSearch}
									>
										×
									</ClearButton>
								) : null}
							</PanelSearchInputWrap>
						</SearchPanelHeader>

						<TabsWrapper>
							{isRecommendationMode ? (
								<RecommendationActions>
									<RecommendationButton
										type="button"
										onClick={() => {
											setSubmittedRecommendationPrompt(normalizedSearchValue);
											saveRecommendationSearch();
										}}
									>
										Find a book
									</RecommendationButton>
									<RecommendationButton
										$variant="ghost"
										type="button"
										onClick={handleRecommendationModeToggle}
									>
										Back to normal search
									</RecommendationButton>
								</RecommendationActions>
							) : (
								<>
									<Tabs role="tablist" aria-label="Search filters">
										<SearchTabBar
											activeTab={activeTab}
											counts={resultCountsByTab}
											isFetching={isFetching}
											shouldSearch={shouldSearch}
											total={searchTotal}
											onTabChange={selectTab}
										/>
									</Tabs>
									<TabsMetaActions>
										<RecommendationButton
											$variant="ghost"
											type="button"
											onClick={handleRecommendationModeToggle}
										>
											Switch to recommendation mode
										</RecommendationButton>
									</TabsMetaActions>
								</>
							)}
						</TabsWrapper>

						<ResultsArea>
							{isRecommendationMode ? (
								recommendationPrompt.length < MIN_SEARCH_LENGTH ? (
									recommendationRecentSearches.length > 0 ? (
										<RecentSearchesBlock>
											<RecentHeading>
												Recent recommendation queries
											</RecentHeading>
											<RecentList>
												{recommendationRecentSearches.map((recentSearch) => (
													<RecentButton
														key={recentSearch}
														type="button"
														onClick={() => {
															setSearchValue(recentSearch);
															setSubmittedRecommendationPrompt(recentSearch);
														}}
													>
														{recentSearch}
													</RecentButton>
												))}
											</RecentList>
										</RecentSearchesBlock>
									) : (
										<EmptyState>
											Describe what you want and click Find a book.
										</EmptyState>
									)
								) : isFetchingRecommendations ? (
									<EmptyState>Finding books...</EmptyState>
								) : recommendationCards.length > 0 ? (
									<>
										{recommendationCards.map((book) => (
											<BookResultCard
												key={book.id}
												book={book}
												isRecommendation
												closeSearch={closeSearchAndReset}
												query={recommendationPrompt}
												saveRecentSearch={saveRecommendationSearch}
											/>
										))}
									</>
								) : (
									<EmptyState>
										Nothing found yet. Try refining your request.
									</EmptyState>
								)
							) : normalizedSearchValue.length < MIN_SEARCH_LENGTH ? (
								<RecentSearchesBlock>
									<RecentHeading>Recent queries</RecentHeading>
									{recentSearches.length > 0 ? (
										<RecentList>
											{recentSearches.map((recentSearch) => (
												<RecentButton
													key={recentSearch}
													type="button"
													onClick={() => setSearchValue(recentSearch)}
												>
													{recentSearch}
												</RecentButton>
											))}
										</RecentList>
									) : (
										<EmptyState>No recent queries yet.</EmptyState>
									)}
								</RecentSearchesBlock>
							) : null}

							{shouldSearch && !isRecommendationMode && isFetching ? (
								<EmptyState>Searching books...</EmptyState>
							) : null}

							{shouldSearch &&
							!isRecommendationMode &&
							!isFetching &&
							visibleTabs.includes("book") &&
							searchResults.book.length > 0
								? searchResults.book.map((book) => (
										<BookResultCard
											key={book.id}
											book={book}
											closeSearch={closeSearchAndReset}
											query={normalizedSearchValue}
											saveRecentSearch={saveRecentSearch}
										/>
									))
								: null}

							{shouldSearch &&
							!isRecommendationMode &&
							!isFetching &&
							visibleTabs.includes("author") &&
							searchResults.author.length > 0
								? searchResults.author.map((author) => (
										<AuthorResultCard
											key={`author-${author.id}`}
											author={author}
											closeSearch={closeSearchAndReset}
											query={normalizedSearchValue}
											saveRecentSearch={saveRecentSearch}
										/>
									))
								: null}

							{shouldSearch &&
							!isRecommendationMode &&
							!isFetching &&
							visibleTabs.includes("series") &&
							searchResults.series.length > 0
								? searchResults.series.map((series) => (
										<SeriesResultCard
											key={`series-${series.id}`}
											query={normalizedSearchValue}
											series={series}
											saveRecentSearch={saveRecentSearch}
										/>
									))
								: null}

							{shouldSearch &&
							!isRecommendationMode &&
							!isFetching &&
							visibleTabs.includes("genre") &&
							searchResults.genre.length > 0
								? searchResults.genre.map((genre) => (
										<GenreResultCard
											key={`genre-${genre.id}`}
											closeSearch={closeSearchAndReset}
											genre={genre}
											query={normalizedSearchValue}
											saveRecentSearch={saveRecentSearch}
										/>
									))
								: null}

							{shouldSearch &&
							!isRecommendationMode &&
							!isFetching &&
							visibleTabs.includes("collection") &&
							searchResults.collection.length > 0
								? searchResults.collection.map((collection) => (
										<CollectionResultCard
											key={`collection-${collection.id}`}
											closeSearch={closeSearchAndReset}
											collection={collection}
											query={normalizedSearchValue}
											saveRecentSearch={saveRecentSearch}
										/>
									))
								: null}

							{shouldSearch &&
							!isRecommendationMode &&
							!isFetching &&
							!hasVisibleResults ? (
								<EmptyState>
									Nothing found.
									{activeTab === "genre" && genresResponse?.suggestion ? (
										<SuggestionButton
											type="button"
											onClick={() =>
												selectSuggestion(genresResponse.suggestion!)
											}
										>
											Search for {genresResponse.suggestion}
										</SuggestionButton>
									) : null}
								</EmptyState>
							) : null}
						</ResultsArea>

						{shouldShowFooter ? (
							<SearchFooter>
								<ResultsBadge
									aria-label={`Found ${footerTotal} ${footerCountLabel}`}
								>
									<ResultsNumber>{footerTotal}</ResultsNumber>
									<ResultsText>{footerCountLabel}</ResultsText>
								</ResultsBadge>
								<ViewAllButton
									buttonType="containedInverted"
									onClick={() => {
										const nextSearchValue = isRecommendationMode
											? recommendationPrompt || normalizedSearchValue
											: normalizedSearchValue;

										if (isRecommendationMode) {
											saveRecommendationSearch(nextSearchValue);
										} else {
											saveRecentSearch(nextSearchValue);
										}

										const params = new URLSearchParams();
										if (nextSearchValue) {
											params.set("q", nextSearchValue);
										}
										if (!isRecommendationMode && activeTab !== "all") {
											params.set("tab", activeTab);
										}
										if (isRecommendationMode) {
											params.set("mode", "recommendation");
										}
										closeSearchAndReset();
										router.push(`/search?${params.toString()}`);
									}}
								>
									{footerButtonLabel}
								</ViewAllButton>
							</SearchFooter>
						) : null}
					</SearchPanel>
				</ModalLayer>
			) : null}
		</SearchWrap>
	);
};

export default BookSearch;

const getSearchResults = (response?: ISearchAllResponse): ISearchResults =>
	response
		? {
				author: response.authors,
				book: response.books,
				collection: response.collections,
				genre: response.genres,
				series: response.series,
			}
		: emptySearchResults;

const getResultCountsTotal = (counts: Record<ISearchTabId, number>) =>
	SEARCH_TABS.reduce((total, tab) => total + counts[tab.id], 0);

const SearchWrap = styled.div`
	position: relative;
	display: flex;
	width: min(270px, 30vw);
	margin-left: auto;
	align-items: center;

	@media (max-width: 720px) {
		order: 5;
		width: 100%;
		margin-left: 0;
	}
`;

const SearchIcon = styled.span`
	position: absolute;
	top: 45%;
	left: 14px;
	width: 12px;
	height: 12px;
	border: 2px solid currentColor;
	border-radius: 50%;
	color: ${theme.colors.softForeground};
	pointer-events: none;
	transform: translateY(-50%);

	&::after {
		position: absolute;
		right: -6px;
		bottom: -4px;
		width: 8px;
		height: 2px;
		border-radius: 999px;
		background: currentColor;
		content: "";
		transform: rotate(45deg);
	}
`;

const SearchInput = styled(InputField)`
	min-height: 24px;
	padding-block: 0.45rem;
	padding: 0.335vw 0.875vw 0.335vw 2.8vw;
	line-height: 1.35;

	&::-webkit-search-cancel-button {
		display: none;
	}
`;

const ModalLayer = styled.div`
	position: fixed;
	z-index: 80;
	inset: 0;
`;

const ModalBackdrop = styled.div`
	position: absolute;
	inset: 0;
	background: rgb(4 18 26 / 0.42);
`;

const SearchPanel = styled.div`
	position: relative;
	z-index: 1;
	display: flex;
	width: min(54rem, calc(100vw - 2rem));
	max-height: min(42rem, calc(100dvh - 2rem));
	flex-direction: column;
	margin: 1rem auto 0;
	overflow: hidden;
	border: 0.0625rem solid rgb(242 239 237 / 0.18);
	border-radius: 1.25rem;
	background: ${theme.colors.background};
	box-shadow: 0 1.25rem 4rem rgb(4 18 26 / 0.32);
`;

const SearchPanelHeader = styled.div`
	position: relative;
	z-index: 3;
	display: flex;
	flex: 0 0 auto;
	flex-direction: column;
	align-items: stretch;
	gap: 0.55rem;
	background: ${theme.colors.background};
	padding: 1rem 1.25rem 0.75rem;
`;

const PanelSearchInputWrap = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	width: 100%;
`;

const RecommendationBanner = styled.div`
	display: inline-flex;
	align-self: flex-start;
	border-radius: 999px;
	background: rgb(218 142 91 / 0.16);
	padding: 0.35rem 0.7rem;
	color: ${theme.colors.orangeDark};
	font-size: 0.78rem;
	font-weight: 700;
	letter-spacing: 0.02em;
	text-transform: uppercase;
`;

const PanelSearchIcon = styled(SearchIcon)`
	left: 1rem;
	top: 50%;
	width: 16px;
	height: 16px;
	color: ${theme.colors.lightText};
	transform: translateY(-50%);
`;

const PanelSearchInput = styled(InputField)<{
	$isRecommendationMode?: boolean;
}>`
	min-height: 3.25rem;
	min-height: ${({ $isRecommendationMode }) =>
		$isRecommendationMode ? "3.7rem" : "3.25rem"};
	width: 100%;
	border-color: ${theme.colors.orangeLight};
	border-radius: 1.05rem;
	background: rgb(242 239 237 / 0.88);
	padding-block: 0.55rem;
	padding-right: 3rem;
	padding-left: 3rem;
	font-size: 1rem;
	line-height: 1.35;

	&:focus,
	&:focus-visible {
		background: ${theme.colors.surface};
	}

	&::-webkit-search-cancel-button {
		display: none;
	}
`;

const ClearButton = styled.button`
	position: absolute;
	top: 50%;
	right: 0.75rem;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.65rem;
	height: 1.65rem;
	border: 0;
	border-radius: 50%;
	background: ${theme.colors.transparent};
	color: ${theme.colors.bluePrimary};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 1.3rem;
	font-weight: 700;
	line-height: 1;
	transform: translateY(-50%);
	transition:
		background 160ms ease,
		color 160ms ease;

	&:hover,
	&:focus-visible {
		background: ${theme.alpha.orangeGlow};
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;

const Tabs = styled.div`
	position: relative;
	z-index: 3;
	display: flex;
	flex: 0 0 auto;
	gap: 0.5rem;
	overflow-x: auto;
	overflow-y: hidden;
	background: ${theme.colors.background};
	padding: 0 1.25rem 1.8rem;
	scrollbar-width: thin;
	scrollbar-gutter: stable;

	&::-webkit-scrollbar {
		height: 0.45rem;
	}

	&::after {
		position: absolute;
		right: 0;
		bottom: 0;
		left: 0;
		height: 0.8rem;
		background: linear-gradient(
			180deg,
			${theme.colors.background},
			rgb(232 226 222 / 0)
		);
		content: "";
		pointer-events: none;
		transform: translateY(100%);
	}
`;

const TabsWrapper = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
	padding: 0 1.25rem 1rem;

	flex-wrap: wrap;
`;

const RecommendationActions = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	width: 100%;
	flex-wrap: wrap;
`;

const TabsMetaActions = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-left: auto;
	flex-wrap: wrap;
`;

const RecommendationButton = styled.button<{ $variant?: "ghost" }>`
	border: 0.0625rem solid
		${({ $variant }) =>
			$variant === "ghost"
				? theme.colors.orangeLight
				: theme.colors.orangeDark};
	border-radius: 62.4375rem;
	background: ${({ $variant }) =>
		$variant === "ghost"
			? theme.colors.surface
			: `linear-gradient(135deg, ${theme.colors.orangeDark}, ${theme.colors.orangeLight})`};
	padding: 0.55rem 0.95rem;
	color: ${({ $variant }) =>
		$variant === "ghost" ? theme.colors.orangeDark : theme.colors.invertedText};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.9rem;
	font-weight: 700;
	line-height: 1;
	transition:
		transform 160ms ease,
		border-color 160ms ease,
		color 160ms ease,
		background 160ms ease;

	&:hover,
	&:focus-visible {
		outline: none;

		border-color: ${theme.colors.orangeLight};
	}
`;

const ResultsArea = styled.div`
	position: relative;
	z-index: 1;
	display: flex;
	min-height: 16rem;
	flex: 1 1 auto;
	flex-direction: column;
	gap: 0.5rem;
	overflow-y: auto;
	padding: 0.9rem 1.25rem 6.25rem;
`;

const RecentSearchesBlock = styled.div`
	padding: 1.25rem 0 2rem;
`;

const RecentHeading = styled.h2`
	margin: 0 0 0.75rem;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.15rem;
	font-weight: 500;
	line-height: 1.2;
`;

const RecentList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.55rem;
`;

const RecentButton = styled.button`
	border: 0.0625rem solid rgb(211 202 196 / 0.7);
	border-radius: 62.4375rem;
	background: ${theme.colors.surface};
	padding: 0.5rem 0.8rem;
	color: ${theme.colors.foreground};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.9rem;
	line-height: 1;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;

const EmptyState = styled.div`
	padding: 2rem 0;
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.95rem;
	text-align: center;
`;

const SuggestionButton = styled.button`
	display: inline-flex;
	margin-left: 0.45rem;
	border: 0;
	background: transparent;
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font: inherit;
	font-weight: 700;

	&:hover,
	&:focus-visible {
		color: ${theme.colors.bluePrimary};
		outline: none;
	}
`;

const ResultsNumber = styled.span`
	color: ${theme.colors.orangeDark};
	font-family: ${theme.fonts.serif};
	font-size: 1.3rem;
	font-weight: 600;
	line-height: 1;
`;

const ResultsText = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.96rem;
	line-height: 1;
	font-weight: 500;
`;

const ResultsBadge = styled.div`
	display: inline-flex;
	min-height: 2.35rem;
	align-items: baseline;
	justify-content: center;
	gap: 0.42rem;
	padding: 0.48rem 0.85rem;
	white-space: nowrap;

	@media (max-width: 72rem) {
		justify-self: start;
	}
`;

const SearchFooter = styled.div`
	position: absolute;
	z-index: 2;
	right: 0;
	bottom: 0;
	left: 0;
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 1rem;
	border-top: 0.0625rem solid rgb(211 202 196 / 0.72);
	background:
		linear-gradient(
			180deg,
			rgb(232 226 222 / 0),
			${theme.colors.background} 22%
		),
		${theme.colors.background};
	padding: 1.1rem 1.25rem 1rem;
`;

const ViewAllButton = styled(Button)`
	&& {
		padding: 0.6rem 1.25rem;
		font-family: ${theme.fonts.sans};
		font-size: 0.95rem;
	}
`;
