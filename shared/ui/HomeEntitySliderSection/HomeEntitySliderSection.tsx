"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import type {
	IAuthorsListParams,
	IAuthorPreview,
	IAuthorsSort,
} from "@/shared/api/authors";
import { useAuthorsQuery } from "@/shared/api/authors";
import type {
	ICollectionPreview,
	ICollectionSort,
	ICollectionsListParams,
} from "@/shared/api/collections";
import { usePublicCollectionsQuery } from "@/shared/api/collections";
import type { IHomeSectionQuery } from "@/shared/api/recomendations";
import type {
	ISeriesListParams,
	ISeriesPreview,
	ISeriesSort,
} from "@/shared/api/series";
import { usePublicSeriesQuery } from "@/shared/api/series";
import { theme } from "@/shared/theme";
import { AuthorAvatar } from "@/shared/ui/AuthorAvatar";
import { Button } from "@/shared/ui/Button";
import {
	CarouselContainer,
	CarouselControlButton,
	CarouselControls,
	CarouselSlide,
	CarouselStateMessage,
	CarouselViewport,
} from "@/shared/ui/Carousel/Carousel.styles";
import {
	type IHorizontalCarouselControls,
	useHorizontalCarousel,
} from "@/shared/ui/Carousel/useHorizontalCarousel";
import { useLazyLoadTrigger } from "@/shared/utils/useLazyLoadTrigger";
import { SeriesSliderCard } from "./SeriesSliderCard";

interface IHomeEntitySliderSectionProps {
	entity: "authors" | "collections" | "series";
	lazy?: boolean;
	query: IHomeSectionQuery;
	title: string;
}

const HomeEntitySliderSection = ({
	entity,
	lazy = false,
	query,
	title,
}: IHomeEntitySliderSectionProps) => {
	const { containerRef, isTriggered } = useLazyLoadTrigger(lazy);
	const authorParams: IAuthorsListParams = useMemo(
		() => ({
			genres: query.genres ?? query.genreIds,
			limit: query.limit,
			page: query.page,
			sort: query.sort as IAuthorsSort | undefined,
		}),
		[query.genres, query.genreIds, query.limit, query.page, query.sort],
	);
	const collectionParams: ICollectionsListParams = useMemo(
		() => ({
			genres: query.genres ?? query.genreIds,
			limit: query.limit,
			page: query.page,
			sort: query.sort as ICollectionSort | undefined,
		}),
		[query.genres, query.genreIds, query.limit, query.page, query.sort],
	);
	const seriesParams: ISeriesListParams = useMemo(
		() => ({
			genre: query.genre,
			genreIds: query.genreIds,
			limit: query.limit,
			page: query.page,
			sort: query.sort as ISeriesSort | undefined,
		}),
		[query.genre, query.genreIds, query.limit, query.page, query.sort],
	);

	const {
		data: authorsResponse,
		error: authorsError,
		isError: isAuthorsError,
		isLoading: isAuthorsLoading,
	} = useAuthorsQuery(authorParams, {
		enabled: entity === "authors" && isTriggered,
	});
	const {
		data: collectionsResponse,
		error: collectionsError,
		isError: isCollectionsError,
		isLoading: isCollectionsLoading,
	} = usePublicCollectionsQuery(collectionParams, {
		enabled: entity === "collections" && isTriggered,
	});
	const {
		data: seriesResponse,
		error: seriesError,
		isError: isSeriesError,
		isLoading: isSeriesLoading,
	} = usePublicSeriesQuery(seriesParams, {
		enabled: entity === "series" && isTriggered,
	});

	const items =
		entity === "authors"
			? (authorsResponse?.items ?? [])
			: entity === "collections"
				? (collectionsResponse?.items ?? [])
				: (seriesResponse?.items ?? []);
	const isLoading =
		entity === "authors"
			? isAuthorsLoading
			: entity === "collections"
				? isCollectionsLoading
				: isSeriesLoading;
	const isError =
		entity === "authors"
			? isAuthorsError
			: entity === "collections"
				? isCollectionsError
				: isSeriesError;
	const errorMessage =
		entity === "authors"
			? authorsError?.message
			: entity === "collections"
				? collectionsError?.message
				: seriesError?.message;
	const sectionHref =
		entity === "authors"
			? "/authors"
			: entity === "collections"
				? "/collections"
				: "/series";
	const [carouselControls, setCarouselControls] =
		useState<IHorizontalCarouselControls | null>(null);

	const handleControlsChange = (controls: IHorizontalCarouselControls) => {
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
	};

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
				<CarouselControls $isVisible={hasCarouselControls}>
					<CarouselControlButton
						aria-label="Previous items"
						disabled={!carouselControls?.canScrollPrev}
						type="button"
						onClick={carouselControls?.scrollPrev}
					>
						{"\u2039"}
					</CarouselControlButton>
					<CarouselControlButton
						aria-label="Next items"
						disabled={!carouselControls?.canScrollNext}
						type="button"
						onClick={carouselControls?.scrollNext}
					>
						{"\u203A"}
					</CarouselControlButton>
				</CarouselControls>
			</SectionHeader>
			{!isTriggered || isLoading ? (
				<StateMessage>Loading...</StateMessage>
			) : isError ? (
				<StateMessage>
					Failed to load data: {errorMessage ?? "Unknown error"}
				</StateMessage>
			) : items.length === 0 ? (
				<StateMessage>No data to display yet.</StateMessage>
			) : entity === "authors" ? (
				<AuthorCarousel
					authors={items as IAuthorPreview[]}
					onControlsChange={handleControlsChange}
				/>
			) : entity === "collections" ? (
				<CollectionCarousel
					collections={items as ICollectionPreview[]}
					onControlsChange={handleControlsChange}
				/>
			) : (
				<SeriesCarousel
					onControlsChange={handleControlsChange}
					series={items as ISeriesPreview[]}
				/>
			)}
		</Section>
	);
};

const AuthorCarousel = ({
	authors,
	onControlsChange,
}: {
	authors: IAuthorPreview[];
	onControlsChange: (controls: IHorizontalCarouselControls) => void;
}) => {
	const {
		canScrollNext,
		canScrollPrev,
		setContainerRef,
		setViewportRef,
		scrollNext,
		scrollPrev,
	} = useHorizontalCarousel();

	useEffect(() => {
		onControlsChange({ canScrollNext, canScrollPrev, scrollNext, scrollPrev });
	}, [canScrollNext, canScrollPrev, onControlsChange, scrollNext, scrollPrev]);

	return (
		<CarouselViewport ref={setViewportRef}>
			<CarouselContainer ref={setContainerRef}>
				{authors.map((author) => (
					<CarouselSlide key={author.id}>
						<AuthorTreasureCard href={`/authors/${author.id}`}>
							<AuthorAvatar
								name={author.name}
								photoUrl={author.photoUrl}
								size="3.9rem"
							/>
							<TreasureResourceMeta>
								<TreasureResourceTitle>{author.name}</TreasureResourceTitle>
								<TreasureResourceText>
									{author.bookCount} books
								</TreasureResourceText>
							</TreasureResourceMeta>
						</AuthorTreasureCard>
					</CarouselSlide>
				))}
			</CarouselContainer>
		</CarouselViewport>
	);
};

const CollectionCarousel = ({
	collections,
	onControlsChange,
}: {
	collections: ICollectionPreview[];
	onControlsChange: (controls: IHorizontalCarouselControls) => void;
}) => {
	const {
		canScrollNext,
		canScrollPrev,
		setContainerRef,
		setViewportRef,
		scrollNext,
		scrollPrev,
	} = useHorizontalCarousel();

	useEffect(() => {
		onControlsChange({ canScrollNext, canScrollPrev, scrollNext, scrollPrev });
	}, [canScrollNext, canScrollPrev, onControlsChange, scrollNext, scrollPrev]);

	return (
		<CarouselViewport ref={setViewportRef}>
			<CarouselContainer ref={setContainerRef}>
				{collections.map((collection) => (
					<CarouselSlide key={collection.id}>
						<CollectionTreasureCard href={`/collections/${collection.id}`}>
							<CollectionCover
								$coverUrl={collection.coverUrl}
								aria-hidden="true"
							/>
							<TreasureResourceMeta>
								<TreasureResourceTitle>
									{collection.title}
								</TreasureResourceTitle>
								<TreasureResourceText>
									{collection.bookCount} books
								</TreasureResourceText>
							</TreasureResourceMeta>
						</CollectionTreasureCard>
					</CarouselSlide>
				))}
			</CarouselContainer>
		</CarouselViewport>
	);
};

const SeriesCarousel = ({
	series,
	onControlsChange,
}: {
	series: ISeriesPreview[];
	onControlsChange: (controls: IHorizontalCarouselControls) => void;
}) => {
	const {
		canScrollNext,
		canScrollPrev,
		setContainerRef,
		setViewportRef,
		scrollNext,
		scrollPrev,
	} = useHorizontalCarousel();

	useEffect(() => {
		onControlsChange({ canScrollNext, canScrollPrev, scrollNext, scrollPrev });
	}, [canScrollNext, canScrollPrev, onControlsChange, scrollNext, scrollPrev]);

	return (
		<CarouselViewport ref={setViewportRef}>
			<CarouselContainer ref={setContainerRef}>
				{series.map((seriesItem) => (
					<CarouselSlide key={seriesItem.id}>
						<SeriesSliderCard seriesItem={seriesItem} />
					</CarouselSlide>
				))}
			</CarouselContainer>
		</CarouselViewport>
	);
};

export default HomeEntitySliderSection;

const Section = styled.section`
	width: min(
		calc(100% - (${theme.layout.contentGutter} * 2)),
		${theme.layout.contentMaxWidth}
	);
	margin: 4rem auto 0;
	height: fit-content;
`;

const SectionHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1.25rem;
	margin-bottom: 1.75rem;
`;

const SectionHeading = styled.div`
	display: flex;
	align-items: center;
	gap: 1.25rem;
	min-width: 0;
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
		@media (max-width: ${theme.rubberSize.tablet}) {
			font-size: 0.75rem;
		}
	}
`;

const StateMessage = styled(CarouselStateMessage)``;

const TreasureCardBase = styled(Link)`
	display: grid;
	align-items: center;
	gap: 1rem;
	grid-template-columns: 5rem minmax(0, 1fr);
	min-width: 16.5rem;
	border: 0.0625rem solid rgb(211 202 196 / 0.72);
	border-radius: 0.75rem;
	background: rgb(255 255 255 / 0.58);
	padding: 0.95rem 1rem;
	color: inherit;
	text-decoration: none;
	transition:
		border-color 180ms ease,
		background 180ms ease,
		transform 180ms ease;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		background: rgb(255 255 255 / 0.76);
		outline: none;
		transform: translateY(-0.0625rem);
	}
`;

const AuthorTreasureCard = styled(TreasureCardBase)``;

const CollectionTreasureCard = styled(TreasureCardBase)``;

const TreasureResourceMeta = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
`;

const TreasureResourceTitle = styled.h3`
	display: -webkit-box;
	overflow: hidden;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1rem;
	font-weight: 600;
	line-height: 1.15;
`;

const TreasureResourceText = styled.p`
	display: -webkit-box;
	overflow: hidden;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 0.8rem;
	line-height: 1.3;
`;

const CollectionCover = styled.div<{ $coverUrl?: string }>`
	width: 5rem;
	aspect-ratio: 1 / 1;
	border-radius: 0.6rem;
	background:
		linear-gradient(rgb(4 18 26 / 0.08), rgb(4 18 26 / 0.08)),
		url("${({ $coverUrl }) => $coverUrl || "/images/book-placeholder.svg"}")
			center / cover;
`;
