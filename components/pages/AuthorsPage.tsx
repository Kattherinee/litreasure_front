"use client";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useMemo, useState } from "react";
import styled from "styled-components";

import type { IAuthorsGenreMode, IAuthorsSort } from "@/shared/api/authors";
import { useAuthorsQuery } from "@/shared/api/authors";
import { theme } from "@/shared/theme";
import { AuthorCard } from "@/shared/ui/AuthorCard";
import { AppPagination } from "@/shared/ui/AppPagination";
import { SkeletonBlock } from "@/shared/ui/Skeleton";

import { AuthorsFilters, BOOKS_RANGE_MAX } from "./AuthorsFilters";

const AUTHORS_LIMIT = 27;

const AuthorsPage = () => {
	const [page, setPage] = useState(1);
	const [sort, setSort] = useState<IAuthorsSort>("popular");
	const [genreMode, setGenreMode] = useState<IAuthorsGenreMode>("any");
	const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
	const [booksRange, setBooksRange] = useState<[number, number]>([
		0,
		BOOKS_RANGE_MAX,
	]);
	const [isFiltersOpen, setIsFiltersOpen] = useState(false);
	const authorsParams = useMemo(
		() => ({
			genreMode: selectedGenres.length > 0 ? genreMode : undefined,
			genres: selectedGenres.length > 0 ? selectedGenres : undefined,
			limit: AUTHORS_LIMIT,
			maxBooks: booksRange[1] < BOOKS_RANGE_MAX ? booksRange[1] : undefined,
			minBooks: booksRange[0] > 0 ? booksRange[0] : undefined,
			page,
			sort,
		}),
		[booksRange, genreMode, page, selectedGenres, sort],
	);
	const {
		data: authorsResponse,
		error,
		isError,
		isLoading,
	} = useAuthorsQuery(authorsParams);
	const authors = authorsResponse?.items ?? [];
	const pages = authorsResponse?.pages ?? 1;
	const total = authorsResponse?.total ?? 0;

	const toggleGenre = (genreValue: string) => {
		setSelectedGenres((currentGenres) =>
			currentGenres.includes(genreValue)
				? currentGenres.filter((currentGenre) => currentGenre !== genreValue)
				: [...currentGenres, genreValue],
		);
		setPage(1);
	};

	return (
		<Page>
			<Content>
				<Title>Authors</Title>
				<Lead>Public authors and your personal author records.</Lead>

				<FiltersDock>
					<FiltersToggle
						type="button"
						onClick={() => setIsFiltersOpen((current) => !current)}
					>
						<span>Filters</span>
						<KeyboardArrowDownIcon
							aria-hidden="true"
							data-open={isFiltersOpen ? "true" : "false"}
						/>
					</FiltersToggle>
					<FiltersDrawer $isOpen={isFiltersOpen}>
						<AuthorsFilters
							booksRange={booksRange}
							genreMode={genreMode}
							selectedGenres={selectedGenres}
							sort={sort}
							total={total}
							onBooksRangeChange={(value) => {
								setBooksRange(value);
								setPage(1);
							}}
							onClearGenres={() => {
								setSelectedGenres([]);
								setPage(1);
							}}
							onGenreModeChange={(value) => {
								setGenreMode(value);
								setPage(1);
							}}
							onSortChange={(value) => {
								setSort(value);
								setPage(1);
							}}
							onToggleGenre={toggleGenre}
						/>
					</FiltersDrawer>
				</FiltersDock>

				{isLoading ? (
					<AuthorGrid aria-label="Loading authors">
						{Array.from({ length: 8 }, (_, index) => (
							<AuthorSkeleton key={index} />
						))}
					</AuthorGrid>
				) : isError ? (
					<StateMessage>Could not load authors: {error.message}</StateMessage>
				) : authors.length === 0 ? (
					<StateMessage>No authors yet.</StateMessage>
				) : (
					<>
						<AuthorGrid>
							{authors.map((author) => (
								<AuthorCard key={author.id} author={author} />
							))}
						</AuthorGrid>
						{pages > 1 ? (
							<AppPagination count={pages} page={page} onChange={setPage} />
						) : null}
					</>
				)}
			</Content>
		</Page>
	);
};

export default AuthorsPage;

const AuthorSkeleton = () => (
	<SkeletonCard>
		<SkeletonBlock $height="5rem" $radius="50%" $width="5rem" />
		<SkeletonColumn>
			<SkeletonBlock $height="1.45rem" $width="12rem" />
			<SkeletonBlock $height="1rem" $width="8rem" />
			<SkeletonBlock $height="1rem" $width="100%" />
		</SkeletonColumn>
	</SkeletonCard>
);

const Page = styled.div`
	min-height: 100dvh;
	background: ${theme.colors.background};
	padding: clamp(2rem, 4vw, 3.5rem) 0 3rem;
`;

const Content = styled.section`
	width: 70vw;
	margin: 0 auto;
	@media (max-width: ${theme.rubberSize.tablet}) {
		width: 95vw;
		padding-top: 2rem;
	}
`;

const Title = styled.h1`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: clamp(2rem, 3vw, 2.75rem);
	font-weight: 600;
	line-height: 1;
`;

const Lead = styled.p`
	max-width: 40rem;
	margin: 1rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 1.125rem;
	line-height: 1.55;
`;

const AuthorGrid = styled.div`
	display: grid;
	gap: 1rem;
	grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
	margin-top: 2rem;
`;

const FiltersDock = styled.div`
	margin-top: 1rem;
`;

const FiltersToggle = styled.button`
	display: none;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	width: 100%;
	border: 0.0625rem solid rgb(211 202 196 / 0.72);
	border-radius: 0.9rem;
	background: ${theme.colors.surface};
	padding: 0.8rem 1rem;
	color: ${theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	font-weight: 700;

	& svg {
		transition: transform 160ms ease;
	}

	& svg[data-open="true"] {
		transform: rotate(180deg);
	}

	@media (max-width: ${theme.rubberSize.tablet}) {
		display: flex;
	}
`;

const FiltersDrawer = styled.div<{ $isOpen: boolean }>`
	@media (max-width: ${theme.rubberSize.tablet}) {
		display: ${({ $isOpen }) => ($isOpen ? "block" : "none")};
		margin-top: 0.75rem;
	}
`;

const SkeletonCard = styled.div`
	display: grid;
	align-items: center;
	gap: 1rem;
	grid-template-columns: 5rem minmax(0, 1fr);
	border-radius: 1rem;
	background: ${theme.colors.white};
	padding: 1rem;
`;

const SkeletonColumn = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const StateMessage = styled.p`
	margin: 2.5rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 1rem;
	line-height: 1.5;
`;
