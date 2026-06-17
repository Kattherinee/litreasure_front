"use client";

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
	onControlsChange?: (controls: IHorizontalCarouselControls) => void;
	showStatusBadge?: boolean;
	size?: IBookCardSize;
}

const BookCarousel = ({
	activeBookId,
	bleed = true,
	books,
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
			<CarouselViewport $bleed={bleed} $hasOverflow={hasOverflow} ref={setViewportRef}>
				<CarouselContainer $bleed={bleed} ref={setContainerRef}>
					{books.map((book, index) => (
						<CarouselSlide key={`${book.id}-${index}`}>
							<BookCard
								book={book}
								isActive={book.id === activeBookId}
								showStatusBadge={showStatusBadge}
								size={size}
							/>
						</CarouselSlide>
					))}
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
