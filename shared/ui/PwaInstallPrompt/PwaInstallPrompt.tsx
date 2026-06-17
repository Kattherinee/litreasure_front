"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";

import { theme } from "@/shared/theme";

type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_STORAGE_KEY = "litreasure:pwa-install-prompt-dismissed";

const isIosDevice = () => {
	if (typeof window === "undefined") {
		return false;
	}

	const { userAgent, platform, maxTouchPoints } = window.navigator;

	return (
		/iPad|iPhone|iPod/.test(userAgent) ||
		(platform === "MacIntel" && maxTouchPoints > 1)
	);
};

const isSafariBrowser = () => {
	if (typeof window === "undefined") {
		return false;
	}

	const userAgent = window.navigator.userAgent;

	return /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);
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

const isDismissed = () => {
	if (typeof window === "undefined") {
		return false;
	}

	return window.localStorage.getItem(DISMISS_STORAGE_KEY) === "1";
};

const setDismissed = () => {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(DISMISS_STORAGE_KEY, "1");
};

const PwaInstallPrompt = () => {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [isIosDeviceState] = useState(() => isIosDevice());
	const [isSafariBrowserState] = useState(() => isSafariBrowser());
	const [isCollapsed, setIsCollapsed] = useState(() => isDismissed());
	const [isInstalled, setIsInstalled] = useState(true);
	const [isResolved, setIsResolved] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const syncInstalledState = () => {
			setIsInstalled(isStandaloneMode());
			setIsResolved(true);
		};

		const frameId = window.requestAnimationFrame(syncInstalledState);
		const standaloneMediaQuery = window.matchMedia("(display-mode: standalone)");
		const fullscreenMediaQuery = window.matchMedia("(display-mode: fullscreen)");
		const minimalUiMediaQuery = window.matchMedia("(display-mode: minimal-ui)");

		const handleBeforeInstallPrompt = (event: Event) => {
			event.preventDefault();
			setDeferredPrompt(event as BeforeInstallPromptEvent);
		};

		const handleEnvironmentChange = () => {
			syncInstalledState();
		};

		const handleAppInstalled = () => {
			setDeferredPrompt(null);
			syncInstalledState();
		};

		standaloneMediaQuery.addEventListener("change", handleEnvironmentChange);
		fullscreenMediaQuery.addEventListener("change", handleEnvironmentChange);
		minimalUiMediaQuery.addEventListener("change", handleEnvironmentChange);
		window.addEventListener(
			"beforeinstallprompt",
			handleBeforeInstallPrompt as EventListener,
		);
		window.addEventListener("appinstalled", handleAppInstalled);
		window.addEventListener("pageshow", handleEnvironmentChange);
		document.addEventListener("visibilitychange", handleEnvironmentChange);

		return () => {
			window.cancelAnimationFrame(frameId);
			standaloneMediaQuery.removeEventListener("change", handleEnvironmentChange);
			fullscreenMediaQuery.removeEventListener("change", handleEnvironmentChange);
			minimalUiMediaQuery.removeEventListener("change", handleEnvironmentChange);
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt as EventListener,
			);
			window.removeEventListener("appinstalled", handleAppInstalled);
			window.removeEventListener("pageshow", handleEnvironmentChange);
			document.removeEventListener("visibilitychange", handleEnvironmentChange);
		};
	}, []);

	if (!isResolved || isInstalled) {
		return null;
	}

	const showAndroidPrompt = Boolean(deferredPrompt);
	const showIosPrompt =
		isIosDeviceState && isSafariBrowserState && !isInstalled && !showAndroidPrompt;
	const canShowPrompt = showAndroidPrompt || showIosPrompt;

	if (!canShowPrompt) {
		return null;
	}

	const handleClose = () => {
		setDismissed();
		setIsCollapsed(true);
	};

	const handleInstall = async () => {
		if (!deferredPrompt) {
			return;
		}

		await deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === "accepted") {
			setDeferredPrompt(null);
			return;
		}

		setDismissed();
		setIsCollapsed(true);
	};

	return (
		<PromptWrap>
			{isCollapsed ? (
				<CollapsedButton type="button" onClick={() => setIsCollapsed(false)}>
					<CollapsedEyebrow>PWA</CollapsedEyebrow>
					<CollapsedText>
						{showAndroidPrompt ? "Install app" : "How to add app"}
					</CollapsedText>
				</CollapsedButton>
			) : (
				<Card>
					<CloseButton
						aria-label="Hide install prompt"
						type="button"
						onClick={handleClose}
					>
						×
					</CloseButton>
					<Eyebrow>App install</Eyebrow>
					<Title>
						{showAndroidPrompt
							? "Install Litreasure for quicker access"
							: "Add Litreasure to your Home Screen"}
					</Title>
					<Description>
						{showAndroidPrompt ? (
							<>Open Litreasure like a native app and keep it one tap away.</>
						) : (
							<>
								On iPhone or iPad, tap <Strong>Share</Strong> in Safari, then
								choose <Strong>Add to Home Screen</Strong>.
							</>
						)}
					</Description>
					{showAndroidPrompt ? (
						<PrimaryButton type="button" onClick={handleInstall}>
							Install app
						</PrimaryButton>
					) : (
						<Steps>
							<Step>
								<StepBadge>1</StepBadge>
								<span>Tap Share in the Safari toolbar</span>
							</Step>
							<Step>
								<StepBadge>2</StepBadge>
								<span>Select Add to Home Screen</span>
							</Step>
						</Steps>
					)}
				</Card>
			)}
		</PromptWrap>
	);
};

export default PwaInstallPrompt;

const PromptWrap = styled.div`
	position: fixed;
	display: flex;
	justify-content: flex-end;
	right: calc(1rem + env(safe-area-inset-right));
	bottom: calc(1rem + env(safe-area-inset-bottom));
	z-index: 1350;
	width: min(24rem, calc(100vw - 1.5rem));

	@media (max-width: ${theme.rubberSize.tablet}) {
		right: 0.75rem;
		bottom: calc(5.25rem + env(safe-area-inset-bottom));
		left: auto;
		width: min(22rem, calc(100vw - 1.5rem));
	}
`;

const Card = styled.aside`
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 0.7rem;
	border: 0.0625rem solid rgb(238 179 141 / 0.42);
	border-radius: 1.1rem;
	background:
		linear-gradient(180deg, rgb(255 255 255 / 0.16), rgb(255 255 255 / 0)),
		rgb(35 61 77 / 0.96);
	padding: 1rem 1rem 0.95rem;
	color: ${theme.colors.invertedText};
	box-shadow: 0 1rem 2.5rem rgb(4 18 26 / 0.24);
	backdrop-filter: blur(16px) saturate(1.2);
`;

const CollapsedButton = styled.button`
	display: inline-flex;
	width: 3.25rem;
	height: 3.25rem;
	align-items: center;
	justify-content: center;
	border: 0.0625rem solid rgb(238 179 141 / 0.42);
	border-radius: 50%;
	background: rgb(35 61 77 / 0.94);
	padding: 0;
	color: ${theme.colors.invertedText};
	cursor: pointer;
	box-shadow: 0 1rem 2.2rem rgb(4 18 26 / 0.2);
	backdrop-filter: blur(16px) saturate(1.2);

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		outline: none;
	}
`;

const CollapsedEyebrow = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2.2rem;
	height: 2.2rem;
	border-radius: 50%;
	background: rgb(218 142 91 / 0.2);
	color: ${theme.colors.orangeLight};
	font-size: 0.78rem;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
`;

const CollapsedText = styled.span`
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	overflow: hidden;
	border: 0;
	margin: -1px;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
`;

const CloseButton = styled.button`
	position: absolute;
	top: 0.65rem;
	right: 0.65rem;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.8rem;
	height: 1.8rem;
	border: 0;
	border-radius: 50%;
	background: rgb(242 239 237 / 0.08);
	color: ${theme.colors.invertedText};
	cursor: pointer;
	font-size: 1.2rem;
	line-height: 1;

	&:hover,
	&:focus-visible {
		background: rgb(242 239 237 / 0.16);
		outline: none;
	}
`;

const Eyebrow = styled.div`
	color: ${theme.colors.orangeLight};
	font-size: 0.78rem;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
`;

const Title = styled.h2`
	margin: 0;
	padding-right: 2rem;
	font-family: ${theme.fonts.serif};
	font-size: 1.2rem;
	font-weight: 600;
	line-height: 1.2;
`;

const Description = styled.p`
	margin: 0;
	color: rgb(242 239 237 / 0.88);
	font-size: 0.93rem;
	line-height: 1.45;
`;

const Strong = styled.span`
	color: ${theme.colors.orangeLight};
	font-weight: 700;
`;

const PrimaryButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	align-self: flex-start;
	border: 0;
	border-radius: 999px;
	background: linear-gradient(
		135deg,
		${theme.colors.orangeDark},
		${theme.colors.orangeLight}
	);
	padding: 0.7rem 1rem;
	color: ${theme.colors.invertedText};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.94rem;
	font-weight: 700;
	line-height: 1;

	&:hover,
	&:focus-visible {
		outline: none;
		filter: brightness(1.03);
	}
`;

const Steps = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.55rem;
`;

const Step = styled.div`
	display: flex;
	align-items: center;
	gap: 0.65rem;
	color: rgb(242 239 237 / 0.92);
	font-size: 0.92rem;
	line-height: 1.35;
`;

const StepBadge = styled.span`
	display: inline-flex;
	width: 1.45rem;
	height: 1.45rem;
	flex: 0 0 auto;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: rgb(218 142 91 / 0.22);
	color: ${theme.colors.orangeLight};
	font-size: 0.8rem;
	font-weight: 700;
`;
