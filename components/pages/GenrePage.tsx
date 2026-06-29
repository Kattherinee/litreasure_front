"use client";

import BookmarkIcon from "@mui/icons-material/Bookmark";
import CheckIcon from "@mui/icons-material/Check";
import { useMemo, useState } from "react";
import styled from "styled-components";

import AuthModal, { type IAuthModalMode } from "@/components/pages/AuthModal";
import type { IBookSort } from "@/shared/api/books";
import { useBookCardsQuery } from "@/shared/api/books";
import {
	useDeleteGenreMutation,
	useGenresQuery,
	useSaveGenreMutation,
} from "@/shared/api/genres";
import { useUserGenresQuery } from "@/shared/api/users";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import { BookCard } from "@/shared/ui/BookCard";
import { AppPagination } from "@/shared/ui/AppPagination";
import { BookCardSkeleton } from "@/shared/ui/Skeleton";
import { PageHero } from "@/shared/ui/PageHero";

interface IGenrePageProps {
	slug: string;
	sort?: IBookSort;
}

const GenrePage = ({ slug, sort }: IGenrePageProps) => {
	const [page, setPage] = useState(1);
	const [authModalMode, setAuthModalMode] = useState<IAuthModalMode | null>(
		null,
	);
	const [savedOverride, setSavedOverride] = useState<boolean | null>(null);
	const session = useAuthStore((state) => state.session);
	const userId = session?.user.id;
	const saveGenreMutation = useSaveGenreMutation();
	const deleteGenreMutation = useDeleteGenreMutation();

	const {
		data: booksResponse,
		error,
		isError,
		isLoading,
	} = useBookCardsQuery({ genre: slug, limit: 27, page, sort });
	const { data: allGenres = [] } = useGenresQuery();
	const { data: userGenres = [] } = useUserGenresQuery(userId, {
		enabled: Boolean(userId),
	});

	const books = booksResponse?.items ?? [];
	const pages = booksResponse?.pages ?? 1;
	const title = slug
		.replace(/[-_]+/g, " ")
		.replace(/\b\w/g, (character) => character.toUpperCase());
	const currentGenre = useMemo(
		() => allGenres.find((genre) => genre.slug === slug) ?? null,
		[allGenres, slug],
	);
	const currentGenreId = currentGenre?.id;
	const savedGenreIds = useMemo(
		() => new Set(userGenres.map((genre) => genre.id)),
		[userGenres],
	);
	const isSaved =
		savedOverride ?? (currentGenreId ? savedGenreIds.has(currentGenreId) : false);

	const handleToggleGenre = async () => {
		if (!currentGenreId) {
			return;
		}

		if (!userId) {
			setAuthModalMode("login");
			return;
		}

		try {
			if (isSaved) {
				setSavedOverride(false);
				await deleteGenreMutation.mutateAsync(currentGenreId);
				return;
			}

			setSavedOverride(true);
			await saveGenreMutation.mutateAsync(currentGenreId);
		} catch {
			setSavedOverride(isSaved);
		}
	};
	return (
		<Page>
			<Content>
				<PageHero
					copyWidth="70vw"
					titleSuffix={
						<GenreHeroActions>
							<GenreStatusBadge $isSaved={isSaved}>
								{isSaved ? (
									<>
										<CheckIcon aria-hidden="true" />
										<span>Subscribed</span>
									</>
								) : (
									<>
										<BookmarkIcon aria-hidden="true" />
										<span>Not subscribed</span>
									</>
								)}
							</GenreStatusBadge>
							<GenreActionButton
								$isSaved={isSaved}
								disabled={
									!currentGenreId ||
									saveGenreMutation.isPending ||
									deleteGenreMutation.isPending
								}
								type="button"
								onClick={() => void handleToggleGenre()}
							>
								{saveGenreMutation.isPending || deleteGenreMutation.isPending
									? "Updating..."
									: isSaved
										? "Unsubscribe"
										: "Subscribe"}
							</GenreActionButton>
						</GenreHeroActions>
					}
					text={`A collection of books in the ${title} genre.`}
					title={title}
				/>

				{isLoading ? (
					<BookGrid aria-label="Loading books">
						{Array.from({ length: 12 }, (_, index) => (
							<BookItem key={index}>
								<BookCardSkeleton size="compact" />
							</BookItem>
						))}
					</BookGrid>
				) : isError ? (
					<StateMessage>Could not load books: {error.message}</StateMessage>
				) : books.length === 0 ? (
					<StateMessage>No books in this genre yet.</StateMessage>
				) : (
					<>
						<BookGrid>
							{books.map((book) => (
								<BookItem key={book.id}>
									<BookCard book={book} size="compact" />
								</BookItem>
							))}
						</BookGrid>
						{pages > 1 ? (
							<AppPagination count={pages} page={page} onChange={setPage} />
						) : null}
					</>
				)}
			</Content>
			{authModalMode ? (
				<AuthModal
					mode={authModalMode}
					redirectOnSuccess={false}
					onClose={() => setAuthModalMode(null)}
					onModeChange={setAuthModalMode}
				/>
			) : null}
		</Page>
	);
};

export default GenrePage;

const Page = styled.div`
	min-height: 100dvh;
	background: ${theme.colors.background};
	padding-bottom: clamp(3rem, 5vw, 4.5rem);
`;

const Content = styled.section`
	margin: 0 auto;
	max-width: 70vw;
	@media (max-width: 768px) {
		max-width: 95vw;
	}
`;

const GenreHeroActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: flex-end;
	width: 100%;
	gap: 0.75rem;
`;

const GenreStatusBadge = styled.span<{ $isSaved: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	border: 0.0625rem solid
		${({ $isSaved }) =>
			$isSaved ? "rgb(218 142 91 / 0.46)" : "rgb(211 202 196 / 0.82)"};
	border-radius: 999px;
	background: ${({ $isSaved }) =>
		$isSaved ? "rgb(218 142 91 / 0.12)" : "rgb(242 239 237 / 0.68)"};
	padding: 0.45rem 0.75rem;
	color: ${({ $isSaved }) =>
		$isSaved ? theme.colors.orangeDark : theme.colors.softForeground};
	font-size: 0.88rem;
	font-weight: 600;
	line-height: 1;

	svg {
		width: 1rem;
		height: 1rem;
	}
`;

const GenreActionButton = styled.button<{ $isSaved: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border: 0.0625rem solid
		${({ $isSaved }) =>
			$isSaved ? "rgb(180 58 58 / 0.34)" : theme.colors.orangeLight};
	border-radius: 999px;
	background: ${({ $isSaved }) =>
		$isSaved ? "rgb(180 58 58 / 0.08)" : theme.colors.orangeLight};
	padding: 0.55rem 1rem;
	color: ${({ $isSaved }) =>
		$isSaved ? "#9c2f2f" : theme.colors.invertedText};
	cursor: pointer;
	font: inherit;
	font-size: 0.9rem;
	font-weight: 700;
	line-height: 1.2;

	&:hover,
	&:focus-visible {
		outline: none;
		background: ${({ $isSaved }) =>
			$isSaved ? "rgb(180 58 58 / 0.14)" : theme.colors.bluePrimary};
		border-color: ${({ $isSaved }) =>
			$isSaved ? "rgb(180 58 58 / 0.48)" : theme.colors.bluePrimary};
		color: ${theme.colors.invertedText};
	}

	&:disabled {
		cursor: progress;
		opacity: 0.72;
	}
`;

const StateMessage = styled.p`
	margin: 2.5rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 1rem;
	line-height: 1.5;
`;

const BookGrid = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	justify-content: center;
	align-items: flex-start;
	margin-top: 2rem;
`;

const BookItem = styled.div`
	width: fit-content;
`;
