"use client";

import { useEffect, useRef, useState } from "react";

export const useLazyLoadTrigger = (
	isLazy = false,
	rootMargin = "900px 0px",
) => {
	const containerRef = useRef<HTMLElement | null>(null);
	const [isTriggered, setIsTriggered] = useState(!isLazy);

	useEffect(() => {
		if (isTriggered) {
			return;
		}

		const node = containerRef.current;

		if (!node || typeof IntersectionObserver === "undefined") {
			const frame = window.requestAnimationFrame(() => {
				setIsTriggered(true);
			});

			return () => {
				window.cancelAnimationFrame(frame);
			};
		}

		if (node.getBoundingClientRect().top <= window.innerHeight) {
			const frame = window.requestAnimationFrame(() => {
				setIsTriggered(true);
			});

			return () => {
				window.cancelAnimationFrame(frame);
			};
		}

		const marginMatch = /^(-?\d+(?:\.\d+)?)px/.exec(rootMargin);
		const topRootMargin = marginMatch ? Number(marginMatch[1]) : 0;

		if (node.getBoundingClientRect().top <= window.innerHeight + topRootMargin) {
			const frame = window.requestAnimationFrame(() => {
				setIsTriggered(true);
			});

			return () => {
				window.cancelAnimationFrame(frame);
			};
		}

		if (!node.isConnected) {
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) {
					return;
				}

				setIsTriggered(true);
				observer.disconnect();
			},
			{ rootMargin },
		);

		observer.observe(node);

		return () => {
			observer.disconnect();
		};
	}, [isTriggered, rootMargin]);

	return { containerRef, isTriggered };
};
