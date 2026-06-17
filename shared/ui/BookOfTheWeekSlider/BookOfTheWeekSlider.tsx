"use client";

import { useCallback, useEffect, useState } from "react";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import TagIcon from "@mui/icons-material/Tag";
import { useRouter } from "next/navigation";
import type { EmblaCarouselType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import styled from "styled-components";

import { useRecomendationsWeekBooksQuery } from "@/shared/api/recomendations/recomendations.hooks";
import { theme } from "@/shared/theme";
import { CoverPlaceholder } from "@/shared/ui/Skeleton";
import { useLazyLoadTrigger } from "@/shared/utils/useLazyLoadTrigger";

const SCROLL_EDGE_THRESHOLD = 0.002;

interface IBookOfTheWeekSliderProps {
	lazy?: boolean;
}

const BookOfTheWeekSlider = ({ lazy = false }: IBookOfTheWeekSliderProps) => {
	const router = useRouter();
	const { containerRef, isTriggered } = useLazyLoadTrigger(lazy);
	const {
		data: weekBooks = [],
		error,
		isError,
		isLoading,
	} = useRecomendationsWeekBooksQuery({ enabled: isTriggered });
	const [emblaRef, emblaApi] = useEmblaCarousel({
		align: "center",
		containScroll: "trimSnaps",
		loop: weekBooks.length > 1,
	});
	const [canScrollPrev, setCanScrollPrev] = useState(true);
	const [canScrollNext, setCanScrollNext] = useState(true);

	const updateControls = useCallback((api: EmblaCarouselType) => {
		const progress = api.scrollProgress();

		setCanScrollPrev(api.canScrollPrev() || progress > SCROLL_EDGE_THRESHOLD);
		setCanScrollNext(
			api.canScrollNext() || progress < 1 - SCROLL_EDGE_THRESHOLD,
		);
	}, []);

	const scrollPrev = useCallback(() => {
		emblaApi?.scrollPrev();
	}, [emblaApi]);

	const scrollNext = useCallback(() => {
		emblaApi?.scrollNext();
	}, [emblaApi]);

	const openBookPage = useCallback(
		(bookId: string) => {
			router.push(`/books/${bookId}`);
		},
		[router],
	);

	useEffect(() => {
		if (!emblaApi) {
			return;
		}

		emblaApi.on("select", updateControls);
		emblaApi.on("reInit", updateControls);
		const frame = window.requestAnimationFrame(() => updateControls(emblaApi));

		return () => {
			window.cancelAnimationFrame(frame);
			emblaApi.off("select", updateControls);
			emblaApi.off("reInit", updateControls);
		};
	}, [emblaApi, updateControls]);

	if (!isTriggered || isLoading) {
		return (
			<Slider ref={containerRef} aria-label="Book of the week">
				<Viewport>
					<Container>
						<Slide>
							<BookCoverWrap>
								<CoverPlaceholder aria-hidden="true" />
							</BookCoverWrap>
							<BookInfo>
								<BookHeadingRow>
									<SeriesChip>Selecting</SeriesChip>
									<BookTitle>book of the week...</BookTitle>
								</BookHeadingRow>
								<BookDescription>
									Your personalized recommendation will appear soon.
								</BookDescription>
								<BookTag>
									<TagIcon aria-hidden="true" />
									<span>Book of the week</span>
								</BookTag>
							</BookInfo>
						</Slide>
					</Container>
				</Viewport>
			</Slider>
		);
	}

	if (isError) {
		return (
			<Slider aria-label="Book of the week">
				<StateMessage>
					Failed to load book of the week: {error.message}
				</StateMessage>
			</Slider>
		);
	}

	if (weekBooks.length === 0) {
		return (
			<Slider ref={containerRef} aria-label="Book of the week">
				<StateMessage>No personalized book of the week yet.</StateMessage>
			</Slider>
		);
	}

	return (
		<Slider ref={containerRef} aria-label="Book of the week">
			<Viewport ref={emblaRef}>
				<Container>
					{weekBooks.map((book) => (
						<Slide
							key={book.id}
							tabIndex={0}
							role="link"
							onClick={() => openBookPage(book.id)}
							onKeyDown={(event) => {
								if (event.key === "Enter" || event.key === " ") {
									event.preventDefault();
									openBookPage(book.id);
								}
							}}
						>
							<WeekCoverImage
								src={book.coverUrl ?? "/images/book-placeholder.svg"}
								alt={`Cover of ${book.title}`}
							/>
							<BookInfo>
								<BookHeadingRow>
									{getSeriesTag(book) ? (
										<SeriesChip>{getSeriesTag(book)}</SeriesChip>
									) : null}
									<BookTitle>{book.title}</BookTitle>
								</BookHeadingRow>
								{book.description ? (
									<BookDescription>{book.description}</BookDescription>
								) : null}
								<BookTag>
									<TagIcon aria-hidden="true" />
									<span>Book of the week</span>
								</BookTag>
							</BookInfo>
						</Slide>
					))}
				</Container>
			</Viewport>

			<ArrowButton
				aria-label="Previous book of the week"
				disabled={weekBooks.length < 2 || !canScrollPrev}
				type="button"
				onClick={scrollPrev}
			>
				<KeyboardArrowLeftIcon aria-hidden="true" />
			</ArrowButton>
			<ArrowButton
				$side="right"
				aria-label="Next book of the week"
				disabled={weekBooks.length < 2 || !canScrollNext}
				type="button"
				onClick={scrollNext}
			>
				<KeyboardArrowRightIcon aria-hidden="true" />
			</ArrowButton>
		</Slider>
	);
};

export default BookOfTheWeekSlider;

const getSeriesTag = (book: {
	bookCountInSeries?: number | null;
	orderInSeries?: number | null;
	seriesTitle?: string | null;
}) => {
	const seriesTitle = book.seriesTitle?.trim();

	if (!seriesTitle) {
		return null;
	}

	const orderInSeries = book.orderInSeries ?? null;
	const bookCountInSeries = book.bookCountInSeries ?? null;

	if (orderInSeries && orderInSeries > 0) {
		return bookCountInSeries && bookCountInSeries > 0
			? `Book ${orderInSeries} of ${bookCountInSeries} in ${seriesTitle}`
			: `Book ${orderInSeries} in ${seriesTitle}`;
	}

	return `Part of ${seriesTitle}`;
};

const WeekCoverImage = ({ alt, src }: { alt: string; src: string }) => {
	const [isLoaded, setIsLoaded] = useState(false);

	return (
		<BookCoverWrap>
			{isLoaded ? null : <CoverPlaceholder aria-hidden="true" />}
			<BookCover
				$isLoaded={isLoaded}
				src={src}
				alt={alt}
				decoding="async"
				loading="lazy"
				onLoad={() => setIsLoaded(true)}
			/>
		</BookCoverWrap>
	);
};

const Slider = styled.section`
	--page-gutter: ${theme.layout.contentGutter};
	--content-width: ${theme.layout.contentMaxWidth};
	--content-side-space: max(
		var(--page-gutter),
		calc((100vw - var(--content-width)) / 2)
	);

	position: relative;
	width: 100vw;
	min-height: 20.8125rem;
	margin-top: 3rem;
	height: 20.8125rem;
	background: ${theme.colors.border};

	@media (max-width: ${theme.rubberSize.tablet}) {
		min-height: 16.75rem;
		height: fit-content;
		padding: 2rem 0;
		--content-side-space: clamp(2.75rem, 8vw, 4rem);
	}
`;

const Viewport = styled.div`
	overflow: hidden;
`;

const Container = styled.div`
	display: flex;
	align-items: stretch;
	touch-action: pan-y pinch-zoom;
	height: 100%;
`;

const Slide = styled.article`
	display: flex;
	flex: 0 0 100%;
	align-items: center;
	justify-content: center;
	gap: clamp(2rem, 5vw, 3.375rem);
	min-width: 0;
	padding: 2.5rem calc(var(--content-side-space));
	cursor: pointer;

	&:hover h2,
	&:focus-visible h2 {
		color: ${theme.colors.orangeDark};
	}

	&:focus-visible {
		outline: 0.125rem solid ${theme.colors.orangeDark};
		outline-offset: 0.125rem;
	}

	@media (max-width: ${theme.rubberSize.tablet}) {
		gap: 1.1rem;
		padding: 1.15rem calc(var(--content-side-space) + 0.95rem);
		flex-direction: column;
	}
`;

const BookCoverWrap = styled.div`
	position: relative;
	overflow: hidden;

	width: fit-content;
	height: 15.75rem;
	border-radius: 0.45rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		height: 12.75rem;
	}
`;

const BookCover = styled.img<{ $isLoaded: boolean }>`
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
	opacity: ${({ $isLoaded }) => ($isLoaded ? 1 : 0)};
	transition: opacity 220ms ease;
`;

const BookInfo = styled.div`
	display: grid;
	width: min(100%, 25.75rem);
	flex-direction: column;
	gap: 0.85rem;
	color: ${theme.colors.textPrimary};
	justify-items: center;
	text-align: center;

	@media (max-width: ${theme.rubberSize.tablet}) {
		width: min(100%, 22rem);
		gap: 0.7rem;
		align-items: center;
	}
`;

const BookHeadingRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: 0.75rem;
`;

const BookTitle = styled.h2`
	margin: 0;
	font-family: ${theme.fonts.serif};
	font-size: clamp(1.65rem, 2.2vw, 2rem);
	font-weight: 400;
	line-height: 1.1;
	transition: color 180ms ease;

	@media (max-width: ${theme.rubberSize.tablet}) {
		font-size: 1.45rem;
		text-align: center;
		align-self: center;
	}
`;

const BookDescription = styled.p`
	margin: 0;
	font-family: ${theme.fonts.serif};
	font-size: 1rem;
	font-weight: 400;
	line-height: 1.45;
	display: -webkit-box;
	overflow: hidden;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 4;

	@media (max-width: ${theme.rubberSize.tablet}) {
		font-size: 0.92rem;
		-webkit-line-clamp: 3;
	}
`;

const BookTag = styled.p`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.25rem;
	margin: 0;
	color: ${theme.colors.orangeDark};
	font-family: ${theme.fonts.serif};
	font-size: 1rem;
	line-height: 1.25rem;

	& svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	@media (max-width: ${theme.rubberSize.tablet}) {
		font-size: 0.9rem;
	}
`;

const SeriesChip = styled.p`
	display: inline-flex;
	align-items: center;
	flex: 0 0 auto;
	max-width: 100%;
	overflow: hidden;
	border: 0.0625rem solid rgb(242 239 237 / 0.22);
	border-radius: 62.4375rem;
	background: rgb(242 239 237 / 0.12);
	padding: 0.42rem 0.78rem;
	margin: 0;
	color: ${theme.colors.orangeDark};
	font-family: ${theme.fonts.sans};
	font-size: 0.82rem;
	font-weight: 600;
	line-height: 1;
	text-overflow: ellipsis;
	white-space: nowrap;

	@media (max-width: 74.9375rem) {
		font-size: 0.72rem;
	}
`;

const StateMessage = styled.p`
	margin: auto;
	padding: 0 1.25rem;
	color: ${theme.colors.softForeground};
	font-size: 1rem;
	line-height: 1.5;
	text-align: center;
`;

const ArrowButton = styled.button<{ $side?: "right" }>`
	position: absolute;
	top: 50%;
	${({ $side }) =>
		$side === "right"
			? "right: var(--content-side-space);"
			: "left: var(--content-side-space);"}
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2.5rem;
	height: 2.5rem;
	border: 0;
	border-radius: 50%;
	background: rgb(120 120 120 / 0.2);
	color: ${theme.colors.lightText};
	cursor: pointer;
	transform: translateY(-50%);
	transition:
		background 180ms ease,
		color 180ms ease,
		opacity 180ms ease,
		transform 180ms ease;

	& svg {
		width: 1.75rem;
		height: 1.75rem;
	}

	&:not(:disabled):hover,
	&:not(:disabled):focus-visible {
		background: rgb(120 120 120 / 0.32);
		color: ${theme.colors.foreground};
		outline: none;
		transform: translateY(-50%) scale(1.04);
	}

	&:disabled {
		cursor: default;
		opacity: 0.35;
	}

	@media (max-width: 64rem) {
		${({ $side }) => ($side === "right" ? "right: 1rem;" : "left: 1rem;")}
		width: 2.25rem;
		height: 2.25rem;

		& svg {
			width: 1.5rem;
			height: 1.5rem;
		}
	}
`;
