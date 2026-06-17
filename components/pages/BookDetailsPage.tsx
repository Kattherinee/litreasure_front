"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";

import type { IBook } from "@/shared/api/books";
import { useBookQuery } from "@/shared/api/books";
import { useRecomendationsByBookQuery } from "@/shared/api/recomendations/recomendations.hooks";
import { theme } from "@/shared/theme";
import BookCarousel from "@/shared/ui/BookCarousel/BookCarousel";
import { SkeletonBlock } from "@/shared/ui/Skeleton";
import { BookCardSkeleton } from "@/shared/ui/Skeleton";

import BookDetailContent from "./book-details/BookDetailContent";

interface ICarouselControls {
	canScrollNext: boolean;
	canScrollPrev: boolean;
	scrollNext: () => void;
	scrollPrev: () => void;
}

interface IBookDetailsPageProps {
	slug: string;
}

const BookDetailsPage = ({ slug }: IBookDetailsPageProps) => {
	const { data: book, error, isError, isLoading } = useBookQuery(slug);

	if (isLoading) {
		return (
			<Page>
				<BookDetailSkeleton aria-label="Loading book">
					<SkeletonBackdrop />
					<SkeletonGrid>
						<SkeletonAside>
							<SkeletonBlock $height="21rem" $radius="0.5rem" $width="14rem" />
							<SkeletonBlock $height="5.5rem" $radius="0.7rem" $width="14rem" />
						</SkeletonAside>
						<SkeletonMain>
							<SkeletonBlock
								$height="2rem"
								$radius="62.4375rem"
								$width="14rem"
							/>
							<SkeletonBlock
								$height="3.4rem"
								$radius="0.7rem"
								$width="min(100%, 34rem)"
							/>
							<SkeletonBlock
								$height="1.35rem"
								$radius="0.5rem"
								$width="12rem"
							/>
							<SkeletonActions>
								<SkeletonBlock
									$height="2.65rem"
									$radius="62.4375rem"
									$width="10rem"
								/>
								<SkeletonBlock
									$height="2.65rem"
									$radius="50%"
									$width="2.65rem"
								/>
								<SkeletonBlock
									$height="2.65rem"
									$radius="50%"
									$width="2.65rem"
								/>
							</SkeletonActions>
							<SkeletonTabs>
								<SkeletonBlock
									$height="2.4rem"
									$radius="62.4375rem"
									$width="9rem"
								/>
								<SkeletonBlock
									$height="2.4rem"
									$radius="62.4375rem"
									$width="8rem"
								/>
								<SkeletonBlock
									$height="2.4rem"
									$radius="62.4375rem"
									$width="7rem"
								/>
							</SkeletonTabs>
							<SkeletonBlock $height="1rem" $width="100%" />
							<SkeletonBlock $height="1rem" $width="92%" />
							<SkeletonBlock $height="1rem" $width="78%" />
						</SkeletonMain>
					</SkeletonGrid>
				</BookDetailSkeleton>
			</Page>
		);
	}

	if (isError) {
		return (
			<Page>
				<StateMessage>Could not load book: {error.message}</StateMessage>
			</Page>
		);
	}

	if (!book) {
		return (
			<Page>
				<StateMessage>Book not found.</StateMessage>
			</Page>
		);
	}

	return <BookDetailsContent book={book} />;
};

const BookDetailsContent = ({ book }: { book: IBook }) => {
	const [carouselControls, setCarouselControls] =
		useState<ICarouselControls | null>(null);
	const {
		data: relatedBooks = [],
		error: relatedBooksError,
		isError: isRelatedBooksError,
		isLoading: isRelatedBooksLoading,
	} = useRecomendationsByBookQuery(
		{ bookId: book.id, limit: 15 },
		{ enabled: Boolean(book.id) },
	);
	const carouselBooks = useMemo(
		() =>
			relatedBooks.map((relatedBook) => ({
				author: relatedBook.author,
				authors: relatedBook.authors,
				coverUrl: relatedBook.coverUrl,
				id: relatedBook.id,
				isTracked: relatedBook.isTracked,
				myStatus: relatedBook.myStatus,
				orderInSeries: relatedBook.orderInSeries,
				relationType: relatedBook.relationType,
				seriesBookCount: relatedBook.bookCountInSeries,
				seriesLabel: relatedBook.seriesLabel,
				title: relatedBook.title,
			})),
		[relatedBooks],
	);
	const hasCarouselControls = Boolean(
		carouselControls?.canScrollPrev || carouselControls?.canScrollNext,
	);

	return (
		<Page>
			<BookDetailContent book={book} />
			<RelatedSection>
				<Section>
					<SectionHeader>
						<SectionTitle>You may also like</SectionTitle>
						<Controls $isVisible={hasCarouselControls}>
							<ControlButton
								aria-label="Previous books"
								disabled={!carouselControls?.canScrollPrev}
								type="button"
								onClick={carouselControls?.scrollPrev}
							>
								‹
							</ControlButton>
							<ControlButton
								aria-label="Next books"
								disabled={!carouselControls?.canScrollNext}
								type="button"
								onClick={carouselControls?.scrollNext}
							>
								›
							</ControlButton>
						</Controls>
					</SectionHeader>

					{isRelatedBooksLoading ? (
						<SkeletonCarousel aria-label="Loading recommendations">
							{Array.from({ length: 8 }, (_, index) => (
								<BookCardSkeleton key={`skeleton-${index}`} />
							))}
						</SkeletonCarousel>
					) : isRelatedBooksError ? (
						<StateMessage>
							Could not load recommendations: {relatedBooksError.message}
						</StateMessage>
					) : carouselBooks.length > 0 ? (
						<BookCarousel
							books={carouselBooks}
							size="compact"
							onControlsChange={(controls) => {
								setCarouselControls(
									(currentControls: ICarouselControls | null) => {
										if (
											currentControls?.canScrollNext ===
												controls.canScrollNext &&
											currentControls?.canScrollPrev ===
												controls.canScrollPrev &&
											currentControls?.scrollNext === controls.scrollNext &&
											currentControls?.scrollPrev === controls.scrollPrev
										) {
											return currentControls;
										}

										return controls;
									},
								);
							}}
						/>
					) : (
						<StateMessage>No recommendations yet.</StateMessage>
					)}
				</Section>
			</RelatedSection>
		</Page>
	);
};

export default BookDetailsPage;

const Page = styled.div`
	--book-detail-width: 76.75rem;

	min-height: 100dvh;
	overflow-x: hidden;
	padding-bottom: 7rem;
	@media (max-width: 47.9375rem) {
		padding-bottom: 2rem;
	}
`;

const StateMessage = styled.p`
	width: min(calc(100% - 3rem), var(--book-detail-width));
	margin: 0 auto;
	padding-top: 5rem;
	color: ${theme.colors.softForeground};
	font-size: 1rem;
	line-height: 1.5;
`;

const RelatedSection = styled.section``;

const Section = styled.section`
	width: min(
		calc(100% - (${theme.layout.contentGutter} * 2)),
		${theme.layout.contentMaxWidth}
	);
	margin: 0 auto;
	height: fit-content;
`;

const SectionHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1.25rem;
	margin-bottom: 0.75rem;
`;

const SectionTitle = styled.h2`
	margin: 0;
	color: ${theme.colors.textPrimary};
	font-family: ${theme.fonts.serif};
	font-size: 2rem;
	font-weight: 600;
	line-height: 1.1;
	@media (max-width: 47.9375rem) {
		font-size: 1.2rem;
	}
`;

const Controls = styled.div<{ $isVisible: boolean }>`
	display: ${({ $isVisible }: { $isVisible: boolean }) =>
		$isVisible ? "flex" : "none"};
	flex: 0 0 auto;
	gap: 0.625rem;
`;

const ControlButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.875rem;
	height: 1.875rem;
	border: 0.0625rem solid ${theme.colors.orangeDark};
	border-radius: 62.4375rem;
	background: ${theme.colors.transparent};
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font-family: ${theme.fonts.serif};
	font-size: 2rem;
	line-height: 1;
	transition:
		background 180ms ease,
		border-color 180ms ease,
		color 180ms ease,
		opacity 180ms ease,
		transform 180ms ease;

	&:not(:disabled):hover {
		background: ${theme.colors.orangeLight};
		border-color: ${theme.colors.orangeLight};
		color: ${theme.colors.invertedText};
		transform: translateY(-0.0625rem);
	}

	&:disabled {
		cursor: default;
		opacity: 0.38;
	}
`;

const SkeletonCarousel = styled.div`
	display: flex;
	gap: clamp(0.775rem, 1vw, 1.25rem);
	overflow: hidden;
`;

const BookDetailSkeleton = styled.section`
	--detail-backdrop-height: max(18rem, calc(100vw * 356 / 1979));
	--detail-cover-offset: 5rem;

	position: relative;
	overflow: hidden;
	padding-bottom: 2rem;
`;

const SkeletonBackdrop = styled.div`
	position: absolute;
	inset: 0 0 auto;
	height: var(--detail-backdrop-height);
	background:
		linear-gradient(180deg, rgb(35 61 77 / 0.68), rgb(35 61 77 / 0.12)),
		${theme.colors.bluePrimary};

	&::after {
		position: absolute;
		right: 0;
		bottom: -0.6rem;
		left: 0;
		height: 14rem;
		background: linear-gradient(
			180deg,
			rgb(232 226 222 / 0) 0%,
			rgb(232 226 222 / 0.6) 74%,
			${theme.colors.background} 100%
		);
		content: "";
	}
`;

const SkeletonGrid = styled.div`
	position: relative;
	z-index: 1;
	display: grid;
	width: min(calc(100% - 3rem), var(--book-detail-width));
	margin: 0 auto;
	column-gap: 3.5rem;
	grid-template-columns: auto minmax(0, 1fr);

	@media (max-width: 47.9375rem) {
		display: block;
		padding-top: 2rem;
	}
`;

const SkeletonAside = styled.div`
	display: flex;
	width: fit-content;
	flex-direction: column;
	gap: 1rem;
	padding-top: var(--detail-cover-offset);

	@media (max-width: 47.9375rem) {
		margin: 0 auto;
		padding-top: 0;
	}
`;

const SkeletonMain = styled.div`
	display: flex;
	min-width: 0;
	height: var(--detail-backdrop-height);
	flex-direction: column;
	gap: 1rem;
	padding-top: var(--detail-cover-offset);

	@media (max-width: 47.9375rem) {
		height: auto;
		padding-top: 2rem;
	}
`;

const SkeletonActions = styled.div`
	display: flex;
	gap: 1rem;
	padding-top: 0.4rem;
`;

const SkeletonTabs = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	margin-top: 3rem;
`;
