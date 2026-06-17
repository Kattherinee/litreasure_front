"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import styled from "styled-components";

import { API_BASE_URL, getStoredAccessToken } from "@/shared/api/base";
import { theme } from "@/shared/theme";
import { syncQueuedUserBookMutations } from "./offlineStorage";

interface IBeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type SyncState = "idle" | "syncing" | "synced";
const INSTALL_HINT_DISMISSED_KEY = "litreasure-pwa-install-dismissed";

const PwaStatus = () => {
	const queryClient = useQueryClient();
	const [isOnline, setIsOnline] = useState(
		() => typeof navigator === "undefined" || navigator.onLine,
	);
	const [isInstallHintDismissed, setIsInstallHintDismissed] = useState(
		() =>
			typeof window !== "undefined" &&
			window.localStorage.getItem(INSTALL_HINT_DISMISSED_KEY) === "true",
	);
	const [installPrompt, setInstallPrompt] =
		useState<IBeforeInstallPromptEvent | null>(null);
	const [syncState, setSyncState] = useState<SyncState>("idle");

	useEffect(() => {
		const registerServiceWorker = async () => {
			if (!("serviceWorker" in navigator)) return;

			try {
				await navigator.serviceWorker.register("/sw.js");
			} catch {
				console.warn("Litreasure PWA service worker registration failed.");
			}
		};

		registerServiceWorker();
	}, []);

	useEffect(() => {
		const handleBeforeInstallPrompt = (event: Event) => {
			event.preventDefault();
			setInstallPrompt(event as IBeforeInstallPromptEvent);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
		};
	}, []);

	useEffect(() => {
		let syncTimeout: ReturnType<typeof setTimeout> | undefined;

		const syncOfflineChanges = async () => {
			if (!navigator.onLine) return;

			setSyncState("syncing");
			const syncedCount = await syncQueuedUserBookMutations({
				apiBaseUrl: API_BASE_URL,
				token: getStoredAccessToken(),
			});

			if (syncedCount > 0) {
				await queryClient.invalidateQueries({ queryKey: ["user-books"] });
				await queryClient.invalidateQueries({ queryKey: ["books"] });
				setSyncState("synced");
				syncTimeout = setTimeout(() => setSyncState("idle"), 3500);
			} else {
				setSyncState("idle");
			}
		};

		const handleOnline = () => {
			setIsOnline(true);
			syncOfflineChanges();
		};
		const handleOffline = () => {
			setIsOnline(false);
			setSyncState("idle");
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		syncOfflineChanges();

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
			if (syncTimeout) clearTimeout(syncTimeout);
		};
	}, [queryClient]);

	const installApp = async () => {
		if (!installPrompt) return;

		await installPrompt.prompt();
		const choice = await installPrompt.userChoice;

		if (choice.outcome === "accepted") {
			setInstallPrompt(null);
		}
	};

	const dismissInstallHint = () => {
		window.localStorage.setItem(INSTALL_HINT_DISMISSED_KEY, "true");
		setIsInstallHintDismissed(true);
		setInstallPrompt(null);
	};

	const showInstallHint = Boolean(
		installPrompt && isOnline && !isInstallHintDismissed,
	);

	if (!showInstallHint && isOnline && syncState === "idle") return null;

	return (
		<StatusCard role="status" aria-live="polite">
			<StatusDot $isOnline={isOnline} />
			<StatusText>
				{!isOnline
					? "Offline mode: opened books and your library are available locally."
					: syncState === "syncing"
						? "Syncing your offline library changes..."
						: syncState === "synced"
							? "Offline changes synced with Litreasure."
							: "Install Litreasure to keep your books close."}
			</StatusText>
			{showInstallHint ? (
				<InstallButton type="button" onClick={installApp}>
					Install
				</InstallButton>
			) : null}
			{showInstallHint ? (
				<CloseButton
					aria-label="Close PWA install hint"
					type="button"
					onClick={dismissInstallHint}
				>
					×
				</CloseButton>
			) : null}
		</StatusCard>
	);
};

export default PwaStatus;

const StatusCard = styled.div`
	position: fixed;
	right: 1rem;
	left: auto;
	bottom: calc(1rem + env(safe-area-inset-bottom));
	z-index: 1500;
	display: flex;
	width: min(28rem, calc(100vw - 2rem));
	align-items: center;
	gap: 0.7rem;
	border: 0.0625rem solid rgb(238 179 141 / 0.46);
	border-radius: 999px;
	background: rgb(242 239 237 / 0.94);
	box-shadow: 0 1rem 2.5rem rgb(4 18 26 / 0.16);
	padding: 0.65rem 0.75rem;
	backdrop-filter: blur(16px);

	@media (max-width: ${theme.rubberSize.tablet}) {
		left: 0.75rem;
		right: 0.75rem;
		bottom: calc(5.45rem + env(safe-area-inset-bottom));
		width: auto;
		align-items: flex-start;
		border-radius: 1rem;
	}
`;

const StatusDot = styled.span<{ $isOnline: boolean }>`
	width: 0.65rem;
	height: 0.65rem;
	flex: 0 0 auto;
	border-radius: 50%;
	background: ${({ $isOnline }) =>
		$isOnline ? theme.colors.orangePrimary : theme.colors.bluePrimary};
	box-shadow: 0 0 0 0.35rem
		${({ $isOnline }) =>
			$isOnline ? "rgb(254 127 45 / 0.14)" : "rgb(35 61 77 / 0.14)"};
`;

const StatusText = styled.span`
	min-width: 0;
	flex: 1 1 auto;
	color: ${theme.colors.foreground};
	font-size: 0.86rem;
	line-height: 1.35;
	word-break: break-word;
`;

const InstallButton = styled.button`
	flex: 0 0 auto;
	border: 0;
	border-radius: 999px;
	background: ${theme.colors.bluePrimary};
	padding: 0.5rem 0.75rem;
	color: ${theme.colors.invertedText};
	cursor: pointer;
	font: inherit;
	font-size: 0.82rem;
	font-weight: 700;

	&:hover,
	&:focus-visible {
		background: ${theme.colors.orangeDark};
		outline: none;
	}
`;

const CloseButton = styled.button`
	display: inline-flex;
	width: 1.8rem;
	height: 1.8rem;
	flex: 0 0 auto;
	align-items: center;
	justify-content: center;
	border: 0;
	border-radius: 50%;
	background: rgb(35 61 77 / 0.08);
	color: ${theme.colors.bluePrimary};
	cursor: pointer;
	font: inherit;
	font-size: 1rem;
	font-weight: 700;
	line-height: 1;

	&:hover,
	&:focus-visible {
		background: rgb(212 100 28 / 0.14);
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;
