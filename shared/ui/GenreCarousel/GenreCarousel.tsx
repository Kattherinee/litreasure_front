"use client";

import { useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import styled from "styled-components";

import { theme } from "@/shared/theme";
import { GenrePill } from "@/shared/ui/GenrePill";
import { useGenresQuery } from "@/shared/api/genres";
import { GenrePillSkeleton } from "@/shared/ui/Skeleton";

const GenreCarousel = () => {
	const { data: genres = [], isLoading } = useGenresQuery();
	const [isMounted, setIsMounted] = useState(false);
	const [emblaRef, emblaApi] = useEmblaCarousel(
		{
			align: "start",
			dragFree: false,
			loop: true,
			containScroll: false,
		},
		[
			Autoplay({
				delay: 1700,
				stopOnFocusIn: true,
				stopOnInteraction: false,
				stopOnMouseEnter: true,
			}),
		],
	);

	useEffect(() => {
		emblaApi?.plugins().autoplay?.play();
	}, [emblaApi]);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const shouldRenderSkeleton = !isMounted || isLoading;

	if (!shouldRenderSkeleton && genres.length === 0) {
		return null;
	}

	return (
		<Carousel aria-label="Genres">
			<Viewport ref={emblaRef}>
				<Container>
					{shouldRenderSkeleton
						? Array.from({ length: 12 }, (_, index) => (
								<Slide key={index}>
									<GenrePillSkeleton />
								</Slide>
							))
						: genres.map((genre) => (
								<Slide key={genre.id}>
									<GenrePill href={`/genres/${genre.slug}`}>
										{genre.name}
									</GenrePill>
								</Slide>
							))}
				</Container>
			</Viewport>
		</Carousel>
	);
};

export default GenreCarousel;

const Carousel = styled.nav`
	--page-gutter: ${theme.layout.contentGutter};
	--content-width: ${theme.layout.contentMaxWidth};
	--content-side-space: max(
		var(--page-gutter),
		calc((100vw - var(--content-width)) / 2)
	);

	width: 100vw;
	margin-top: 1.85rem;
	margin-left: calc(50% - 50vw);

	@media (max-width: ${theme.rubberSize.tablet}) {
		margin-top: 1.05rem;
	}
`;

const Viewport = styled.div`
	width: 100%;
	overflow: hidden;
	overscroll-behavior-x: contain;
	padding-block: 0.5rem;
`;

const Container = styled.div`
	display: flex;
	gap: 0.5rem;
	padding-inline: var(--content-side-space);
	touch-action: pan-y pinch-zoom;
`;

const Slide = styled.div`
	flex: 0 0 auto;
	min-width: 0;
`;
