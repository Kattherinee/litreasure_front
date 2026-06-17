"use client";

import BookmarkIcon from "@mui/icons-material/Bookmark";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styled from "styled-components";

import AuthModal, { type IAuthModalMode } from "@/components/pages/AuthModal";
import type { IBook } from "@/shared/api/books";
import {
	useSaveSeriesMutation,
	useUnsaveSeriesMutation,
} from "@/shared/api/series";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import BookCarousel from "@/shared/ui/BookCarousel/BookCarousel";
import { PlusIcon } from "@/shared/ui/PlusIcon";

interface IBookSeriesBlockProps {
	book: IBook;
}

const BookSeriesBlock = ({ book }: IBookSeriesBlockProps) => {
	const router = useRouter();
	const [authModalMode, setAuthModalMode] = useState<IAuthModalMode | null>(
		null,
	);
	const [seriesSavedOverride, setSeriesSavedOverride] = useState<
		boolean | null
	>(null);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const saveSeriesMutation = useSaveSeriesMutation();
	const unsaveSeriesMutation = useUnsaveSeriesMutation();
	const seriesBooks = book.series?.books ?? [];
	const seriesId = book.series?.id ?? book.series?.seriesId;
	const isSeriesSaved = seriesSavedOverride ?? book.series?.isSaved ?? false;
	const isSeriesSavePending =
		saveSeriesMutation.isPending || unsaveSeriesMutation.isPending;
	const alternativeEditions = seriesBooks.filter(
		(seriesBook) =>
			seriesBook.relationType === "collection" ||
			seriesBook.relationType === "omnibus" ||
			seriesBook.orderInSeries === 0,
	);
	const mainSeriesBooks = seriesBooks.filter(
		(seriesBook) => !alternativeEditions.includes(seriesBook),
	);
	const sortedMainSeriesBooks = [...mainSeriesBooks].sort(
		(firstBook, secondBook) =>
			(firstBook.orderInSeries ?? 999) - (secondBook.orderInSeries ?? 999),
	);
	const sortedAlternativeEditions = [...alternativeEditions].sort(
		(firstBook, secondBook) =>
			(firstBook.seriesLabel ?? firstBook.title).localeCompare(
				secondBook.seriesLabel ?? secondBook.title,
			),
	);

	if (
		!book.series ||
		(sortedMainSeriesBooks.length === 0 &&
			sortedAlternativeEditions.length === 0)
	) {
		return null;
	}

	const handleToggleSeriesSave = async () => {
		if (!seriesId) {
			return;
		}

		if (!isAuthenticated) {
			setAuthModalMode("login");
			return;
		}

		const wasSaved = isSeriesSaved;
		setSeriesSavedOverride(!wasSaved);

		try {
			if (wasSaved) {
				await unsaveSeriesMutation.mutateAsync(seriesId);
			} else {
				await saveSeriesMutation.mutateAsync(seriesId);
			}
		} catch {
			setSeriesSavedOverride(wasSaved);
		}
	};

	return (
		<SeriesSection>
			{sortedMainSeriesBooks.length > 0 ? (
				<SeriesGroup
					role="link"
					tabIndex={0}
					onClick={(event) => {
						if (event.target !== event.currentTarget) {
							return;
						}

						if (seriesId) {
							router.push(`/series/${seriesId}`);
						}
					}}
					onKeyDown={(event) => {
						if (event.target !== event.currentTarget) {
							return;
						}

						if (!seriesId) {
							return;
						}

						if (event.key === "Enter" || event.key === " ") {
							event.preventDefault();
							router.push(`/series/${seriesId}`);
						}
					}}
				>
					<SeriesHeader>
						<Title>{book.series.title ?? "Series books"}</Title>
						{seriesId ? (
							isSeriesSaved ? (
								<SavedSeriesButton
									aria-label="Remove series from saved"
									disabled={isSeriesSavePending}
									title="Remove from saved"
									type="button"
									onClick={(event) => {
										event.stopPropagation();
										void handleToggleSeriesSave();
									}}
								>
									<BookmarkIcon aria-hidden="true" />
								</SavedSeriesButton>
							) : (
								<SavedSeriesButton
									disabled={isSeriesSavePending}
									type="button"
									onClick={(event) => {
										event.stopPropagation();
										void handleToggleSeriesSave();
									}}
								>
									{isSeriesSavePending ? (
										"Saving..."
									) : (
										<PlusIcon aria-hidden="true" />
									)}
								</SavedSeriesButton>
							)
						) : null}
					</SeriesHeader>
					<BookCarousel
						activeBookId={book.id}
						bleed={false}
						books={sortedMainSeriesBooks}
						size="compact"
					/>
				</SeriesGroup>
			) : null}

			{sortedAlternativeEditions.length > 0 ? (
				<SeriesGroup>
					<Subtitle>Alternative editions</Subtitle>
					<BookCarousel
						activeBookId={book.id}
						bleed={false}
						books={sortedAlternativeEditions}
						size="compact"
					/>
				</SeriesGroup>
			) : null}
			{authModalMode ? (
				<AuthModal
					mode={authModalMode}
					redirectOnSuccess={false}
					onClose={() => setAuthModalMode(null)}
					onModeChange={setAuthModalMode}
				/>
			) : null}
		</SeriesSection>
	);
};

export default BookSeriesBlock;

const SeriesSection = styled.section`
	display: flex;
	flex-direction: column;
	gap: 2rem;
	margin-top: 1.6rem;
`;

const SeriesGroup = styled.div`
	min-width: 0;
	cursor: pointer;

	&:focus-visible {
		outline: 0.16rem solid ${theme.colors.orangeLight};
		outline-offset: 0.22rem;
	}
`;

const SeriesHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 1.1rem;
`;

const Title = styled.h2`
	margin: 0;
	color: ${theme.colors.black};
	font-family: ${theme.fonts.serif};
	font-size: 1.75rem;
	font-weight: 500;
	line-height: 1.2;
	@media (max-width: 768px) {
		font-size: 1.5rem;
	}
`;

const SavedSeriesButton = styled.button`
	display: inline-grid;
	flex: 0 0 auto;
	width: 2.5rem;
	height: 2.5rem;
	place-items: center;
	border: 0;
	border-radius: 50%;
	background: ${theme.colors.white};
	color: ${theme.colors.orangeLight};
	cursor: pointer;
	transition:
		color 180ms ease,
		transform 180ms ease;

	svg {
		width: 1.45rem;
		height: 1.45rem;
	}

	&:hover,
	&:focus-visible {
		color: ${theme.colors.orangeDark};
		outline: none;
		transform: translateY(-0.0625rem);
	}

	&:disabled {
		cursor: progress;
		opacity: 0.72;
		transform: none;
	}
`;

const Subtitle = styled.h3`
	margin: 0 0 1rem;
	color: ${theme.colors.black};
	font-family: ${theme.fonts.serif};
	font-size: 1.35rem;
	font-weight: 500;
	line-height: 1.2;
`;
