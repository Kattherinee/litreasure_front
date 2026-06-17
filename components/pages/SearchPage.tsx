"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";

import { AppPagination } from "@/shared/ui/AppPagination";
import type { IBookRecomendation } from "@/shared/api/recomendations/recomendations.types";

import {
	useSearchAllQuery,
	useSearchAuthorsQuery,
	useSearchBooksQuery,
	useSearchCollectionsQuery,
	useSearchGenresQuery,
	useSearchSeriesQuery,
} from "@/shared/api/search";
import { getRecomendationsByPrompt } from "@/shared/api/recomendations/recomendations.api";
import { theme } from "@/shared/theme";
import { InputField } from "@/shared/ui/InputField";
import { useDebouncedValue } from "@/shared/utils/useDebouncedValue";
import { AuthorResultCard } from "@/shared/ui/BookSearch/AuthorResultCard";
import { BookResultCard } from "@/shared/ui/BookSearch/BookResultCard";
import { CollectionResultCard } from "@/shared/ui/BookSearch/CollectionResultCard";
import { GenreResultCard } from "@/shared/ui/BookSearch/GenreResultCard";
import { SeriesResultCard } from "@/shared/ui/BookSearch/SeriesResultCard";
import {
	type ISearchTabActiveId,
	SEARCH_TABS,
	SearchTabBar,
} from "@/shared/ui/BookSearch/SearchTabBar";

const MIN_SEARCH_LENGTH = 2;
const RECENT_SEARCHES_KEY = "litreasure:recent-searches";
const RECOMMENDATION_RECENT_SEARCHES_KEY =
	"litreasure:recent-recommendation-searches";
const RECENT_SEARCHES_LIMIT = 6;
const ALL_PREVIEW_LIMIT = 15;
const TAB_SEARCH_LIMIT = 15;
const RECOMMENDATION_LIMIT = 10;

const isSearchTab = (value: string): value is ISearchTabActiveId =>
	SEARCH_TABS.some((tab) => tab.id === value);

const getPageParam = (params: URLSearchParams) => {
	const page = Number(params.get("page") ?? 1);
	return Number.isFinite(page) && page > 0 ? page : 1;
};

const getGenreIdsParam = (params: URLSearchParams): string[] | undefined => {
	const rawGenreIds = params.get("genreIds")?.trim();

	if (!rawGenreIds) return undefined;

	const genreIds = rawGenreIds
		.split(",")
		.map((genreId) => genreId.trim())
		.filter(Boolean);

	return genreIds.length > 0 ? genreIds : undefined;
};

// Returns 0 if all shown, -1 if more exist but count unknown, N>0 if exact remainder known
const getSectionRemaining = (shown: number, total?: number): number => {
	if (total != null) return Math.max(0, total - shown);
	return shown >= ALL_PREVIEW_LIMIT ? -1 : 0;
};

const getShowAllLabel = (shown: number, total?: number): string => {
	const remaining = getSectionRemaining(shown, total);
	return remaining > 0 ? `View all · ${remaining}` : "View all ->";
};

const getSavedRecentSearches = (storageKey: string): string[] => {
	if (typeof window === "undefined") return [];
	try {
		const saved = window.localStorage.getItem(storageKey);
		if (!saved) return [];
		const parsed = JSON.parse(saved);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter((search): search is string => typeof search === "string")
			.slice(0, RECENT_SEARCHES_LIMIT);
	} catch {
		return [];
	}
};

const SearchPage = () => {
	const searchParams = useSearchParams();
	const router = useRouter();

	const initialQuery = searchParams.get("q") ?? "";
	const initialTabParam = searchParams.get("tab") ?? "all";
	const initialModeParam = searchParams.get("mode");
	const isInitialRecommendationMode = initialModeParam === "recommendation";
	const initialTab: ISearchTabActiveId = isSearchTab(initialTabParam)
		? initialTabParam
		: "all";

	const [searchValue, setSearchValue] = useState(initialQuery);
	const [activeTab, setActiveTab] = useState<ISearchTabActiveId>(initialTab);
	const [isRecommendationMode, setIsRecommendationMode] = useState(
		isInitialRecommendationMode,
	);
	const [submittedRecommendationPrompt, setSubmittedRecommendationPrompt] =
		useState(isInitialRecommendationMode ? initialQuery : "");
	const [recentSearches, setRecentSearches] = useState<string[]>(() =>
		getSavedRecentSearches(RECENT_SEARCHES_KEY),
	);
	const [recommendationRecentSearches, setRecommendationRecentSearches] =
		useState<string[]>(() =>
			getSavedRecentSearches(RECOMMENDATION_RECENT_SEARCHES_KEY),
		);

	const normalizedSearchValue = searchValue.trim();
	const debouncedSearchValue = useDebouncedValue(normalizedSearchValue, 1000);
	const highlightQuery = searchParams.get("q") ?? "";
	const shouldSearch = debouncedSearchValue.length >= MIN_SEARCH_LENGTH;
	const page = getPageParam(searchParams);
	const genreIds = useMemo(
		() => getGenreIdsParam(searchParams),
		[searchParams],
	);
	const recommendationPrompt = submittedRecommendationPrompt.trim();

	const { data: allData, isFetching: isFetchingAll } = useSearchAllQuery(
		debouncedSearchValue,
		ALL_PREVIEW_LIMIT,
		{ enabled: shouldSearch && !isRecommendationMode && activeTab === "all" },
	);

	const { data: booksData, isFetching: isFetchingBooks } = useSearchBooksQuery(
		debouncedSearchValue,
		page,
		TAB_SEARCH_LIMIT,
		{ enabled: shouldSearch && !isRecommendationMode && activeTab === "book" },
	);

	const { data: authorsData, isFetching: isFetchingAuthors } =
		useSearchAuthorsQuery(debouncedSearchValue, page, TAB_SEARCH_LIMIT, {
			enabled: shouldSearch && !isRecommendationMode && activeTab === "author",
		});

	const { data: seriesData, isFetching: isFetchingSeries } =
		useSearchSeriesQuery(
			debouncedSearchValue,
			page,
			TAB_SEARCH_LIMIT,
			genreIds,
			{
				enabled:
					shouldSearch && !isRecommendationMode && activeTab === "series",
			},
		);

	const { data: genresData, isFetching: isFetchingGenres } =
		useSearchGenresQuery(debouncedSearchValue, page, TAB_SEARCH_LIMIT, {
			enabled: shouldSearch && !isRecommendationMode && activeTab === "genre",
		});

	const { data: collectionsData, isFetching: isFetchingCollections } =
		useSearchCollectionsQuery(debouncedSearchValue, page, TAB_SEARCH_LIMIT, {
			enabled:
				shouldSearch && !isRecommendationMode && activeTab === "collection",
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

	const isFetching =
		isFetchingAll ||
		isFetchingBooks ||
		isFetchingAuthors ||
		isFetchingSeries ||
		isFetchingGenres ||
		isFetchingCollections ||
		isFetchingRecommendations;

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

	const tabPages = useMemo(() => {
		const getPages = (data?: { total: number; limit: number }) =>
			data ? Math.ceil(data.total / data.limit) : 1;
		if (activeTab === "book") return getPages(booksData);
		if (activeTab === "author") return getPages(authorsData);
		if (activeTab === "series") return getPages(seriesData);
		if (activeTab === "genre") return getPages(genresData);
		if (activeTab === "collection") return getPages(collectionsData);
		return 1;
	}, [
		activeTab,
		booksData,
		authorsData,
		seriesData,
		genresData,
		collectionsData,
	]);

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

	const saveRecentSearch = (value = normalizedSearchValue) => {
		const next = value.trim();
		if (next.length < MIN_SEARCH_LENGTH) return;
		const current = getSavedRecentSearches(RECENT_SEARCHES_KEY);
		const deduped = current.filter(
			(search) => search.toLowerCase() !== next.toLowerCase(),
		);
		const nextList = [next, ...deduped].slice(0, RECENT_SEARCHES_LIMIT);
		window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextList));
		setRecentSearches(nextList);
	};

	const saveRecommendationSearch = (value = normalizedSearchValue) => {
		const next = value.trim();
		if (next.length < MIN_SEARCH_LENGTH) return;
		const current = getSavedRecentSearches(RECOMMENDATION_RECENT_SEARCHES_KEY);
		const deduped = current.filter(
			(search) => search.toLowerCase() !== next.toLowerCase(),
		);
		const nextList = [next, ...deduped].slice(0, RECENT_SEARCHES_LIMIT);
		window.localStorage.setItem(
			RECOMMENDATION_RECENT_SEARCHES_KEY,
			JSON.stringify(nextList),
		);
		setRecommendationRecentSearches(nextList);
	};

	const replaceSearchParams = useCallback(
		(nextParams: URLSearchParams) => {
			router.replace(`/search?${nextParams.toString()}`, { scroll: false });
		},
		[router],
	);

	useEffect(() => {
		if (isRecommendationMode) return;

		const nextParams = new URLSearchParams(searchParams.toString());
		if (debouncedSearchValue) {
			nextParams.set("q", debouncedSearchValue);
		} else {
			nextParams.delete("q");
		}
		nextParams.delete("page");

		if (nextParams.toString() === searchParams.toString()) return;
		replaceSearchParams(nextParams);
	}, [
		debouncedSearchValue,
		isRecommendationMode,
		searchParams,
		replaceSearchParams,
	]);

	const handleTabChange = (tab: ISearchTabActiveId) => {
		setActiveTab(tab);
		const params = new URLSearchParams(searchParams.toString());
		if (tab === "all") {
			params.delete("tab");
		} else {
			params.set("tab", tab);
		}
		params.delete("page");
		replaceSearchParams(params);
	};

	const handlePageChange = (nextPage: number) => {
		const params = new URLSearchParams(searchParams.toString());
		if (nextPage <= 1) {
			params.delete("page");
		} else {
			params.set("page", String(nextPage));
		}
		replaceSearchParams(params);
	};

	const handleSearchChange = (value: string) => {
		setSearchValue(value);
	};
	const handleSuggestionSearch = (suggestion: string) => {
		setSearchValue(suggestion);
		const params = new URLSearchParams(searchParams.toString());
		params.set("q", suggestion);
		params.delete("page");
		replaceSearchParams(params);
	};

	const noop = () => {};

	const allSectionHasResults =
		allData &&
		(allData.books.length > 0 ||
			allData.authors.length > 0 ||
			allData.series.length > 0 ||
			allData.genres.length > 0 ||
			allData.collections.length > 0);

	const tabTotal =
		activeTab === "all"
			? (allData?.total ?? 0)
			: activeTab === "book"
				? (booksData?.total ?? 0)
				: activeTab === "author"
					? (authorsData?.total ?? 0)
					: activeTab === "series"
						? (seriesData?.total ?? 0)
						: activeTab === "genre"
							? (genresData?.total ?? 0)
							: (collectionsData?.total ?? 0);

	const tabTotalLabel =
		activeTab === "all"
			? "results"
			: activeTab === "book"
				? "books"
				: activeTab === "author"
					? "authors"
					: activeTab === "series"
						? "series"
						: activeTab === "genre"
							? "genres"
							: "collections";

	return (
		<PageWrap>
			<SearchHeader>
				<SearchTitle>Search</SearchTitle>
				{isRecommendationMode ? (
					<RecommendationBanner>Recommendation mode</RecommendationBanner>
				) : null}
				<SearchInputWrap>
					<SearchIcon aria-hidden="true" />
					<StyledInput
						$isRecommendationMode={isRecommendationMode}
						aria-label="Search"
						autoFocus
						placeholder={
							isRecommendationMode
								? "Describe your preferences, and we will suggest a suitable book"
								: "Title, author, series, genre"
						}
						type="search"
						value={searchValue}
						onChange={(event) => handleSearchChange(event.target.value)}
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
							onClick={() => handleSearchChange("")}
						>
							×
						</ClearButton>
					) : null}
				</SearchInputWrap>
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
									counts={{
										book: booksData?.total ?? 0,
										author: authorsData?.total ?? 0,
										series: seriesData?.total ?? 0,
										genre: genresData?.total ?? 0,
										collection: collectionsData?.total ?? 0,
									}}
									isFetching={isFetching}
									shouldSearch={shouldSearch}
									total={allData?.total ?? 0}
									onTabChange={handleTabChange}
								/>
							</Tabs>
							<TabsMetaActions>
								<RecommendationButton
									$variant="ghost"
									type="button"
									onClick={handleRecommendationModeToggle}
								>
									Recommendation mode
								</RecommendationButton>
								{shouldSearch && !isFetching && tabTotal > 0 ? (
									<ResultsBadge
										aria-label={`Found ${tabTotal} ${tabTotalLabel}`}
									>
										<ResultsNumber>{tabTotal}</ResultsNumber>
										<ResultsText>{tabTotalLabel}</ResultsText>
									</ResultsBadge>
								) : null}
							</TabsMetaActions>
						</>
					)}
				</TabsWrapper>
			</SearchHeader>

			<ResultsArea>
				{isRecommendationMode ? (
					recommendationPrompt.length < MIN_SEARCH_LENGTH ? (
						recommendationRecentSearches.length > 0 ? (
							<RecentBlock>
								<RecentHeading>Recent recommendation queries</RecentHeading>
								<RecentList>
									{recommendationRecentSearches.map((search) => (
										<RecentButton
											key={search}
											type="button"
											onClick={() => {
												handleSearchChange(search);
												setSubmittedRecommendationPrompt(search);
											}}
										>
											{search}
										</RecentButton>
									))}
								</RecentList>
							</RecentBlock>
						) : (
							<EmptyState>
								Describe your preferences and click &quot;Find a book&quot;.
							</EmptyState>
						)
					) : isFetchingRecommendations ? (
						<EmptyState>Selecting books...</EmptyState>
					) : recommendationCards.length > 0 ? (
						<ResultSection>
							{recommendationCards.map((book) => (
								<BookResultCard
									key={book.id}
									book={book}
									isRecommendation
									closeSearch={noop}
									query={recommendationPrompt}
									saveRecentSearch={saveRecommendationSearch}
								/>
							))}
						</ResultSection>
					) : (
						<EmptyState>
							Nothing found yet. Try refining your preferences.
						</EmptyState>
					)
				) : !shouldSearch ? (
					recentSearches.length > 0 ? (
						<RecentBlock>
							<RecentHeading>Recent queries</RecentHeading>
							<RecentList>
								{recentSearches.map((search) => (
									<RecentButton
										key={search}
										type="button"
										onClick={() => handleSearchChange(search)}
									>
										{search}
									</RecentButton>
								))}
							</RecentList>
						</RecentBlock>
					) : (
						<EmptyState>Enter a search query</EmptyState>
					)
				) : null}

				{shouldSearch && !isRecommendationMode && isFetching ? (
					<EmptyState>Searching...</EmptyState>
				) : null}

				{shouldSearch &&
				!isRecommendationMode &&
				!isFetching &&
				activeTab === "all" ? (
					allSectionHasResults ? (
						<>
							{allData && allData.books.length > 0 ? (
								<AllSection>
									<AllSectionTitle>Books</AllSectionTitle>
									<ResultSection>
										{allData.books.slice(0, ALL_PREVIEW_LIMIT).map((book) => (
											<BookResultCard
												key={book.id}
												book={book}
												closeSearch={noop}
												query={highlightQuery}
												saveRecentSearch={saveRecentSearch}
											/>
										))}
									</ResultSection>
									{getSectionRemaining(
										allData.books.length,
										allData.booksTotal,
									) !== 0 ? (
										<AllSectionFooter>
											<ShowAllButton
												type="button"
												onClick={() => handleTabChange("book")}
											>
												{getShowAllLabel(
													allData.books.length,
													allData.booksTotal,
												)}
											</ShowAllButton>
										</AllSectionFooter>
									) : null}
								</AllSection>
							) : null}

							{allData && allData.authors.length > 0 ? (
								<AllSection>
									<AllSectionTitle>Authors</AllSectionTitle>
									<ResultSection>
										{allData.authors
											.slice(0, ALL_PREVIEW_LIMIT)
											.map((author) => (
												<AuthorResultCard
													key={author.id}
													author={author}
													closeSearch={noop}
													query={highlightQuery}
													saveRecentSearch={saveRecentSearch}
												/>
											))}
									</ResultSection>
									{getSectionRemaining(
										allData.authors.length,
										allData.authorsTotal,
									) !== 0 ? (
										<AllSectionFooter>
											<ShowAllButton
												type="button"
												onClick={() => handleTabChange("author")}
											>
												{getShowAllLabel(
													allData.authors.length,
													allData.authorsTotal,
												)}
											</ShowAllButton>
										</AllSectionFooter>
									) : null}
								</AllSection>
							) : null}

							{allData && allData.series.length > 0 ? (
								<AllSection>
									<AllSectionTitle>Series</AllSectionTitle>
									<ResultSection>
										{allData.series
											.slice(0, ALL_PREVIEW_LIMIT)
											.map((series) => (
												<SeriesResultCard
													key={series.id}
													query={highlightQuery}
													series={series}
													closeSearch={noop}
													saveRecentSearch={saveRecentSearch}
												/>
											))}
									</ResultSection>
									{getSectionRemaining(
										allData.series.length,
										allData.seriesTotal,
									) !== 0 ? (
										<AllSectionFooter>
											<ShowAllButton
												type="button"
												onClick={() => handleTabChange("series")}
											>
												{getShowAllLabel(
													allData.series.length,
													allData.seriesTotal,
												)}
											</ShowAllButton>
										</AllSectionFooter>
									) : null}
								</AllSection>
							) : null}

							{allData && allData.genres.length > 0 ? (
								<AllSection>
									<AllSectionTitle>Genres</AllSectionTitle>
									<ResultSection>
										{allData.genres.slice(0, ALL_PREVIEW_LIMIT).map((genre) => (
											<GenreResultCard
												key={genre.id}
												closeSearch={noop}
												genre={genre}
												query={highlightQuery}
												saveRecentSearch={saveRecentSearch}
											/>
										))}
									</ResultSection>
									{getSectionRemaining(
										allData.genres.length,
										allData.genresTotal,
									) !== 0 ? (
										<AllSectionFooter>
											<ShowAllButton
												type="button"
												onClick={() => handleTabChange("genre")}
											>
												{getShowAllLabel(
													allData.genres.length,
													allData.genresTotal,
												)}
											</ShowAllButton>
										</AllSectionFooter>
									) : null}
								</AllSection>
							) : null}

							{allData && allData.collections.length > 0 ? (
								<AllSection>
									<AllSectionTitle>Collections</AllSectionTitle>
									<ResultSection>
										{allData.collections
											.slice(0, ALL_PREVIEW_LIMIT)
											.map((collection) => (
												<CollectionResultCard
													key={collection.id}
													closeSearch={noop}
													collection={collection}
													query={highlightQuery}
													saveRecentSearch={saveRecentSearch}
												/>
											))}
									</ResultSection>
									{getSectionRemaining(
										allData.collections.length,
										allData.collectionsTotal,
									) !== 0 ? (
										<AllSectionFooter>
											<ShowAllButton
												type="button"
												onClick={() => handleTabChange("collection")}
											>
												{getShowAllLabel(
													allData.collections.length,
													allData.collectionsTotal,
												)}
											</ShowAllButton>
										</AllSectionFooter>
									) : null}
								</AllSection>
							) : null}
						</>
					) : (
						<EmptyState>Nothing found.</EmptyState>
					)
				) : null}

				{shouldSearch &&
				!isRecommendationMode &&
				!isFetching &&
				activeTab === "book" ? (
					booksData && booksData.items.length > 0 ? (
						<>
							<ResultSection>
								{booksData.items.map((book) => (
									<BookResultCard
										key={book.id}
										book={book}
										closeSearch={noop}
										query={highlightQuery}
										saveRecentSearch={saveRecentSearch}
									/>
								))}
							</ResultSection>
							<AppPagination
								count={tabPages}
								page={page}
								onChange={handlePageChange}
							/>
						</>
					) : (
						<EmptyState>Books not found.</EmptyState>
					)
				) : null}

				{shouldSearch &&
				!isRecommendationMode &&
				!isFetching &&
				activeTab === "author" ? (
					authorsData && authorsData.items.length > 0 ? (
						<>
							<ResultSection>
								{authorsData.items.map((author) => (
									<AuthorResultCard
										key={author.id}
										author={author}
										closeSearch={noop}
										query={highlightQuery}
										saveRecentSearch={saveRecentSearch}
									/>
								))}
							</ResultSection>
							<AppPagination
								count={tabPages}
								page={page}
								onChange={handlePageChange}
							/>
						</>
					) : (
						<EmptyState>Authors not found.</EmptyState>
					)
				) : null}

				{shouldSearch &&
				!isRecommendationMode &&
				!isFetching &&
				activeTab === "series" ? (
					seriesData && seriesData.items.length > 0 ? (
						<>
							<ResultSection>
								{seriesData.items.map((series) => (
									<SeriesResultCard
										key={series.id}
										series={series}
										closeSearch={noop}
										query={highlightQuery}
										saveRecentSearch={saveRecentSearch}
									/>
								))}
							</ResultSection>
							<AppPagination
								count={tabPages}
								page={page}
								onChange={handlePageChange}
							/>
						</>
					) : (
						<EmptyState>Series not found.</EmptyState>
					)
				) : null}

				{shouldSearch &&
				!isRecommendationMode &&
				!isFetching &&
				activeTab === "genre" ? (
					genresData && genresData.items.length > 0 ? (
						<>
							<ResultSection>
								{genresData.items.map((genre) => (
									<GenreResultCard
										key={genre.id}
										closeSearch={noop}
										genre={genre}
										query={highlightQuery}
										saveRecentSearch={saveRecentSearch}
									/>
								))}
							</ResultSection>
							<AppPagination
								count={tabPages}
								page={page}
								onChange={handlePageChange}
							/>
						</>
					) : (
						<EmptyState>
							Genres not found.
							{genresData?.suggestion ? (
								<SuggestionButton
									type="button"
									onClick={() => handleSuggestionSearch(genresData.suggestion!)}
								>
									Search for &quot;{genresData.suggestion}&quot;
								</SuggestionButton>
							) : null}
						</EmptyState>
					)
				) : null}

				{shouldSearch &&
				!isRecommendationMode &&
				!isFetching &&
				activeTab === "collection" ? (
					collectionsData && collectionsData.items.length > 0 ? (
						<>
							<ResultSection>
								{collectionsData.items.map((collection) => (
									<CollectionResultCard
										key={collection.id}
										closeSearch={noop}
										collection={collection}
										query={highlightQuery}
										saveRecentSearch={saveRecentSearch}
									/>
								))}
							</ResultSection>
							<AppPagination
								count={tabPages}
								page={page}
								onChange={handlePageChange}
							/>
						</>
					) : (
						<EmptyState>Collections not found.</EmptyState>
					)
				) : null}
			</ResultsArea>
		</PageWrap>
	);
};

export default SearchPage;

const PageWrap = styled.div`
	display: flex;
	min-height: 100dvh;
	flex-direction: column;
	width: 60vw;
	margin: 0 auto;

	@media (max-width: 720px) {
		width: 95vw;
		padding-top: 2rem;
	}
`;

const SearchHeader = styled.div`
	position: sticky;
	z-index: 10;
	top: 0;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	border-bottom: 0.0625rem solid rgb(211 202 196 / 0.5);
	background: ${theme.colors.background};
	padding: 2rem 1rem 1rem;

	@media (max-width: 720px) {
		padding: 3.3rem 1rem 1rem;
	}
`;

const SearchTitle = styled.h1`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.65rem;
	font-weight: 600;
	line-height: 1.2;
`;

const SearchInputWrap = styled.div`
	position: relative;
	display: flex;
	align-items: center;
`;

const SearchIcon = styled.span`
	position: absolute;
	left: 1rem;
	width: 14px;
	height: 14px;
	border: 2px solid currentColor;
	border-radius: 50%;
	color: ${theme.colors.softForeground};
	pointer-events: none;

	&::after {
		position: absolute;
		right: -6px;
		bottom: -4px;
		width: 9px;
		height: 2px;
		border-radius: 999px;
		background: currentColor;
		content: "";
		transform: rotate(45deg);
	}
`;

const StyledInput = styled(InputField)<{ $isRecommendationMode?: boolean }>`
	width: 100%;

	min-height: ${({ $isRecommendationMode }) =>
		$isRecommendationMode ? "3.5rem" : "3rem"};
	border-color: ${theme.colors.orangeLight};
	border-radius: 1.05rem;
	background: rgb(242 239 237 / 0.88);
	padding-block: 0.55rem;
	padding-left: 2.75rem;
	padding-right: 3rem;
	font-size: 1rem;

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
	right: 1rem;
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
	transition:
		background 160ms ease,
		color 160ms ease;

	&:hover,
	&:focus-visible {
		color: ${theme.colors.orangeDark};
		outline: none;
	}

	@media (max-width: 720px) {
		left: auto;
		right: 0.5rem;
	}
`;

const Tabs = styled.div`
	display: flex;
	gap: 0.5rem;
	overflow-x: auto;
	overflow-y: hidden;
	padding-bottom: 1rem;
	scrollbar-width: thin;
	scrollbar-gutter: stable;

	&::-webkit-scrollbar {
		height: 0.45rem;
	}
`;
const TabsWrapper = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
	flex-wrap: wrap;

	@media (max-width: 48rem) {
		gap: 0.65rem;
	}
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
		transform: translateY(-0.0625rem);
		border-color: ${theme.colors.orangeLight};
	}
`;

const ResultsArea = styled.div`
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 0.5rem;
	padding: 1rem 1rem 3rem;

	@media (max-width: 720px) {
		padding: 1rem;
	}
`;

const AllSection = styled.section`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding-bottom: 1.5rem;
`;

const AllSectionFooter = styled.div`
	display: flex;
	justify-content: flex-end;
	padding-top: 0.25rem;
`;

const AllSectionTitle = styled.h2`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.1rem;
	font-weight: 600;
`;

const ShowAllButton = styled.button`
	border: 0;
	background: none;
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.85rem;
	line-height: 1;
	padding: 0;
	transition: color 160ms ease;

	&:hover,
	&:focus-visible {
		color: ${theme.colors.orangeLight};
		outline: none;
		text-decoration: underline;
	}
`;

const ResultSection = styled.section`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const RecentBlock = styled.div`
	padding: 1.25rem 0;
`;

const RecentHeading = styled.h2`
	margin: 0 0 0.75rem;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.15rem;
	font-weight: 500;
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
	padding: 4rem 0;
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
	text-decoration: none;

	&:hover,
	&:focus-visible {
		color: ${theme.colors.bluePrimary};
		outline: none;
	}
`;

const ResultsNumber = styled.span`
	color: ${theme.colors.orangeDark};
	font-family: ${theme.fonts.serif};
	font-size: 1.3vw;
	font-weight: 600;
	line-height: 1;
`;

const ResultsText = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.96vw;
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
