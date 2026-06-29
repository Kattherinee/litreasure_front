import Link from "next/link";
import { useState } from "react";
import styled from "styled-components";

import type { ISearchBook } from "@/shared/api/search";
import {
	type IUserBookStatus,
	useUpdateBookTrackingMutation,
} from "@/shared/api/user-books";
import { BookLibraryAction } from "@/shared/ui/BookLibraryAction";

import {
	ResultAuthor,
	ResultCover,
	ResultCoverLink,
	ResultItem,
	ResultLink,
	ResultMain,
	ResultMeta,
	ResultDescription,
	ResultRecommendationAuthor,
	ResultSeries,
	ResultTitle,
} from "./SearchResultCard.styles";
import {
	getSupplementalSearchMatch,
	HighlightedText,
	lineHasMatch,
	SearchMatchBadge,
} from "./SearchResultCard.utils";

interface IBookResultCardProps {
	book: ISearchBook;
	closeSearch: () => void;
	isRecommendation?: boolean;
	query: string;
	saveRecentSearch: () => void;
}

export const BookResultCard = ({
	book,
	closeSearch,
	isRecommendation = false,
	query,
	saveRecentSearch,
}: IBookResultCardProps) => {
	const updateTrackingMutation = useUpdateBookTrackingMutation();
	const [currentStatus, setCurrentStatus] = useState<IUserBookStatus | null>(
		book.myStatus ?? null,
	);
	const seriesProgress =
		typeof book.orderInSeries === "number" && book.orderInSeries > 0
			? typeof book.bookCountInSeries === "number" &&
				book.bookCountInSeries > 0
				? `${book.orderInSeries}/${book.bookCountInSeries}`
				: String(book.orderInSeries)
			: "";
	const seriesLine = book.seriesTitle
		? seriesProgress
			? `${seriesProgress} of ${book.seriesTitle}`
			: book.seriesTitle
		: seriesProgress || null;
	const titleMatches = lineHasMatch(book.title, book.searchMatches, query, [
		"book",
		"title",
	]);
	const authorMatches = lineHasMatch(book.author, book.searchMatches, query, [
		"author",
		"authors",
	]);
	const seriesMatches = seriesLine
		? lineHasMatch(seriesLine, book.searchMatches, query, [
				"series",
				"seriesTitle",
			])
		: false;
	const supplementalMatch = getSupplementalSearchMatch(
		book.searchMatches,
		query,
		{
			author: authorMatches,
			series: seriesMatches,
			title: titleMatches,
		},
	);
	const handleOpenResult = () => {
		saveRecentSearch();
		closeSearch();
	};
	const handleSaveBook = async (status: IUserBookStatus) => {
		if (updateTrackingMutation.isPending) return;

		try {
			await updateTrackingMutation.mutateAsync({
				bookId: book.id,
				payload: {
					isRereading: status === "rereading",
					readCount: 0,
					status,
				},
			});
			setCurrentStatus(status);
		} catch {
			setCurrentStatus(null);
		}
	};

	return (
		<ResultItem>
			<ResultMain $isRecommendation={isRecommendation}>
				<ResultCoverLink
					$isRecommendation={isRecommendation}
					prefetch={false}
					href={`/books/${book.id}`}
					onClick={handleOpenResult}
				>
					<ResultCover
						$isRecommendation={isRecommendation}
						alt=""
						src={book.coverUrl ?? "/images/book-placeholder.svg"}
					/>
				</ResultCoverLink>
				<ResultMeta>
					<ResultLink
						prefetch={false}
						href={`/books/${book.id}`}
						onClick={handleOpenResult}
					>
						{seriesLine ? (
							<ResultSeries>
								<HighlightedText query={query} text={seriesLine} />
							</ResultSeries>
						) : null}
						<ResultTitle>
							<HighlightedText query={query} text={book.title} />
						</ResultTitle>
					</ResultLink>
					{isRecommendation ? (
						<>
							<ResultRecommendationAuthor>
								<StyledResultLink
									prefetch={false}
									href={`/authors/${book.authorId}`}
									onClick={handleOpenResult}
								>
									<HighlightedText query={query} text={book.author} />
								</StyledResultLink>
							</ResultRecommendationAuthor>
							{book.description ? (
								<ResultDescription>
									<HighlightedText query={query} text={book.description} />
								</ResultDescription>
							) : null}
						</>
					) : (
						<>
							{book.description ? (
								<ResultDescription>
									<HighlightedText query={query} text={book.description} />
								</ResultDescription>
							) : null}
							<ResultAuthor>
								<StyledResultLink
									prefetch={false}
									href={`/authors/${book.authorId}`}
									onClick={handleOpenResult}
								>
									<HighlightedText query={query} text={book.author} />
								</StyledResultLink>
							</ResultAuthor>
						</>
					)}
					<SearchMatchBadge match={supplementalMatch} query={query} />
				</ResultMeta>
			</ResultMain>
			<BookLibraryAction
				currentStatus={currentStatus}
				disabled={updateTrackingMutation.isPending}
				size="small"
				onSaveStatus={handleSaveBook}
			/>
		</ResultItem>
	);
};
export const StyledResultLink = styled(Link)`
	text-decoration: none;
	color: inherit;

	&:hover {
		color: inherit;
	}
`;
