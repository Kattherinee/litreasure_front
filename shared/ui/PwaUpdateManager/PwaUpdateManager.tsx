"use client";

import { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";

import { theme } from "@/shared/theme";

const PULL_THRESHOLD = 84;
const MAX_PULL_DISTANCE = 116;

const isTouchDevice = () => {
	if (typeof window === "undefined") {
		return false;
	}

	return window.matchMedia("(pointer: coarse)").matches;
};

const isStandaloneMode = () => {
	if (typeof window === "undefined") {
		return false;
	}

	return (
		window.matchMedia("(display-mode: standalone)").matches ||
		window.matchMedia("(display-mode: fullscreen)").matches ||
		window.matchMedia("(display-mode: minimal-ui)").matches ||
		Boolean(
			(window.navigator as Navigator & { standalone?: boolean }).standalone,
		)
	);
};

const clampPullDistance = (distance: number) =>
	Math.max(0, Math.min(distance, MAX_PULL_DISTANCE));

const waitForServiceWorkerUpdate = async (
	registration: ServiceWorkerRegistration,
) => {
	if (registration.waiting) {
		return registration.waiting;
	}

	return new Promise<ServiceWorker | null>((resolve) => {
		let settled = false;
		let timeoutId: number | null = null;

		const finish = (worker: ServiceWorker | null) => {
			if (settled) {
				return;
			}

			settled = true;

			if (timeoutId) {
				window.clearTimeout(timeoutId);
			}

			registration.removeEventListener("updatefound", handleUpdateFound);
			resolve(worker);
		};

		const observeWorker = (worker: ServiceWorker | null) => {
			if (!worker) {
				finish(registration.waiting ?? null);
				return;
			}

			const handleStateChange = () => {
				if (worker.state === "installed") {
					finish(registration.waiting ?? worker);
				}

				if (worker.state === "redundant") {
					finish(null);
				}
			};

			worker.addEventListener("statechange", handleStateChange);
			handleStateChange();
		};

		const handleUpdateFound = () => {
			observeWorker(registration.installing);
		};

		registration.addEventListener("updatefound", handleUpdateFound);
		timeoutId = window.setTimeout(
			() => finish(registration.waiting ?? null),
			1500,
		);

		registration.update().catch(() => finish(null));
	});
};

const PwaUpdateManager = () => {
	const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
	const shouldReloadOnControllerChangeRef = useRef(false);
	const touchStartYRef = useRef<number | null>(null);
	const isPullingRef = useRef(false);
	const [isTouchDeviceState] = useState(() => isTouchDevice());
	const [isStandalonePwa, setIsStandalonePwa] = useState(() =>
		isStandaloneMode(),
	);
	const [pullDistance, setPullDistance] = useState(0);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [updateReady, setUpdateReady] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
			return;
		}

		let isMounted = true;

		const syncUpdateState = (registration: ServiceWorkerRegistration) => {
			if (!isMounted) {
				return;
			}

			setUpdateReady(Boolean(registration.waiting));
		};

		const handleControllerChange = () => {
			if (!shouldReloadOnControllerChangeRef.current) {
				return;
			}

			window.location.reload();
		};

		const syncStandaloneState = () => {
			setIsStandalonePwa(isStandaloneMode());
		};

		const handleVisibilityChange = () => {
			const registration = registrationRef.current;

			if (document.visibilityState !== "visible" || !registration) {
				return;
			}

			registration.update().then(() => syncUpdateState(registration));
		};

		const registerServiceWorker = async () => {
			try {
				const registration = await navigator.serviceWorker.register("/sw.js");

				if (!isMounted) {
					return;
				}

				registrationRef.current = registration;
				syncUpdateState(registration);

				registration.addEventListener("updatefound", () => {
					const worker = registration.installing;

					if (!worker) {
						return;
					}

					worker.addEventListener("statechange", () => {
						if (
							worker.state === "installed" &&
							navigator.serviceWorker.controller
						) {
							syncUpdateState(registration);
						}
					});
				});
			} catch {
				// Ignore SW registration errors in unsupported or restricted contexts.
			}
		};

		navigator.serviceWorker.addEventListener(
			"controllerchange",
			handleControllerChange,
		);
		window.addEventListener("pageshow", syncStandaloneState);
		document.addEventListener("visibilitychange", syncStandaloneState);
		document.addEventListener("visibilitychange", handleVisibilityChange);
		registerServiceWorker();

		return () => {
			isMounted = false;
			navigator.serviceWorker.removeEventListener(
				"controllerchange",
				handleControllerChange,
			);
			window.removeEventListener("pageshow", syncStandaloneState);
			document.removeEventListener("visibilitychange", syncStandaloneState);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, []);

	useEffect(() => {
		if (!isTouchDeviceState || typeof window === "undefined") {
			return;
		}

		const handleTouchStart = (event: TouchEvent) => {
			if (window.scrollY > 0 || isRefreshing) {
				touchStartYRef.current = null;
				isPullingRef.current = false;
				return;
			}

			touchStartYRef.current = event.touches[0]?.clientY ?? null;
			isPullingRef.current = false;
		};

		const handleTouchMove = (event: TouchEvent) => {
			const startY = touchStartYRef.current;

			if (startY == null || window.scrollY > 0 || isRefreshing) {
				return;
			}

			const currentY = event.touches[0]?.clientY ?? startY;
			const delta = currentY - startY;

			if (delta <= 0) {
				setPullDistance(0);
				return;
			}

			isPullingRef.current = true;
			const nextDistance = clampPullDistance(delta * 0.45);
			setPullDistance(nextDistance);

			if (nextDistance > 10) {
				event.preventDefault();
			}
		};

		const handleTouchEnd = async () => {
			const shouldRefresh =
				isPullingRef.current && pullDistance >= PULL_THRESHOLD && !isRefreshing;

			touchStartYRef.current = null;
			isPullingRef.current = false;
			setPullDistance(0);

			if (!shouldRefresh) {
				return;
			}

			setIsRefreshing(true);

			try {
				const registration = registrationRef.current;

				if (registration) {
					const waitingWorker = await waitForServiceWorkerUpdate(registration);

					if (waitingWorker && navigator.serviceWorker.controller) {
						shouldReloadOnControllerChangeRef.current = true;
						waitingWorker.postMessage({ type: "SKIP_WAITING" });
						return;
					}
				}

				window.location.reload();
			} finally {
				window.setTimeout(() => {
					setIsRefreshing(false);
				}, 900);
			}
		};

		window.addEventListener("touchstart", handleTouchStart, { passive: true });
		window.addEventListener("touchmove", handleTouchMove, { passive: false });
		window.addEventListener("touchend", handleTouchEnd, { passive: true });
		window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

		return () => {
			window.removeEventListener("touchstart", handleTouchStart);
			window.removeEventListener("touchmove", handleTouchMove);
			window.removeEventListener("touchend", handleTouchEnd);
			window.removeEventListener("touchcancel", handleTouchEnd);
		};
	}, [isRefreshing, isTouchDeviceState, pullDistance]);

	const handleUpdateClick = () => {
		const waitingWorker = registrationRef.current?.waiting;

		if (!waitingWorker) {
			window.location.reload();
			return;
		}

		shouldReloadOnControllerChangeRef.current = true;
		waitingWorker.postMessage({ type: "SKIP_WAITING" });
	};

	const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
	const showPullIndicator =
		isTouchDeviceState && (pullDistance > 0 || isRefreshing);

	return (
		<>
			{showPullIndicator ? (
				<PullIndicator
					$active={pullDistance >= PULL_THRESHOLD || isRefreshing}
					style={{
						transform: `translate(-50%, ${Math.max(-0.5, pullProgress) * 100 - 100}%)`,
					}}
				>
					<Spinner $spinning={isRefreshing} />
					<span>
						{isRefreshing
							? "Refreshing app..."
							: pullDistance >= PULL_THRESHOLD
								? "Release to refresh"
								: "Pull to refresh"}
					</span>
				</PullIndicator>
			) : null}

			{updateReady && isStandalonePwa ? (
				<UpdateChip type="button" onClick={handleUpdateClick}>
					Update app
				</UpdateChip>
			) : null}
		</>
	);
};

export default PwaUpdateManager;

const spin = keyframes`
	from {
		transform: rotate(0deg);
	}

	to {
		transform: rotate(360deg);
	}
`;

const PullIndicator = styled.div<{ $active: boolean }>`
	position: fixed;
	top: calc(1.25rem + env(safe-area-inset-top));
	left: 50%;
	z-index: 1450;
	display: inline-flex;
	align-items: center;
	gap: 0.55rem;
	border: 0.0625rem solid
		${({ $active }) =>
			$active ? theme.colors.orangeLight : "rgb(238 179 141 / 0.36)"};
	border-radius: 999px;
	background: rgb(242 239 237 / 0.76);
	padding: 0.6rem 0.9rem;
	color: ${theme.colors.bluePrimary};
	box-shadow: 0 0.75rem 2rem rgb(4 18 26 / 0.16);
	backdrop-filter: blur(14px) saturate(1.2);
	transition:
		border-color 180ms ease,
		transform 180ms ease;
`;

const Spinner = styled.span<{ $spinning: boolean }>`
	display: inline-flex;
	width: 1rem;
	height: 1rem;
	border: 0.125rem solid rgb(35 61 77 / 0.22);
	border-top-color: ${theme.colors.orangeDark};
	border-radius: 50%;
	animation: ${({ $spinning }) => ($spinning ? spin : "none")} 0.9s linear
		infinite;
`;

const UpdateChip = styled.button`
	position: fixed;
	right: calc(1rem + env(safe-area-inset-right));
	bottom: calc(5.9rem + env(safe-area-inset-bottom));
	z-index: 1400;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border: 0;
	border-radius: 999px;
	background: linear-gradient(
		135deg,
		${theme.colors.orangeDark},
		${theme.colors.orangeLight}
	);
	padding: 0.72rem 1rem;
	color: ${theme.colors.invertedText};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.92rem;
	font-weight: 700;
	line-height: 1;
	box-shadow: 0 1rem 2rem rgb(4 18 26 / 0.2);

	&:hover,
	&:focus-visible {
		outline: none;
		filter: brightness(1.03);
	}

	@media (min-width: ${theme.rubberSize.tablet}) {
		bottom: calc(1rem + env(safe-area-inset-bottom));
	}
`;
