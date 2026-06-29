"use client";

import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import Link from "next/link";
import { useEffect } from "react";
import styled from "styled-components";

import { theme } from "@/shared/theme";
import {
	BookCard,
	type IBookCardData,
	type IBookCardSize,
} from "@/shared/ui/BookCard";
import {
	CarouselContainer,
	CarouselControlButton,
	CarouselControls,
	CarouselSlide,
	CarouselViewport,
} from "@/shared/ui/Carousel/Carousel.styles";
import {
	type IHorizontalCarouselControls,
	useHorizontalCarousel,
} from "@/shared/ui/Carousel/useHorizontalCarousel";

interface IBookCarouselProps {
	activeBookId?: string;
	bleed?: boolean;
	books: IBookCardData[];
	endSlideHref?: string;
	endSlideLabel?: string;
	onControlsChange?: (controls: IHorizontalCarouselControls) => void;
	showStatusBadge?: boolean;
	size?: IBookCardSize;
}

const BookCarousel = ({
	activeBookId,
	bleed = true,
	books,
	endSlideHref,
	endSlideLabel = "See all",
	onControlsChange,
	showStatusBadge = true,
	size = "default",
}: IBookCarouselProps) => {
	const {
		canScrollNext,
		canScrollPrev,
		hasOverflow,
		setContainerRef,
		setViewportRef,
		scrollNext,
		scrollPrev,
	} = useHorizontalCarousel();

	useEffect(() => {
		if (!onControlsChange) {
			return;
		}

		onControlsChange({
			canScrollNext,
			canScrollPrev,
			scrollNext,
			scrollPrev,
		});
	}, [canScrollNext, canScrollPrev, onControlsChange, scrollNext, scrollPrev]);

	if (books.length === 0) {
		return null;
	}

	return (
		<Carousel aria-label="Book carousel">
			<CarouselViewport
				$bleed={bleed}
				$hasOverflow={hasOverflow}
				ref={setViewportRef}
			>
				<CarouselContainer $bleed={bleed} ref={setContainerRef}>
					{books.map((book, index) => (
						<CarouselSlide key={book.id}>
							<BookCard
								book={book}
								coverFetchPriority={index < 2 ? "high" : "auto"}
								coverLoading={index < 2 ? "eager" : "lazy"}
								isActive={book.id === activeBookId}
								showStatusBadge={showStatusBadge}
								size={size}
							/>
						</CarouselSlide>
					))}
					{endSlideHref ? (
						<CarouselSlide>
							<EndSlideLink prefetch={false} href={endSlideHref}>
								<EndSlideInner>
									<EndSlideEyebrow>More books</EndSlideEyebrow>
									<EndSlideTitle>{endSlideLabel}</EndSlideTitle>
									<EndSlideArrow aria-hidden="true">
										<ArrowOutwardRoundedIcon />
									</EndSlideArrow>
								</EndSlideInner>
							</EndSlideLink>
						</CarouselSlide>
					) : null}
					{bleed ? <TailSpacer aria-hidden="true" /> : null}
				</CarouselContainer>
			</CarouselViewport>

			{onControlsChange || !hasOverflow ? null : (
				<CarouselControls>
					<CarouselControlButton
						aria-label="Previous books"
						disabled={!canScrollPrev}
						type="button"
						onClick={scrollPrev}
					>
						{"\u2039"}
					</CarouselControlButton>
					<CarouselControlButton
						aria-label="Next books"
						disabled={!canScrollNext}
						type="button"
						onClick={scrollNext}
					>
						{"\u203A"}
					</CarouselControlButton>
				</CarouselControls>
			)}
		</Carousel>
	);
};

export default BookCarousel;

const Carousel = styled.section`
	--page-gutter: ${theme.layout.contentGutter};
	--content-width: ${theme.layout.contentMaxWidth};
	--content-side-space: max(
		var(--page-gutter),
		calc((100vw - var(--content-width)) / 2)
	);

	position: relative;
	width: 100%;
`;

const TailSpacer = styled.div`
	flex: 0 0 var(--content-side-space);
	width: var(--content-side-space);
	height: 0.0625rem;
	pointer-events: none;
`;

const EndSlideLink = styled(Link)`
	display: flex;
	width: 9.4rem;
	height: 14.75rem;
	align-items: center;
	justify-content: center;
	color: ${theme.colors.foreground};
	text-decoration: none;
	transition:
		transform 180ms ease,
		color 180ms ease;

	&:focus-visible {
		outline: 0.1875rem solid ${theme.colors.orangeDark};
		outline-offset: 0.2rem;
	}

	@media (hover: hover) and (pointer: fine) {
		&:hover,
		&:focus-visible {
			transform: translateY(-0.1875rem);
			color: ${theme.colors.orangeDark};
		}
	}

	@media (max-width: ${theme.rubberSize.tablet}) {
		width: 6.9rem;
		height: 11.45rem;
		border-radius: 0.9rem;
	}
`;

const EndSlideInner = styled.div`
	display: flex;
	height: fit-content;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.85rem;
	width: 100%;
	text-align: center;
	padding: 1rem 0.5rem;

	@media (max-width: ${theme.rubberSize.tablet}) {
		padding: 0.8rem;
	}
`;

const EndSlideEyebrow = styled.span`
	color: ${theme.colors.lightText};
	font-family: ${theme.fonts.sans};
	font-size: 0.72rem;
	font-weight: 600;
	letter-spacing: 0.04em;
	text-transform: uppercase;

	@media (max-width: ${theme.rubberSize.tablet}) {
		font-size: 0.62rem;
	}
`;

const EndSlideTitle = styled.span`
	display: block;
	color: inherit;
	font-family: ${theme.fonts.serif};
	font-size: 1.2rem;
	font-weight: 600;
	line-height: 1.05;

	@media (max-width: ${theme.rubberSize.tablet}) {
		font-size: 0.98rem;
	}
`;

const EndSlideArrow = styled.span`
	display: inline-flex;
	width: 2.25rem;
	height: 2.25rem;
	align-items: center;
	justify-content: center;
	border-radius: 999px;
	background: rgb(218 142 91 / 0.12);
	color: ${theme.colors.orangeDark};

	& svg {
		width: 1.2rem;
		height: 1.2rem;
	}

	@media (max-width: ${theme.rubberSize.tablet}) {
		width: 2rem;
		height: 2rem;
	}
`;
