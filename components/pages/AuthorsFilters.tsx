"use client";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Slider from "@mui/material/Slider";
import { useMemo, useState } from "react";
import styled from "styled-components";

import type { IAuthorsGenreMode, IAuthorsSort } from "@/shared/api/authors";
import { useGenresQuery } from "@/shared/api/genres";
import type { ISearchGenre } from "@/shared/api/search";
import { useSearchGenresQuery } from "@/shared/api/search";
import { theme } from "@/shared/theme";

export const BOOKS_RANGE_MAX = 100;

const sortOptions: Array<{ label: string; value: IAuthorsSort }> = [
	{ label: "Popular", value: "popular" },
	{ label: "More books", value: "books_desc" },
	{ label: "Fewer books", value: "books_asc" },
	{ label: "A-Z", value: "name_asc" },
	{ label: "Z-A", value: "name_desc" },
];

const genreModeOptions: Array<{ label: string; value: IAuthorsGenreMode }> = [
	{ label: "Any", value: "any" },
	{ label: "All", value: "all" },
];

interface IAuthorsFiltersProps {
	booksRange: [number, number];
	genreMode: IAuthorsGenreMode;
	selectedGenres: string[];
	sort: IAuthorsSort;
	total: number;
	onBooksRangeChange: (value: [number, number]) => void;
	onClearGenres: () => void;
	onGenreModeChange: (value: IAuthorsGenreMode) => void;
	onSortChange: (value: IAuthorsSort) => void;
	onToggleGenre: (value: string) => void;
}

export const AuthorsFilters = ({
	booksRange,
	genreMode,
	onBooksRangeChange,
	onClearGenres,
	onGenreModeChange,
	onSortChange,
	onToggleGenre,
	selectedGenres,
	sort,
	total,
}: IAuthorsFiltersProps) => {
	const [isSortOpen, setIsSortOpen] = useState(false);
	const [isGenresOpen, setIsGenresOpen] = useState(false);
	const [genreSearch, setGenreSearch] = useState("");
	const [genreSearchPage, setGenreSearchPage] = useState(1);
	const [loadedSearchGenres, setLoadedSearchGenres] = useState<ISearchGenre[]>(
		[],
	);
	const [prevSearchedGenresResponse, setPrevSearchedGenresResponse] =
		useState<typeof searchedGenresResponse>(undefined);
	const { data: genres = [], isLoading: isGenresLoading } = useGenresQuery();
	const normalizedGenreSearch = genreSearch.trim();
	const shouldSearchGenres = normalizedGenreSearch.length >= 2;
	const { data: searchedGenresResponse, isLoading: isSearchedGenresLoading } =
		useSearchGenresQuery(normalizedGenreSearch, genreSearchPage, 30, {
			enabled: shouldSearchGenres,
		});

	const handleGenreSearchChange = (value: string) => {
		setGenreSearch(value);
		setGenreSearchPage(1);
		setLoadedSearchGenres([]);
		setPrevSearchedGenresResponse(undefined);
	};

	if (
		searchedGenresResponse !== prevSearchedGenresResponse &&
		shouldSearchGenres &&
		searchedGenresResponse
	) {
		setPrevSearchedGenresResponse(searchedGenresResponse);
		const nextGenres =
			genreSearchPage === 1
				? searchedGenresResponse.items
				: [...loadedSearchGenres, ...searchedGenresResponse.items];
		setLoadedSearchGenres(
			Array.from(
				new Map(nextGenres.map((genre) => [genre.slug, genre])).values(),
			),
		);
	}
	const availableGenres = shouldSearchGenres ? loadedSearchGenres : genres;
	const selectedSortOption =
		sortOptions.find((option) => option.value === sort) ?? sortOptions[0];
	const selectedGenreLabels = selectedGenres
		.map(
			(genreSlug) =>
				[...genres, ...loadedSearchGenres].find(
					(genre) => genre.slug === genreSlug,
				)?.name ?? genreSlug,
		)
		.join(", ");
	const selectedGenreItems = selectedGenres.map((genreSlug) => ({
		label:
			[...genres, ...loadedSearchGenres].find(
				(genre) => genre.slug === genreSlug,
			)?.name ?? genreSlug,
		value: genreSlug,
	}));
	const canLoadMoreGenres =
		shouldSearchGenres &&
		Boolean(searchedGenresResponse) &&
		loadedSearchGenres.length < (searchedGenresResponse?.total ?? 0);
	const filteredGenres = useMemo(() => {
		const normalizedSearch = genreSearch.trim().toLowerCase();

		return [...availableGenres]
			.sort((firstGenre, secondGenre) =>
				firstGenre.name.localeCompare(secondGenre.name, "en"),
			)
			.filter((genre) => {
				if (shouldSearchGenres || !normalizedSearch) return true;

				return (
					genre.name.toLowerCase().includes(normalizedSearch) ||
					genre.slug.toLowerCase().includes(normalizedSearch)
				);
			});
	}, [availableGenres, genreSearch, shouldSearchGenres]);

	return (
		<Filters
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
					setIsSortOpen(false);
					setIsGenresOpen(false);
				}
			}}
		>
			<DropdownField>
				<FilterLabel>Sort</FilterLabel>
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
								onSortChange(option.value);
								setIsSortOpen(false);
							}}
						>
							{option.label}
						</DropdownMenuItem>
					))}
				</DropdownMenu>
			</DropdownField>

			<DropdownField>
				<FilterLabel>Genres</FilterLabel>
				<DropdownButton
					aria-expanded={isGenresOpen}
					type="button"
					onClick={() => setIsGenresOpen((current) => !current)}
				>
					<DropdownValue>
						{selectedGenres.length > 0 ? selectedGenreLabels : "Select genres"}
					</DropdownValue>
					<ChevronIcon $isOpen={isGenresOpen} aria-hidden="true" />
				</DropdownButton>
				<GenreMenu $isOpen={isGenresOpen}>
					<GenreSearchInput
						placeholder="Find genre"
						suppressHydrationWarning
						value={genreSearch}
						onChange={(event) => handleGenreSearchChange(event.target.value)}
					/>
					<GenreChips>
						<GenreChip
							$isSelected={selectedGenres.length === 0}
							type="button"
							onClick={onClearGenres}
						>
							All
						</GenreChip>
						{isGenresLoading || isSearchedGenresLoading ? (
							<GenreEmpty>Loading...</GenreEmpty>
						) : filteredGenres.length > 0 ? (
							filteredGenres.map((genre) => (
								<GenreChip
									key={genre.id}
									$isSelected={selectedGenres.includes(genre.slug)}
									type="button"
									onClick={() => onToggleGenre(genre.slug)}
								>
									{genre.name}
								</GenreChip>
							))
						) : (
							<GenreEmpty>Nothing found</GenreEmpty>
						)}
					</GenreChips>
					{selectedGenres.length > 0 ? (
						<ClearGenresButton type="button" onClick={onClearGenres}>
							Clear
						</ClearGenresButton>
					) : null}
					{canLoadMoreGenres ? (
						<LoadMoreGenresButton
							disabled={isSearchedGenresLoading}
							type="button"
							onClick={() =>
								setGenreSearchPage((currentPage) => currentPage + 1)
							}
						>
							{isSearchedGenresLoading ? "Loading..." : "Show more"}
						</LoadMoreGenresButton>
					) : null}
				</GenreMenu>
			</DropdownField>

			<RangeField>
				<FilterLabel id="authors-books-range">
					Books: {booksRange[0]} -{" "}
					{booksRange[1] === BOOKS_RANGE_MAX
						? `${BOOKS_RANGE_MAX}+`
						: booksRange[1]}
				</FilterLabel>
				<BooksSlider
					aria-labelledby="authors-books-range"
					max={BOOKS_RANGE_MAX}
					min={0}
					step={1}
					value={booksRange}
					valueLabelDisplay="auto"
					onChange={(_event, value) => {
						if (!Array.isArray(value)) return;
						onBooksRangeChange(value as [number, number]);
					}}
				/>
			</RangeField>

			<ModeField>
				<FilterLabel>Genre mode</FilterLabel>
				<ModeSwitch>
					{genreModeOptions.map((option) => (
						<ModeButton
							key={option.value}
							$isActive={genreMode === option.value}
							type="button"
							onClick={() => onGenreModeChange(option.value)}
						>
							{option.label}
						</ModeButton>
					))}
				</ModeSwitch>
			</ModeField>

			<ResultsBadge aria-label={`Authors found: ${total}`}>
				<ResultsNumber>{total}</ResultsNumber>
				<ResultsText>authors</ResultsText>
			</ResultsBadge>
			{selectedGenreItems.length > 0 ? (
				<SelectedGenresRow>
					{selectedGenreItems.map((genre) => (
						<SelectedGenreChip key={genre.value}>
							<span>{genre.label}</span>
							<RemoveGenreButton
								aria-label={`Remove genre ${genre.label}`}
								type="button"
								onClick={() => onToggleGenre(genre.value)}
							>
								×
							</RemoveGenreButton>
						</SelectedGenreChip>
					))}
					<ClearSelectedGenresButton type="button" onClick={onClearGenres}>
						Clear all
					</ClearSelectedGenresButton>
				</SelectedGenresRow>
			) : null}
		</Filters>
	);
};

export const Filters = styled.div`
	position: sticky;
	z-index: 15;
	top: 3.25rem;
	display: grid;
	align-items: end;
	gap: 0.65rem;
	grid-template-columns:
		minmax(10rem, 0.85fr) minmax(12rem, 1.2fr) minmax(16rem, 1.7fr)
		minmax(10rem, 0.8fr) auto;
	margin-top: 0.75rem;

	padding: 0.35rem 0 0.65rem;

	@media (max-width: 72rem) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: ${theme.rubberSize.tablet}) {
		position: static;
		top: auto;
		margin-top: 0;
		grid-template-columns: minmax(0, 1fr);
		overflow: visible;
		padding-bottom: 0;
	}
`;

export const ResultsBadge = styled.div`
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

	@media (max-width: 72rem) {
		justify-self: start;
	}
`;

export const ResultsNumber = styled.span`
	color: ${theme.colors.orangeDark};
	font-family: ${theme.fonts.serif};
	font-size: 1.18rem;
	font-weight: 600;
	line-height: 1;
`;

export const ResultsText = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.86rem;
	line-height: 1;
`;

export const DropdownField = styled.div`
	position: relative;
	display: flex;
	min-width: 0;
	flex-direction: column;
	gap: 0.25rem;
`;

export const FilterLabel = styled.label`
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.76rem;
	line-height: 1.2;
`;

export const DropdownButton = styled.button`
	display: flex;
	width: 100%;
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

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		background: ${theme.colors.white};
		outline: none;
	}
`;

export const DropdownValue = styled.span`
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

export const ChevronIcon = styled(KeyboardArrowDownIcon)<{ $isOpen: boolean }>`
	&& {
		width: 1.05rem;
		height: 1.05rem;
		flex: 0 0 auto;
		color: ${theme.colors.orangeDark};
		transform: rotate(${({ $isOpen }) => ($isOpen ? "180deg" : "0deg")});
		transition: transform 160ms ease;
	}
`;

export const DropdownMenu = styled.div<{ $isOpen: boolean }>`
	position: absolute;
	z-index: 12;
	top: calc(100% + 0.4rem);
	left: 0;
	width: min(18rem, calc(100vw - 2rem));
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

export const DropdownMenuItem = styled.button<{ $isSelected: boolean }>`
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

	&:hover,
	&:focus-visible {
		background: rgb(218 142 91 / 0.12);
		color: #d4641c;
		outline: none;
	}
`;

const GenreMenu = styled(DropdownMenu)`
	width: min(28rem, calc(100vw - 2rem));
`;

export const GenreSearchInput = styled.input`
	width: 100%;
	min-height: 2.1rem;
	border: 0.0625rem solid rgb(211 202 196 / 0.7);
	border-radius: 0.625rem;
	background: rgb(255 255 255 / 0.66);
	padding: 0 0.65rem;
	color: ${theme.colors.foreground};
	font: inherit;
	font-size: 0.86rem;
	outline: none;

	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		background: ${theme.colors.white};
	}
`;

const GenreChips = styled.div`
	display: flex;
	max-height: 11rem;
	flex-wrap: wrap;
	gap: 0.38rem;
	overflow-y: auto;
	margin-top: 0.5rem;
	padding-right: 0.2rem;
`;

const GenreChip = styled.button<{ $isSelected: boolean }>`
	border: 0.0625rem solid
		${({ $isSelected }) =>
			$isSelected ? "rgb(218 142 91 / 0.6)" : "rgb(211 202 196 / 0.72)"};
	border-radius: 62.4375rem;
	background: ${({ $isSelected }) =>
		$isSelected ? "rgb(218 142 91 / 0.18)" : "rgb(255 255 255 / 0.58)"};
	padding: 0.34rem 0.66rem;
	color: ${({ $isSelected }) => ($isSelected ? "#d4641c" : "#233d4d")};
	cursor: pointer;
	font: inherit;
	font-size: 0.82rem;
	font-weight: 700;
	line-height: 1;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		background: rgb(218 142 91 / 0.14);
		color: #d4641c;
		outline: none;
	}
`;

const GenreEmpty = styled.span`
	padding: 0.35rem 0.2rem;
	color: ${theme.colors.softForeground};
	font-size: 0.85rem;
`;

const ClearGenresButton = styled.button`
	border: 0;
	background: transparent;
	padding: 0.55rem 0.2rem 0.1rem;
	color: #d4641c;
	cursor: pointer;
	font: inherit;
	font-size: 0.84rem;
	font-weight: 700;
`;

const LoadMoreGenresButton = styled.button`
	width: 100%;
	border: 0.0625rem solid rgb(218 142 91 / 0.28);
	border-radius: 62.4375rem;
	background: rgb(218 142 91 / 0.1);
	margin-top: 0.5rem;
	padding: 0.5rem 0.75rem;
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font: inherit;
	font-size: 0.84rem;
	font-weight: 700;

	&:hover,
	&:focus-visible {
		background: rgb(218 142 91 / 0.16);
		outline: none;
	}

	&:disabled {
		cursor: default;
		opacity: 0.6;
	}
`;

const SelectedGenresRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	grid-column: 1 / -1;
	gap: 0.4rem;
	align-items: center;
	margin-top: -0.15rem;
`;

const SelectedGenreChip = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	border: 0.0625rem solid rgb(218 142 91 / 0.32);
	border-radius: 62.4375rem;
	background: rgb(218 142 91 / 0.12);
	padding: 0.32rem 0.42rem 0.32rem 0.68rem;
	color: ${theme.colors.orangeDark};
	font-size: 0.82rem;
	font-weight: 700;
	line-height: 1;
`;

const RemoveGenreButton = styled.button`
	display: inline-flex;
	width: 1rem;
	height: 1rem;
	align-items: center;
	justify-content: center;
	border: 0;
	border-radius: 50%;
	background: rgb(212 100 28 / 0.16);
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font: inherit;
	font-size: 0.9rem;
	line-height: 1;
	padding: 0;

	&:hover,
	&:focus-visible {
		background: rgb(212 100 28 / 0.24);
		outline: none;
	}
`;

const ClearSelectedGenresButton = styled.button`
	border: 0;
	background: transparent;
	padding: 0.25rem 0.2rem;
	color: ${theme.colors.softForeground};
	cursor: pointer;
	font: inherit;
	font-size: 0.82rem;
	font-weight: 700;

	&:hover,
	&:focus-visible {
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;

const RangeField = styled.div`
	display: flex;
	min-width: 0;
	flex-direction: column;
	gap: 0.25rem;
	padding: 0.45rem 0.75rem 0.2rem;
`;

const BooksSlider = styled(Slider)`
	&& {
		width: calc(100% - 0.75rem);
		margin: 0.05rem 0.35rem 0;
		color: ${theme.colors.orangeLight};

		.MuiSlider-rail {
			background: rgb(35 61 77 / 0.2);
			opacity: 1;
		}

		.MuiSlider-track {
			background: ${theme.colors.orangeLight};
			border: 0;
		}

		.MuiSlider-thumb {
			width: 0.95rem;
			height: 0.95rem;
			background: ${theme.colors.white};
			border: 0.125rem solid ${theme.colors.orangeLight};
			box-shadow: 0 0.25rem 0.75rem rgb(4 18 26 / 0.18);
		}

		.MuiSlider-valueLabel {
			background: ${theme.colors.bluePrimary};
			color: ${theme.colors.invertedText};
			font-family: ${theme.fonts.sans};
		}
	}
`;

export const ModeField = styled.div`
	display: flex;
	min-width: 0;
	flex-direction: column;
	gap: 0.25rem;
`;

export const ModeSwitch = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	min-height: 2.35rem;
	border: 0.0625rem solid rgb(211 202 196 / 0.7);
	border-radius: 0.75rem;
	background: rgb(242 239 237 / 0.58);
	padding: 0.2rem;
`;

export const ModeButton = styled.button<{ $isActive: boolean }>`
	border: 0;
	border-radius: 0.55rem;
	background: ${({ $isActive }) =>
		$isActive ? theme.colors.orangeLight : theme.colors.transparent};
	color: ${({ $isActive }) =>
		$isActive ? theme.colors.invertedText : theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	font-size: 0.84rem;
	font-weight: 700;

	&:hover,
	&:focus-visible {
		color: ${({ $isActive }) =>
			$isActive ? theme.colors.invertedText : theme.colors.orangeDark};
		outline: none;
	}
`;
