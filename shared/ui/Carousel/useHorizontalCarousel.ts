"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EmblaCarouselType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";

const WHEEL_SENSITIVITY = -0.91;
const EMBLA_WHEEL_DURATION = 15;
const EMBLA_WHEEL_FRICTION = 0.68;
const SCROLL_EDGE_THRESHOLD = 0.002;
const HORIZONTAL_GESTURE_RATIO = 1.15;
const MIN_HORIZONTAL_DELTA = 4;

export interface IHorizontalCarouselControls {
	canScrollNext: boolean;
	canScrollPrev: boolean;
	scrollNext: () => void;
	scrollPrev: () => void;
}

export const useHorizontalCarousel = () => {
	const [emblaRef, emblaApi] = useEmblaCarousel({
		align: "start",
		containScroll: "keepSnaps",
		dragFree: true,
		duration: 28,
	});
	const viewportNode = useRef<HTMLDivElement | null>(null);
	const containerNode = useRef<HTMLDivElement | null>(null);
	const [canScrollPrev, setCanScrollPrev] = useState(false);
	const [canScrollNext, setCanScrollNext] = useState(false);
	const [hasOverflow, setHasOverflow] = useState(false);

	const updateControls = useCallback((api: EmblaCarouselType) => {
		const viewport = viewportNode.current;
		const container = containerNode.current;
		const measuredOverflow =
			viewport && container
				? container.scrollWidth - viewport.clientWidth > 1
				: false;
		const hasCarouselScroll =
			measuredOverflow || api.canScrollPrev() || api.canScrollNext();
		const progress = api.scrollProgress();

		setHasOverflow(hasCarouselScroll);
		setCanScrollPrev(hasCarouselScroll && progress > SCROLL_EDGE_THRESHOLD);
		setCanScrollNext(hasCarouselScroll && progress < 1 - SCROLL_EDGE_THRESHOLD);
	}, []);

	const scrollNext = useCallback(() => {
		emblaApi?.scrollNext();
	}, [emblaApi]);

	const scrollPrev = useCallback(() => {
		emblaApi?.scrollPrev();
	}, [emblaApi]);

	const setViewportRef = useCallback(
		(node: HTMLDivElement | null) => {
			viewportNode.current = node;
			emblaRef(node);
		},
		[emblaRef],
	);

	const setContainerRef = useCallback((node: HTMLDivElement | null) => {
		containerNode.current = node;
	}, []);

	const handleWheel = useCallback(
		(event: WheelEvent) => {
			if (!emblaApi || !hasOverflow) {
				return;
			}

			const absDeltaX = Math.abs(event.deltaX);
			const absDeltaY = Math.abs(event.deltaY);
			const hasStrongHorizontalIntent =
				absDeltaX > MIN_HORIZONTAL_DELTA &&
				absDeltaX > absDeltaY * HORIZONTAL_GESTURE_RATIO;
			const isHorizontalGesture = hasStrongHorizontalIntent || event.shiftKey;
			const rawDelta = isHorizontalGesture
				? absDeltaX > 0
					? event.deltaX
					: event.deltaY
				: 0;
			const deltaModeMultiplier = event.deltaMode === 1 ? 16 : 1;
			const scrollDelta = rawDelta * deltaModeMultiplier;

			if (scrollDelta === 0) {
				return;
			}

			event.preventDefault();

			const engine = emblaApi.internalEngine();
			const wheelForce = scrollDelta * WHEEL_SENSITIVITY;
			const currentTarget = engine.target.get();
			const nextTarget = engine.limit.constrain(currentTarget + wheelForce);
			const constrainedForce = nextTarget - currentTarget;

			if (Math.abs(constrainedForce) < 0.2) {
				return;
			}

			engine.scrollBody
				.useDuration(EMBLA_WHEEL_DURATION)
				.useFriction(EMBLA_WHEEL_FRICTION);
			engine.scrollTo.distance(constrainedForce, false);
			window.requestAnimationFrame(() => updateControls(emblaApi));
		},
		[emblaApi, hasOverflow, updateControls],
	);

	useEffect(() => {
		const node = viewportNode.current;

		if (!node) {
			return;
		}

		node.addEventListener("wheel", handleWheel, { passive: false });

		return () => {
			node.removeEventListener("wheel", handleWheel);
		};
	}, [handleWheel]);

	useEffect(() => {
		if (!emblaApi) {
			return;
		}

		emblaApi.on("select", updateControls);
		emblaApi.on("scroll", updateControls);
		emblaApi.on("reInit", updateControls);
		emblaApi.on("settle", updateControls);
		const frame = window.requestAnimationFrame(() => updateControls(emblaApi));
		const resizeObserver =
			typeof ResizeObserver === "undefined"
				? null
				: new ResizeObserver(() => {
						updateControls(emblaApi);
					});

		if (viewportNode.current) {
			resizeObserver?.observe(viewportNode.current);
		}

		if (containerNode.current) {
			resizeObserver?.observe(containerNode.current);
		}

		return () => {
			window.cancelAnimationFrame(frame);
			resizeObserver?.disconnect();
			emblaApi.off("select", updateControls);
			emblaApi.off("scroll", updateControls);
			emblaApi.off("reInit", updateControls);
			emblaApi.off("settle", updateControls);
		};
	}, [emblaApi, updateControls]);

	return {
		canScrollNext,
		canScrollPrev,
		hasOverflow,
		setContainerRef,
		setViewportRef,
		scrollNext,
		scrollPrev,
	};
};
