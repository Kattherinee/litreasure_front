"use client";

import { useState } from "react";
import styled from "styled-components";

import type { IBookSort } from "@/shared/api/books";
import { useBookCardsQuery } from "@/shared/api/books";
import { useRecomendationsForYouBooksQuery } from "@/shared/api/recomendations/recomendations.hooks";
import { theme } from "@/shared/theme";
import { Button } from "@/shared/ui/Button";
import BookCarousel from "@/shared/ui/BookCarousel/BookCarousel";
import { BookCardSkeleton } from "@/shared/ui/Skeleton";
import { useLazyLoadTrigger } from "@/shared/utils/useLazyLoadTrigger";

interface ICarouselControls {
	canScrollNext: boolean;
	canScrollPrev: boolean;
	scrollNext: () => void;
	scrollPrev: () => void;
}

const finePointer = "@media (hover: hover) and (pointer: fine)";

interface IBookSliderSectionProps {
	genre?: string;
	genreIds?: string[];
	lazy?: boolean;
	lazyRootMargin?: string;
	limit?: number;
	page?: number;
	source?: "books" | "for-you";
	sort?: IBookSort;
	title: string;
}

const getSectionHref = ({
	genre,
	source,
	sort,
}: Pick<IBookSliderSectionProps, "genre" | "source" | "sort">) => {
	if (source === "for-you") {
		return "/catalog/for-you";
	}

	if (genre) {
		const query = sort ? `?sort=${sort}` : "";

		return `/genres/${genre}${query}`;
	}

	if (sort) {
		return `/catalog/${sort}`;
	}

	return "/catalog/newest";
};

const BookSliderSection = ({
	sort,
	genre,
	genreIds,
	lazy = false,
	lazyRootMargin = "0px",
	limit,
	page,
	source = "books",
	title,
}: IBookSliderSectionProps) => {
	const [carouselControls, setCarouselControls] =
		useState<ICarouselControls | null>(null);
	const { containerRef, isTriggered } = useLazyLoadTrigger(
		lazy,
		lazyRootMargin,
	);
	const queryParams = { genre, genreIds, limit, page, sort };
	const {
		data: booksResponse,
		error,
		isError,
		isLoading,
	} = useBookCardsQuery(queryParams, {
		enabled: source === "books" && isTriggered,
	});
	const {
		data: forYouBooksResponse,
		error: forYouError,
		isError: isForYouError,
		isLoading: isForYouLoading,
	} = useRecomendationsForYouBooksQuery(queryParams, {
		enabled: source === "for-you" && isTriggered,
	});
	const response = source === "for-you" ? forYouBooksResponse : booksResponse;
	const currentError = source === "for-you" ? forYouError : error;
	const currentIsError = source === "for-you" ? isForYouError : isError;
	const currentIsLoading = source === "for-you" ? isForYouLoading : isLoading;
	const books = response?.items ?? [];
	const sectionHref = getSectionHref({ genre, source, sort });
	const hasCarouselControls = Boolean(
		carouselControls?.canScrollPrev || carouselControls?.canScrollNext,
	);

	return (
		<Section ref={containerRef}>
			<SectionHeader>
				<SectionHeading>
					<SectionTitle>{title}</SectionTitle>
					<ShowMoreButton buttonType="oxygenPill" href={sectionHref}>
						See all
					</ShowMoreButton>
				</SectionHeading>

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

			{!isTriggered || currentIsLoading ? (
				<SkeletonCarousel aria-label="Loading books">
					{Array.from({ length: 8 }, (_, index) => (
						<BookCardSkeleton key={index} />
					))}
				</SkeletonCarousel>
			) : currentIsError ? (
				<StateMessage>
					Failed to load books: {currentError?.message ?? "Unknown error"}
				</StateMessage>
			) : books.length === 0 ? (
				<StateMessage>No books to display yet.</StateMessage>
			) : (
				<BookCarousel
					books={books}
					endSlideHref={sectionHref}
					endSlideLabel="See all"
					size="compact"
					onControlsChange={(controls) => {
						setCarouselControls((currentControls) => {
							if (
								currentControls?.canScrollNext === controls.canScrollNext &&
								currentControls?.canScrollPrev === controls.canScrollPrev &&
								currentControls?.scrollNext === controls.scrollNext &&
								currentControls?.scrollPrev === controls.scrollPrev
							) {
								return currentControls;
							}

							return controls;
						});
					}}
				/>
			)}
		</Section>
	);
};

export default BookSliderSection;

const Section = styled.section`
	width: min(
		calc(100% - (${theme.layout.contentGutter} * 2)),
		${theme.layout.contentMaxWidth}
	);
	margin: 3rem auto 0;
	height: fit-content;
	@media (max-width: ${theme.rubberSize.tablet}) {
		margin: 2rem auto 0;
	}
`;

const SectionHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1.25rem;
	margin-bottom: 1.75rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
		margin-bottom: 0.9rem;
	}
`;

const SectionHeading = styled.div`
	display: flex;
	align-items: center;
	gap: 1.25rem;
	min-width: 0;

	@media (max-width: ${theme.rubberSize.tablet}) {
		width: 100%;
	}
`;

const SectionTitle = styled.h2`
	margin: 0;
	color: ${theme.colors.textPrimary};
	font-family: ${theme.fonts.serif};
	font-size: 2rem;
	font-weight: 600;
	line-height: 1.1;

	@media (max-width: ${theme.rubberSize.tablet}) {
		font-size: 1.5rem;
	}
`;

const ShowMoreButton = styled(Button)`
	&& {
		flex: 0 0 auto;
		padding: 0.25rem 0.85rem;
		font-size: 0.8125rem;
	}
`;

const Controls = styled.div<{ $isVisible: boolean }>`
	display: ${({ $isVisible }) => ($isVisible ? "flex" : "none")};
	flex: 0 0 auto;
	gap: 0.625rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		display: none;
	}
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

	${finePointer} {
		&:not(:disabled):hover {
			background: ${theme.colors.orangeLight};
			border-color: ${theme.colors.orangeLight};
			color: ${theme.colors.invertedText};
			transform: translateY(-0.0625rem);
		}
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

const StateMessage = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 1rem;
	line-height: 1.5;
`;
