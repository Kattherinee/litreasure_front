"use client";

import { useState } from "react";
import styled from "styled-components";

import type { IBookSort } from "@/shared/api/books";
import { useBookCardsQuery } from "@/shared/api/books";
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
	const {
		data: booksResponse,
		error,
		isError,
		isLoading,
	} = useBookCardsQuery({ genre: slug, limit: 27, page, sort });
	const books = booksResponse?.items ?? [];
	const pages = booksResponse?.pages ?? 1;
	const title = slug
		.replace(/[-_]+/g, " ")
		.replace(/\b\w/g, (character) => character.toUpperCase());

	return (
		<Page>
			<Content>
				<PageHero
					copyWidth="70vw"
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
