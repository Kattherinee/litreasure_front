"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import CollectionsBookmarkRoundedIcon from "@mui/icons-material/CollectionsBookmarkRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import Toolbar from "@mui/material/Toolbar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ComponentType } from "react";
import styled from "styled-components";

import AuthModal, { type IAuthModalMode } from "@/components/pages/AuthModal";
import { useGenresQuery } from "@/shared/api/genres";
import { LogoIcon } from "@/public/icons/logo";
import { getAvatarAssetUrl } from "@/shared/api/avatarsRepository";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import { BookSearch } from "@/shared/ui/BookSearch";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import {
	OPEN_PWA_INSTALL_PROMPT_EVENT,
	PWA_INSTALL_PROMPT_AVAILABLE_EVENT,
	PWA_INSTALL_PROMPT_SEEN_EVENT,
	shouldShowPwaInstallMenuHint,
} from "@/shared/ui/PwaInstallPrompt/PwaInstallPrompt";

const navItems = [
	{
		href: "/",
		label: "Home",
		match: (pathname: string) => pathname === "/",
	},
	{
		href: "/genres",
		hasGenresDropdown: true,
		label: "Genres",
		match: (pathname: string) => pathname.startsWith("/genres"),
	},
	{
		href: "/authors",
		label: "Authors",
		match: (pathname: string) => pathname.startsWith("/authors"),
	},
	{
		href: "/collections",
		label: "Collections",
		match: (pathname: string) => pathname.startsWith("/collections"),
	},
];

const profileItems = [
	{ href: "/treasures", label: "My Treasures" },
	{ href: "/book-challenge", label: "Book Challenge" },
];

const emptySubscribe = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
const AUTH_REQUIRED_MESSAGE = "Please sign in to perform this action.";
const finePointer = "@media (hover: hover) and (pointer: fine)";
const isAuthRequiredRedirect = () =>
	typeof window !== "undefined" &&
	new URLSearchParams(window.location.search).get("auth") === "required";
const isStandaloneMode = () =>
	typeof window !== "undefined" &&
	(window.matchMedia("(display-mode: standalone)").matches ||
		window.matchMedia("(display-mode: fullscreen)").matches ||
		window.matchMedia("(display-mode: minimal-ui)").matches ||
		Boolean(
			(window.navigator as Navigator & { standalone?: boolean }).standalone,
		));

const Header = () => {
	const pathname = usePathname();
	const router = useRouter();
	const isMounted = useSyncExternalStore(
		emptySubscribe,
		getClientSnapshot,
		getServerSnapshot,
	);

	const [authModalMode, setAuthModalMode] = useState<IAuthModalMode | null>(
		null,
	);
	const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
	const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isStandalonePwa, setIsStandalonePwa] = useState(() => isStandaloneMode());
	const [showPwaInstallHint, setShowPwaInstallHint] = useState(false);
	const mobileMenuRef = useRef<HTMLDivElement | null>(null);
	const session = useAuthStore((state) => state.session);
	const logout = useAuthStore((state) => state.logout);
	const { data: genres = [], isLoading: isGenresLoading } = useGenresQuery();
	const user = session?.user;
	const displayName = user?.name || user?.username || user?.email;
	const profileName = user?.name || user?.username || user?.email;
	const profileMeta = user?.username
		? `@${user.username}`
		: user?.email && user.email !== profileName
			? user.email
			: undefined;
	const avatarUrl = getAvatarAssetUrl(user?.avatarUrl);
	const isWelcomePage = pathname === "/welcome";
	const topGenres = [...genres]
		.slice(0, 30)
		.sort((a, b) => a.name.localeCompare(b.name, "en"));
	const showAuthRequiredModal = isMounted && !user && isAuthRequiredRedirect();
	const visibleAuthModalMode =
		authModalMode ?? (showAuthRequiredModal ? "login" : null);
	const authModalMessage = showAuthRequiredModal ? AUTH_REQUIRED_MESSAGE : "";
	const userNavItems = user
		? [
				{
					href: "/treasures",
					label: "My Treasures",
					match: (currentPathname: string) =>
						currentPathname.startsWith("/treasures"),
				},
			]
		: [];
	const visibleNavItems = [...navItems, ...userNavItems];
	const mobileNavItems: Array<{
		href: string;
		icon: MobileNavIcon;
		label: string;
		match: (currentPathname: string) => boolean;
	}> = user
		? [
				{
					href: "/",
					icon: HomeRoundedIcon,
					label: "Home",
					match: (currentPathname: string) => currentPathname === "/",
				},
				{
					href: "/search",
					icon: SearchRoundedIcon,
					label: "Search",
					match: (currentPathname: string) =>
						currentPathname.startsWith("/search"),
				},
				{
					href: "/treasures",
					icon: "/icons/logoSvg.svg",
					label: "My Treasures",
					match: (currentPathname: string) =>
						currentPathname.startsWith("/treasures"),
				},
			]
		: [
				{
					href: "/",
					icon: HomeRoundedIcon,
					label: "Home",
					match: (currentPathname: string) => currentPathname === "/",
				},
				{
					href: "/search",
					icon: SearchRoundedIcon,
					label: "Search",
					match: (currentPathname: string) =>
						currentPathname.startsWith("/search"),
				},
			];
	type MobileNavIcon = string | ComponentType<{ "aria-hidden"?: boolean }>;

	const closeProfileMenu = () => setIsProfileMenuOpen(false);
	const closeMobileMenu = () => setIsMobileMenuOpen(false);

	const toggleProfileMenu = () => setIsProfileMenuOpen((current) => !current);
	const toggleMobileMenu = () => setIsMobileMenuOpen((current) => !current);
	const openAuthModal = (mode: IAuthModalMode) => {
		setAuthModalMode(mode);

		closeProfileMenu();
		closeMobileMenu();
	};
	const closeAuthModal = () => {
		setAuthModalMode(null);

		if (isAuthRequiredRedirect()) {
			router.replace(pathname || "/", { scroll: false });
		}
	};
	const openLogoutConfirm = () => {
		setIsLogoutConfirmOpen(true);

		closeProfileMenu();
		closeMobileMenu();
	};
	const closeLogoutConfirm = () => setIsLogoutConfirmOpen(false);
	const confirmLogout = () => {
		logout();
		closeLogoutConfirm();
	};
	const openPwaInstallPrompt = () => {
		window.dispatchEvent(new Event(OPEN_PWA_INSTALL_PROMPT_EVENT));
		setShowPwaInstallHint(shouldShowPwaInstallMenuHint());
		closeProfileMenu();
		closeMobileMenu();
	};

	useEffect(() => {
		if (!isMobileMenuOpen) {
			return;
		}

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;

			if (!(target instanceof Node)) {
				return;
			}

			if (mobileMenuRef.current?.contains(target)) {
				return;
			}

			closeMobileMenu();
		};

		const handleKeyDown = (event: globalThis.KeyboardEvent) => {
			if (event.key === "Escape") {
				closeMobileMenu();
			}
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isMobileMenuOpen]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const standaloneMediaQuery = window.matchMedia("(display-mode: standalone)");
		const fullscreenMediaQuery = window.matchMedia("(display-mode: fullscreen)");
		const minimalUiMediaQuery = window.matchMedia("(display-mode: minimal-ui)");

		const handleEnvironmentChange = () => {
			setIsStandalonePwa(isStandaloneMode());
			setShowPwaInstallHint(shouldShowPwaInstallMenuHint());
		};

		const handlePromptSeen = () => {
			setShowPwaInstallHint(shouldShowPwaInstallMenuHint());
		};

		const handlePromptAvailable = () => {
			setShowPwaInstallHint(shouldShowPwaInstallMenuHint());
		};

		handleEnvironmentChange();
		standaloneMediaQuery.addEventListener("change", handleEnvironmentChange);
		fullscreenMediaQuery.addEventListener("change", handleEnvironmentChange);
		minimalUiMediaQuery.addEventListener("change", handleEnvironmentChange);
		window.addEventListener("pageshow", handleEnvironmentChange);
		window.addEventListener(PWA_INSTALL_PROMPT_SEEN_EVENT, handlePromptSeen);
		window.addEventListener(
			PWA_INSTALL_PROMPT_AVAILABLE_EVENT,
			handlePromptAvailable,
		);

		return () => {
			standaloneMediaQuery.removeEventListener(
				"change",
				handleEnvironmentChange,
			);
			fullscreenMediaQuery.removeEventListener(
				"change",
				handleEnvironmentChange,
			);
			minimalUiMediaQuery.removeEventListener(
				"change",
				handleEnvironmentChange,
			);
			window.removeEventListener("pageshow", handleEnvironmentChange);
			window.removeEventListener(PWA_INSTALL_PROMPT_SEEN_EVENT, handlePromptSeen);
			window.removeEventListener(
				PWA_INSTALL_PROMPT_AVAILABLE_EVENT,
				handlePromptAvailable,
			);
		};
	}, []);

	if (isWelcomePage) {
		return null;
	}

	if (!isMounted) {
		return (
			<header
				aria-hidden="true"
				style={{ height: 100, background: theme.colors.bluePrimary }}
			/>
		);
	}

	return (
		<>
			<HeaderBar position="sticky" elevation={0}>
					<HeaderToolbar>
					<BrandLink prefetch={false} href="/" aria-label="Litreasure home">
						<LogoMark>
							<LogoIcon />
						</LogoMark>
						<BrandText>litreasure</BrandText>
					</BrandLink>

					<DesktopNav id="main-navigation" aria-label="Main navigation">
						{visibleNavItems.map((item) => (
								<NavItem key={item.label}>
								<NavButton
									prefetch={false}
									href={item.href}
									$isActive={item.match(pathname)}
								>
									{item.label}
								</NavButton>
								{"hasGenresDropdown" in item && item.hasGenresDropdown ? (
									<GenresDropdown>
										<GenresDropdownInner>
											<GenresDropdownTitle>Top 30 Genres</GenresDropdownTitle>
											<GenresList>
												{isGenresLoading
													? Array.from({ length: 10 }, (_, index) => (
															<GenreSkeleton key={index} />
														))
													: topGenres.map((genre) => (
														<GenreDropdownLink
															key={genre.id}
															prefetch={false}
															href={`/genres/${genre.slug}`}
														>
																{genre.name}
															</GenreDropdownLink>
														))}
											</GenresList>
										</GenresDropdownInner>
										<GenresDropdownFooter>
											<ViewAllGenresButton
												buttonType="containedInverted"
												href="/genres"
											>
												View all
											</ViewAllGenresButton>
										</GenresDropdownFooter>
									</GenresDropdown>
								) : null}
							</NavItem>
						))}
					</DesktopNav>

					<BookSearch />

					<AuthActions>
						{user ? (
							<ProfileMenuContainer
								onBlur={(event) => {
									if (!event.currentTarget.contains(event.relatedTarget)) {
										closeProfileMenu();
									}
								}}
							>
								<UserChip
									aria-controls="profile-navigation"
									aria-expanded={isProfileMenuOpen}
									title={displayName}
									type="button"
									onClick={toggleProfileMenu}
								>
									<Avatar $avatarUrl={avatarUrl}>
										{avatarUrl ? null : getInitials(displayName)}
									</Avatar>
								</UserChip>
								<ProfileMenu
									id="profile-navigation"
									aria-hidden={!isProfileMenuOpen}
									$isOpen={isProfileMenuOpen}
									aria-label="Profile menu"
								>
									<ProfileMenuUser>
										<ProfileMenuName>{profileName}</ProfileMenuName>
										{profileMeta ? (
											<ProfileMenuEmail>{profileMeta}</ProfileMenuEmail>
										) : null}
									</ProfileMenuUser>
									{profileItems.map((item) =>
										item.href ? (
											<ProfileMenuLink
												key={item.label}
												prefetch={false}
												href={item.href}
												onClick={closeProfileMenu}
											>
												{item.label}
											</ProfileMenuLink>
										) : (
											<ProfileMenuItem
												key={item.label}
												type="button"
												onClick={closeProfileMenu}
											>
												{item.label}
											</ProfileMenuItem>
										),
									)}
									<ProfileMenuLink
										prefetch={false}
										href="/profile"
										onClick={closeProfileMenu}
									>
										Profile
										<ProfileMenuHint>Edit</ProfileMenuHint>
									</ProfileMenuLink>
									{showPwaInstallHint && !isStandalonePwa ? (
										<InstallPromptMenuButton
											type="button"
											onClick={openPwaInstallPrompt}
										>
											<InstallPromptTitle>
												Still haven&apos;t installed the app?
											</InstallPromptTitle>
											<InstallPromptHint>
												Open the PWA install tip
											</InstallPromptHint>
										</InstallPromptMenuButton>
									) : null}
									<ProfileMenuDivider />
									<ProfileLogoutItem type="button" onClick={openLogoutConfirm}>
										Log out
									</ProfileLogoutItem>
								</ProfileMenu>
							</ProfileMenuContainer>
						) : (
							<>
								<AuthButton
									type="button"
									buttonType="text"
									onClick={() => openAuthModal("register")}
								>
									Sign up
								</AuthButton>
								<AuthButton
									type="button"
									buttonType="contained"
									onClick={() => openAuthModal("login")}
								>
									Log in
								</AuthButton>
							</>
						)}
					</AuthActions>
				</HeaderToolbar>
			</HeaderBar>
			<MobileNavigation aria-label="Primary navigation">
				{mobileNavItems.map((item) => {
					const Icon = item.icon;

					return (
						<MobileNavLink
							key={item.label}
							prefetch={false}
							href={item.href}
							$isActive={item.match(pathname)}
							aria-current={item.match(pathname) ? "page" : undefined}
							aria-label={item.label}
							title={item.label}
							onClick={closeMobileMenu}
						>
							{typeof Icon === "string" ? (
								<MobileMenuIcon src={Icon} alt="" aria-hidden />
							) : (
								<Icon aria-hidden />
							)}
						</MobileNavLink>
					);
				})}
				<MobileMenuContainer ref={mobileMenuRef}>
					<MobileMenuButton
						aria-expanded={isMobileMenuOpen}
						aria-haspopup="menu"
						aria-label="More options"
						title="More"
						type="button"
						onClick={toggleMobileMenu}
					>
						<MoreHorizRoundedIcon aria-hidden="true" />
					</MobileMenuButton>
					{isMobileMenuOpen ? (
						<MobileMenuPanel aria-label="More navigation">
							{user ? (
								<MobileMenuUser>
									<ProfileMenuName>{profileName}</ProfileMenuName>
									{profileMeta ? (
										<ProfileMenuEmail>{profileMeta}</ProfileMenuEmail>
									) : null}
								</MobileMenuUser>
							) : null}
							{user ? (
								<>
									<MobileMenuLink
										prefetch={false}
										href="/genres"
										onClick={closeMobileMenu}
									>
										<CategoryRoundedIcon aria-hidden="true" />
										<span>Genres</span>
									</MobileMenuLink>
									<MobileMenuLink
										prefetch={false}
										href="/authors"
										onClick={closeMobileMenu}
									>
										<PeopleRoundedIcon aria-hidden="true" />
										<span>Authors</span>
									</MobileMenuLink>
									<MobileMenuLink
										prefetch={false}
										href="/collections"
										onClick={closeMobileMenu}
									>
										<CollectionsBookmarkRoundedIcon aria-hidden="true" />
										<span>Collections</span>
									</MobileMenuLink>
									<MobileMenuLink
										prefetch={false}
										href="/treasures"
										onClick={closeMobileMenu}
									>
										<MobileTreasuresIcon aria-hidden="true" />
										<span>My Treasures</span>
									</MobileMenuLink>
									<MobileMenuLink
										prefetch={false}
										href="/book-challenge"
										onClick={closeMobileMenu}
									>
										<ConfirmationNumberRoundedIcon aria-hidden="true" />
										<span>Book Challenge</span>
									</MobileMenuLink>
									<MobileMenuLink
										prefetch={false}
										href="/profile"
										onClick={closeMobileMenu}
									>
										<PersonRoundedIcon aria-hidden="true" />
										<span>Profile</span>
									</MobileMenuLink>
									{showPwaInstallHint && !isStandalonePwa ? (
										<InstallPromptMobileAction
											type="button"
											onClick={openPwaInstallPrompt}
										>
											<span>Still haven&apos;t installed the app?</span>
											<InstallPromptHint>
												Open the PWA install tip
											</InstallPromptHint>
										</InstallPromptMobileAction>
									) : null}
									<MobileMenuDivider />
									<MobileMenuAction type="button" onClick={openLogoutConfirm}>
										<LogoutRoundedIcon aria-hidden="true" />
										<span>Log out</span>
									</MobileMenuAction>
								</>
							) : (
								<>
									<MobileMenuLink
										prefetch={false}
										href="/genres"
										onClick={closeMobileMenu}
									>
										<CategoryRoundedIcon aria-hidden="true" />
										<span>Genres</span>
									</MobileMenuLink>
									<MobileMenuLink
										prefetch={false}
										href="/authors"
										onClick={closeMobileMenu}
									>
										<PeopleRoundedIcon aria-hidden="true" />
										<span>Authors</span>
									</MobileMenuLink>
									<MobileMenuLink
										prefetch={false}
										href="/collections"
										onClick={closeMobileMenu}
									>
										<CollectionsBookmarkRoundedIcon aria-hidden="true" />
										<span>Collections</span>
									</MobileMenuLink>
									{showPwaInstallHint && !isStandalonePwa ? (
										<InstallPromptMobileAction
											type="button"
											onClick={openPwaInstallPrompt}
										>
											<span>Still haven&apos;t installed the app?</span>
											<InstallPromptHint>
												Open the PWA install tip
											</InstallPromptHint>
										</InstallPromptMobileAction>
									) : null}
									<MobileMenuDivider />
									<MobileMenuAction
										type="button"
										onClick={() => openAuthModal("register")}
									>
										<PersonRoundedIcon aria-hidden="true" />
										<span>Sign up</span>
									</MobileMenuAction>
									<MobileMenuAction
										type="button"
										onClick={() => openAuthModal("login")}
									>
										<LoginRoundedIcon aria-hidden="true" />
										<span>Log in</span>
									</MobileMenuAction>
								</>
							)}
						</MobileMenuPanel>
					) : null}
				</MobileMenuContainer>
			</MobileNavigation>
			{visibleAuthModalMode ? (
				<AuthModal
					mode={visibleAuthModalMode}
					message={authModalMessage}
					onClose={closeAuthModal}
					onModeChange={setAuthModalMode}
				/>
			) : null}
			{isLogoutConfirmOpen ? (
				<ConfirmModal
					confirmLabel="Log out"
					title="Log out of your profile?"
					onCancel={closeLogoutConfirm}
					onConfirm={confirmLogout}
				>
					You can return to your account by signing in again.
				</ConfirmModal>
			) : null}
		</>
	);
};

export default Header;

const getInitials = (value?: string) => {
	if (!value) {
		return "L";
	}

	return value
		.split(/[\s._-]+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");
};

const HeaderBar = styled(AppBar)`
	&& {
		background: ${theme.colors.bluePrimary};
		color: ${theme.colors.invertedText};
		overflow: visible;

		@media (max-width: ${theme.rubberSize.tablet}) {
			display: none;
		}
	}
`;

const MobileNavigation = styled.nav`
	display: none;

	@media (max-width: ${theme.rubberSize.tablet}) {
		position: fixed;
		right: 0;
		bottom: 0;
		left: 0;
		z-index: 1300;
		display: flex;
		align-items: center;
		justify-content: space-around;
		gap: 0.2rem;
		width: 100vw;
		border-top: 0.0625rem solid rgb(242 239 237 / 0.14);
		border-radius: 1.1rem 1.1rem 0 0;
		background: rgb(35 61 77 / 0.92);
		backdrop-filter: blur(18px) saturate(1.35);
		padding: 0.4rem 0.6rem calc(0.35rem + env(safe-area-inset-bottom));
		box-shadow: 0 -0.85rem 2rem rgb(4 18 26 / 0.16);
	}
`;

const MobileNavLink = styled(Link)<{ $isActive: boolean }>`
	display: inline-flex;
	width: 3rem;
	height: 3rem;
	flex: 0 0 auto;
	align-items: center;
	justify-content: center;
	border-radius: 999px;
	color: ${({ $isActive }) =>
		$isActive ? theme.colors.orangeLight : theme.colors.invertedText};
	text-decoration: none;
	transition:
		background 180ms ease,
		color 180ms ease,
		transform 180ms ease;

	& svg {
		width: 1.48rem;
		height: 1.48rem;
	}

	& img {
		width: 1.48rem;
		height: 1.48rem;
		display: block;
		object-fit: contain;
	}

	${finePointer} {
		&:hover,
		&:focus-visible {
			background: rgb(242 239 237 / 0.12);
			color: ${theme.colors.orangeLight};
			outline: none;
			transform: translateY(-0.0625rem);
		}
	}

	&[aria-current="page"] {
		background: rgb(242 239 237 / 0.08);
		box-shadow: inset 0 0 0 0.0625rem rgb(242 239 237 / 0.12);
	}
`;

const MobileMenuIcon = styled.img`
	width: 1.48rem;
	height: 1.48rem;
	display: block;
	object-fit: contain;
`;

const MobileMenuContainer = styled.div`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
`;

const MobileMenuButton = styled.button`
	display: inline-flex;
	width: 3rem;
	height: 3rem;
	flex: 0 0 auto;
	align-items: center;
	justify-content: center;
	border: 0;
	border-radius: 999px;
	background: transparent;
	color: ${theme.colors.invertedText};
	cursor: pointer;
	transition:
		background 180ms ease,
		color 180ms ease,
		transform 180ms ease;

	& svg {
		width: 1.48rem;
		height: 1.48rem;
	}

	&[aria-expanded="true"] {
		background: rgb(242 239 237 / 0.12);
		color: ${theme.colors.orangeLight};
	}

	${finePointer} {
		&:hover,
		&:focus-visible {
			background: rgb(242 239 237 / 0.12);
			color: ${theme.colors.orangeLight};
			outline: none;
			transform: translateY(-0.0625rem);
		}
	}
`;

const MobileMenuPanel = styled.div`
	position: fixed;
	right: 0.75rem;
	bottom: calc(4.85rem + env(safe-area-inset-bottom));
	z-index: 1301;
	display: flex;
	width: min(19rem, calc(100vw - 1.5rem));
	flex-direction: column;
	overflow: hidden;
	border: 0.0625rem solid rgb(238 179 141 / 0.32);
	border-radius: 1.25rem 1.25rem 1.5rem 1.5rem;
	background: ${theme.colors.background};
	box-shadow: 0 1.25rem 3rem rgb(4 18 26 / 0.24);
	padding: 0.5rem;
`;

const MobileMenuUser = styled.div`
	padding: 0.35rem 0.6rem 0.55rem;
`;

const MobileMenuLink = styled(Link)`
	display: flex;
	align-items: center;
	gap: 0.65rem;
	border-radius: 0.75rem;
	padding: 0.8rem 0.75rem;
	color: ${theme.colors.foreground};
	font: inherit;
	font-size: 0.95rem;
	font-weight: 600;
	text-decoration: none;

	& svg {
		width: 1.15rem;
		height: 1.15rem;
		color: ${theme.colors.orangeDark};
	}

	${finePointer} {
		&:hover,
		&:focus-visible {
			background: rgb(218 142 91 / 0.12);
			color: ${theme.colors.orangeDark};
			outline: none;
		}
	}
`;

const MobileTreasuresIcon = styled(LogoIcon)`
	width: 1.15rem;
	height: 1.15rem;
	flex: 0 0 auto;

	path {
		fill: ${theme.colors.orangeDark};
	}
`;

const MobileMenuAction = styled.button`
	display: flex;
	align-items: center;
	gap: 0.65rem;
	border: 0;
	border-radius: 0.75rem;
	background: transparent;
	padding: 0.8rem 0.75rem;
	color: ${theme.colors.foreground};
	font: inherit;
	font-size: 0.95rem;
	font-weight: 600;
	text-align: left;
	cursor: pointer;

	& svg {
		width: 1.15rem;
		height: 1.15rem;
		color: ${theme.colors.orangeDark};
	}

	${finePointer} {
		&:hover,
		&:focus-visible {
			background: rgb(218 142 91 / 0.12);
			color: ${theme.colors.orangeDark};
			outline: none;
		}
	}
`;

const MobileMenuDivider = styled.div`
	height: 0.0625rem;
	margin: 0.35rem 0.25rem;
	background: rgb(186 183 180 / 0.5);
`;

const HeaderToolbar = styled(Toolbar)`
	&& {
		position: relative;
		z-index: 2;
		display: flex;
		height: 4rem;
		align-items: center;
		gap: clamp(1.25rem, 3vw, 2.5rem);
		width: min(
			calc(100% - (${theme.layout.contentGutter} * 2)),
			${theme.layout.contentMaxWidth}
		);
		margin: 0 auto;
		padding: 0;

		@media (max-width: 56.25rem) {
			gap: 1rem;
		}

		@media (max-width: 40rem) {
			min-height: 4.625rem;
			flex-wrap: wrap;
			align-content: center;
			gap: 0.75rem;
			padding: 0.75rem 0;
		}
	}
`;

const BrandLink = styled.a`
	display: flex;
	align-items: center;
	flex-shrink: 0;
	gap: 0.85rem;
	color: inherit;
	text-decoration: none;
`;

const LogoMark = styled.span`
	display: inline-flex;
	width: 3rem;
	height: 3rem;
	flex: 0 0 3rem;
	align-items: center;
	justify-content: center;

	& svg {
		width: 100%;
		height: 100%;
		display: block;
	}
`;

const BrandText = styled.div`
	padding-top: 0.125rem;
	font-family: ${theme.fonts.serif};
	font-size: 20px;
	font-weight: 600;
	line-height: 32px;
	text-transform: uppercase;
`;

const DesktopNav = styled.nav`
	display: flex;
	align-items: center;
	gap: 8px;

	@media (max-width: 900px) {
		display: none;
	}
`;

const NavItem = styled.div`
	position: relative;
	display: inline-flex;
	align-items: center;

	&::after {
		position: absolute;
		top: 100%;
		right: -1.25rem;
		left: -1.25rem;
		height: 1.35rem;
		content: "";
	}

	&:hover > div,
	&:focus-within > div {
		opacity: 1;
		pointer-events: auto;
		transform: translate(-50%, 0);
	}
`;

const NavButton = styled(Link)<{ $active: boolean }>`
	position: relative;
	display: inline-flex;
	align-items: center;
	min-width: auto;
	border-radius: 0;
	padding: 1.25rem 0.9rem 1.35rem;
	color: ${({ $active }) =>
		$active ? theme.colors.orangeLight : theme.colors.invertedText};
	font: inherit;
	font-family: ${theme.fonts.sans};
	font-size: 1.14rem;
	line-height: 1.35rem;
	text-decoration: none;
	text-transform: none;
	transition: color 180ms ease;

	&::after {
		position: absolute;
		right: 0.7rem;
		bottom: -0.0625rem;
		left: 0.7rem;
		height: 0.1875rem;
		border-radius: 62.4375rem;
		background: ${theme.colors.orangeLight};
		content: "";
		opacity: ${({ $active }) => ($active ? 1 : 0)};
		transform: scaleX(${({ $active }) => ($active ? 1 : 0.45)});
		transform-origin: center;
		transition:
			opacity 180ms ease,
			transform 180ms ease;
	}

	&:hover,
	&:focus-visible {
		color: ${theme.colors.orangeLight};
		outline: none;
	}

	&:hover::after,
	&:focus-visible::after {
		opacity: 1;
		transform: scaleX(1);
	}
`;

const GenresDropdown = styled.div`
	position: absolute;
	top: calc(100% + 0.55rem);
	left: 50%;
	z-index: 20;
	display: flex;
	width: min(38rem, calc(100vw - 2rem));
	max-height: min(31rem, calc(100dvh - 7rem));
	flex-direction: column;
	transform: translateX(-50%);
	box-sizing: border-box;
	overflow: hidden;
	border: 0.0625rem solid rgb(242 239 237 / 0.18);
	border-radius: 1.25rem;
	background: ${theme.colors.background};
	box-shadow: 0 1.25rem 4rem rgb(4 18 26 / 0.32);
	opacity: 0;
	pointer-events: none;
	transform: translate(-50%, -0.4rem);
	transition:
		opacity 160ms ease,
		transform 180ms ease;

	&::before {
		position: absolute;
		top: -0.6rem;
		right: 0;
		left: 0;
		height: 0.6rem;
		content: "";
	}
`;

const GenresDropdownInner = styled.div`
	overflow-y: auto;
	padding: 1rem 1.25rem 5.4rem;
`;

const GenresDropdownTitle = styled.h2`
	margin: 0 0 0.75rem;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.15rem;
	font-weight: 500;
	line-height: 1.2;
`;

const GenresList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.55rem;
`;

const GenreDropdownLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	min-height: 2rem;
	border: 0.0625rem solid rgb(211 202 196 / 0.7);
	border-radius: 62.4375rem;
	background: ${theme.colors.surface};
	padding: 0.45rem 0.9rem;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.sans};
	font-size: 0.9rem;
	line-height: 1;
	text-decoration: none;
	white-space: nowrap;
	transition:
		border-color 160ms ease,
		color 160ms ease,
		transform 160ms ease;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		color: ${theme.colors.orangeDark};
		outline: none;
		transform: translateY(-0.0625rem);
	}
`;

const GenreSkeleton = styled.span`
	display: inline-flex;
	width: 5.6rem;
	height: 2rem;
	border-radius: 62.4375rem;
	background: linear-gradient(
		90deg,
		rgb(242 239 237 / 0.7),
		rgb(255 255 255 / 0.72),
		rgb(242 239 237 / 0.7)
	);
	background-size: 220% 100%;
	animation: genre-pulse 1.2s ease-in-out infinite;

	@keyframes genre-pulse {
		0% {
			background-position: 100% 50%;
		}

		100% {
			background-position: 0 50%;
		}
	}
`;

const GenresDropdownFooter = styled.div`
	position: absolute;
	right: 0;
	bottom: 0;
	left: 0;
	display: flex;
	justify-content: flex-end;
	border-top: 0.0625rem solid rgb(211 202 196 / 0.72);
	background:
		linear-gradient(
			180deg,
			rgb(232 226 222 / 0),
			${theme.colors.background} 26%
		),
		${theme.colors.background};
	padding: 1.1rem 1.25rem 1rem;
`;

const ViewAllGenresButton = styled(Button)`
	&& {
		padding: 0.6rem 1.25rem;
		font-family: ${theme.fonts.sans};
		font-size: 0.95rem;
	}
`;

const AuthActions = styled(Box)`
	position: relative;
	display: flex;
	align-items: center;
	gap: 12px;

	@media (max-width: 720px) {
		margin-left: auto;
	}

	@media (max-width: 520px) {
		display: none;
	}
`;

const AuthButton = styled(Button)``;

const ProfileMenuContainer = styled.div`
	position: relative;
`;

const UserChip = styled.button`
	display: inline-flex;
	align-items: center;
	min-width: 0;
	gap: 0.5rem;
	border: 0;
	border-radius: 999px;
	background: transparent;
	padding: 0.25rem 0.85rem 0.25rem 0.45rem;
	color: ${theme.colors.invertedText};
	cursor: pointer;

	&:hover,
	&:focus-visible {
		background: rgb(242 239 237 / 0.12);
		outline: none;
	}
`;

const Avatar = styled.span<{ $avatarUrl?: string }>`
	display: inline-flex;
	width: 2.7rem;
	height: 2.7rem;
	flex: 0 0 auto;
	align-items: center;
	justify-content: center;
	border: 0.0625rem solid rgb(242 239 237 / 0.36);
	border-radius: 50%;
	background: ${({ $avatarUrl }) =>
		$avatarUrl
			? `url("${$avatarUrl}") center / cover no-repeat`
			: theme.colors.orangeLight};
	color: ${theme.colors.bluePrimary};
	font-family: ${theme.fonts.sans};
	font-size: 0.8rem;
	font-weight: 700;
	line-height: 1;
`;

const ProfileMenu = styled.div<{ $isOpen: boolean }>`
	position: absolute;
	z-index: 4;
	top: calc(100% + 0.75rem);
	right: 0;
	width: 14rem;
	border: 0.0625rem solid rgb(238 179 141 / 0.65);
	border-radius: 0.875rem;
	background: #e8e2de;
	box-shadow: 0 1rem 2.5rem rgb(4 18 26 / 0.18);
	opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
	padding: 0.45rem;
	pointer-events: ${({ $isOpen }) => ($isOpen ? "auto" : "none")};
	transform: translateY(${({ $isOpen }) => ($isOpen ? "0" : "-0.4rem")});
	transition:
		opacity 160ms ease,
		transform 180ms ease;
`;

const ProfileMenuUser = styled.div`
	padding: 0.65rem 0.75rem 0.7rem;
`;

const ProfileMenuName = styled.div`
	overflow: hidden;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.05rem;
	font-weight: 600;
	line-height: 1.2;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const ProfileMenuEmail = styled.div`
	overflow: hidden;
	margin-top: 0.18rem;
	color: ${theme.colors.softForeground};
	font-size: 0.76rem;
	line-height: 1.2;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const ProfileMenuItem = styled.button`
	display: flex;
	width: 100%;
	flex-direction: column;
	align-items: flex-start;
	border: 0;
	border-radius: 0.625rem;
	background: transparent;
	padding: 0.65rem 0.75rem;
	color: #233d4d;
	font: inherit;
	font-size: 0.95rem;
	font-weight: 600;
	text-align: left;
	cursor: pointer;

	&:hover,
	&:focus-visible {
		background: rgb(218 142 91 / 0.12);
		color: #d4641c;
		outline: none;
	}
`;

const ProfileMenuLink = styled(Link)`
	display: flex;
	width: 100%;
	flex-direction: column;
	align-items: flex-start;
	border-radius: 0.625rem;
	padding: 0.65rem 0.75rem;
	color: #233d4d;
	font: inherit;
	font-size: 0.95rem;
	font-weight: 600;
	text-align: left;
	text-decoration: none;
	cursor: pointer;

	&:hover,
	&:focus-visible {
		background: rgb(218 142 91 / 0.12);
		color: #d4641c;
		outline: none;
	}
`;

const ProfileMenuHint = styled.span`
	margin-top: 0.15rem;
	color: ${theme.colors.softForeground};
	font-size: 0.75rem;
	font-weight: 400;
	line-height: 1.2;
`;

const ProfileMenuDivider = styled.div`
	height: 0.0625rem;
	margin: 0.35rem 0.25rem;
	background: rgb(186 183 180 / 0.5);
`;

const InstallPromptMenuButton = styled.button`
	display: flex;
	width: 100%;
	flex-direction: column;
	align-items: flex-start;
	border: 0.0625rem solid rgb(158 184 206 / 0.42);
	border-radius: 0.75rem;
	background: linear-gradient(
		180deg,
		rgb(233 240 247 / 0.96),
		rgb(243 246 249 / 0.98)
	);
	padding: 0.72rem 0.8rem;
	color: ${theme.colors.bluePrimary};
	font: inherit;
	text-align: left;
	cursor: pointer;

	&:hover,
	&:focus-visible {
		border-color: rgb(134 171 201 / 0.7);
		outline: none;
	}
`;

const InstallPromptTitle = styled.span`
	color: rgb(88 110 129);
	font-size: 0.92rem;
	font-weight: 700;
	line-height: 1.25;
`;

const InstallPromptHint = styled.span`
	margin-top: 0.2rem;
	color: rgb(105 141 170);
	font-size: 0.78rem;
	font-weight: 500;
	line-height: 1.25;
`;

const ProfileLogoutItem = styled(ProfileMenuItem)`
	color: #d4641c;

	&:hover,
	&:focus-visible {
		background: rgb(212 100 28 / 0.12);
		color: #b64f12;
	}
`;

const InstallPromptMobileAction = styled(MobileMenuAction)`
	flex-direction: column;
	align-items: flex-start;
	border: 0.0625rem solid rgb(158 184 206 / 0.34);
	background: linear-gradient(
		180deg,
		rgb(232 239 246 / 0.88),
		rgb(243 246 249 / 0.96)
	);
	color: rgb(88 110 129);

	span:first-child {
		color: inherit;
		font-size: 0.92rem;
		font-weight: 700;
		line-height: 1.25;
	}

	& svg {
		display: none;
	}

	${finePointer} {
		&:hover,
		&:focus-visible {
			background: linear-gradient(
				180deg,
				rgb(226 235 244 / 0.98),
				rgb(239 244 248 / 0.98)
			);
			color: rgb(70 99 122);
		}
	}
`;
