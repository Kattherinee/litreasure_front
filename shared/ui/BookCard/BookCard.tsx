"use client";

import BookmarkIcon from "@mui/icons-material/Bookmark";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import ReplayIcon from "@mui/icons-material/Replay";
import CheckIcon from "@mui/icons-material/Check";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import type { KeyboardEvent, MouseEvent, SyntheticEvent } from "react";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

import type { IAuthorShort, IBookSeriesRelationType } from "@/shared/api/books";
import {
	type IUserBookStatus,
	useUpdateBookTrackingMutation,
} from "@/shared/api/user-books";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import { PlusIcon } from "@/shared/ui/PlusIcon";
import { CoverPlaceholder } from "@/shared/ui/Skeleton";

const statusLabels: Record<IUserBookStatus, string> = {
	dropped: "Dropped",
	finished: "Finished",
	paused: "Paused",
	planned: "Planned",
	reading: "Reading",
	rereading: "Rereading",
};

const statusBadgeColors: Record<IUserBookStatus, string> = {
	planned: "#fe7f2d",
	reading: "#3d8b37",
	finished: "#1b5e20",
	paused: "#546e7a",
	rereading: "#6a1b9a",
	dropped: "#b34034",
};

const getStatusIcon = (status: IUserBookStatus) => {
	switch (status) {
		case "planned":
			return <BookmarkIcon aria-hidden="true" />;
		case "reading":
			return <AutoStoriesIcon aria-hidden="true" />;
		case "finished":
			return <CheckCircleIcon aria-hidden="true" />;
		case "paused":
			return <PauseCircleIcon aria-hidden="true" />;
		case "rereading":
			return <ReplayIcon aria-hidden="true" />;
		case "dropped":
			return <CancelIcon aria-hidden="true" />;
	}
};

const bookStatuses: Array<{ id: IUserBookStatus; label: string }> = [
	{ id: "planned", label: statusLabels.planned },
	{ id: "reading", label: statusLabels.reading },
	{ id: "finished", label: statusLabels.finished },
	{ id: "paused", label: statusLabels.paused },
	{ id: "rereading", label: statusLabels.rereading },
	{ id: "dropped", label: statusLabels.dropped },
];

const finePointer = "@media (hover: hover) and (pointer: fine)";
const getFallbackCoverWidthBySize = (size: IBookCardSize) =>
	size === "tiny" ? "6.15rem" : size === "compact" ? "6.9rem" : "10rem";

export interface IBookCardData {
	id: string;
	title: string;
	author?: string;
	authorId?: string;
	authors?: IAuthorShort[];
	coverUrl?: string;
	orderInSeries?: number;
	relationType?: IBookSeriesRelationType;
	seriesBookCount?: number;
	seriesLabel?: string;
	seriesTotal?: number;
	isTracked?: boolean;
	myStatus?: IUserBookStatus | null;
}

export type IBookCardSize = "default" | "compact" | "tiny";

interface IBookCardProps {
	book: IBookCardData;
	isActive?: boolean;
	showStatusBadge?: boolean;
	size?: IBookCardSize;
}

const BookCard = ({
	book,
	isActive = false,
	showStatusBadge = true,
	size = "compact",
}: IBookCardProps) => {
	const {
		author,
		authorId,
		authors,
		coverUrl,
		isTracked,
		myStatus,
		orderInSeries,
		relationType,
		seriesBookCount,
		seriesLabel,
		seriesTotal,
		title,
	} = book;
	const primaryAuthor = authors?.[0];
	const authorName = author ?? primaryAuthor?.name ?? "";
	const resolvedAuthorId = authorId ?? primaryAuthor?.id;
	const seriesBadgeLabel = getSeriesBadgeLabel({
		orderInSeries,
		relationType,
		seriesLabel,
		seriesTotal: seriesTotal ?? seriesBookCount,
	});
	const coverSrc = coverUrl?.trim() ? coverUrl : "/images/book-placeholder.svg";
	const [coverWidth, setCoverWidth] = useState<number | null>(null);
	const [loadedCoverSrc, setLoadedCoverSrc] = useState("");
	const router = useRouter();
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const updateTrackingMutation = useUpdateBookTrackingMutation();
	const [addStatus, setAddStatus] = useState("");
	const [localStatus, setLocalStatus] = useState<IUserBookStatus | null>(
		myStatus ?? null,
	);
	const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
	const actionRef = useRef<HTMLDivElement | null>(null);
	const menuRef = useRef<HTMLDivElement | null>(null);
	const [menuPosition, setMenuPosition] = useState<{
		left: number;
		top: number;
	} | null>(null);
	const isCoverLoaded = loadedCoverSrc === coverSrc;
	const isBookTracked = Boolean(isTracked || localStatus);
	const currentStatusLabel = localStatus ? statusLabels[localStatus] : "Saved";

	useEffect(() => {
		if (!addStatus) return;

		const timeoutId = window.setTimeout(() => {
			setAddStatus("");
		}, 2200);

		return () => window.clearTimeout(timeoutId);
	}, [addStatus]);

	useEffect(() => {
		if (!isStatusMenuOpen) {
			return;
		}

		const updateMenuPosition = () => {
			const action = actionRef.current;

			if (!action) {
				return;
			}

			const rect = action.getBoundingClientRect();
			const menuWidth = 150;
			const menuHeight = 286;
			const maxLeft = Math.max(8, window.innerWidth - menuWidth - 8);
			const belowTop = rect.bottom + 6;
			const aboveTop = rect.top - menuHeight - 6;
			const maxTop = Math.max(8, window.innerHeight - menuHeight - 8);
			const top =
				belowTop + menuHeight <= window.innerHeight - 8
					? belowTop
					: Math.max(8, Math.min(aboveTop, maxTop));

			setMenuPosition({
				left: Math.min(Math.max(8, rect.right - menuWidth), maxLeft),
				top,
			});
		};

		updateMenuPosition();

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;

			if (!(target instanceof Node)) {
				return;
			}

			if (
				actionRef.current?.contains(target) ||
				menuRef.current?.contains(target)
			) {
				return;
			}

			setIsStatusMenuOpen(false);
		};

		const handleKeyDown = (event: globalThis.KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsStatusMenuOpen(false);
			}
		};

		window.addEventListener("resize", updateMenuPosition);
		window.addEventListener("scroll", updateMenuPosition, true);
		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("resize", updateMenuPosition);
			window.removeEventListener("scroll", updateMenuPosition, true);
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isStatusMenuOpen]);

	const openBookPage = () => {
		router.push(`/books/${book.id}`, { scroll: true });
	};

	const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		if (event.key !== "Enter" && event.key !== " ") {
			return;
		}

		event.preventDefault();
		openBookPage();
	};

	const saveStatus = async (status: IUserBookStatus) => {
		setAddStatus("");
		setIsStatusMenuOpen(false);

		if (!isAuthenticated) {
			router.push("/auth/login");
			return;
		}

		try {
			const nextTracking = await updateTrackingMutation.mutateAsync({
				bookId: book.id,
				payload: {
					isRereading: false,
					readCount: 0,
					status,
				},
			});
			setLocalStatus(nextTracking.status);
			setAddStatus(`Status: ${statusLabels[nextTracking.status]}`);
		} catch (error) {
			setAddStatus(
				error instanceof Error ? error.message : "Could not add the book",
			);
		}
	};

	const handleAddButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();

		if (isBookTracked) {
			setIsStatusMenuOpen((current) => !current);
			return;
		}

		void saveStatus("planned");
	};

	const handleStatusMenuButtonClick = (
		event: MouseEvent<HTMLButtonElement>,
	) => {
		event.stopPropagation();
		setIsStatusMenuOpen((current) => !current);
	};

	const handleAddButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
		event.stopPropagation();
	};

	const stopNestedNavigation = (
		event: MouseEvent<HTMLAnchorElement> | KeyboardEvent<HTMLAnchorElement>,
	) => {
		event.stopPropagation();
	};

	const handleCoverLoad = (event: SyntheticEvent<HTMLImageElement>) => {
		const image = event.currentTarget;

		if (!image.naturalWidth || !image.naturalHeight) {
			return;
		}

		setCoverWidth(
			(image.naturalWidth / image.naturalHeight) * image.clientHeight,
		);
		setLoadedCoverSrc(coverSrc);
	};

	return (
		<BookCardWrapper
			$isActive={isActive}
			$size={size}
			aria-label={`${title}, ${authorName}`}
			aria-current={isActive ? "page" : undefined}
			role="link"
			tabIndex={0}
			onClick={openBookPage}
			onKeyDown={handleCardKeyDown}
		>
			<BookCover $coverWidth={coverWidth} $size={size}>
				{isCoverLoaded ? null : <CoverPlaceholder aria-hidden="true" />}
				{isBookTracked && showStatusBadge ? (
					<StatusBadge
						$color={
							localStatus
								? statusBadgeColors[localStatus]
								: statusBadgeColors.planned
						}
						aria-label={localStatus ? statusLabels[localStatus] : "In library"}
					>
						{localStatus ? (
							getStatusIcon(localStatus)
						) : (
							<BookmarkIcon aria-hidden="true" />
						)}
					</StatusBadge>
				) : null}
				<BookCoverImage
					$isLoaded={isCoverLoaded}
					src={coverSrc}
					alt={`Cover of ${title}`}
					decoding="async"
					loading="lazy"
					onLoad={handleCoverLoad}
				/>

				<CardLibraryAction ref={actionRef} $isTracked={isBookTracked}>
					<BookAddButton
						$isTracked={isBookTracked}
						type="button"
						aria-expanded={isBookTracked ? isStatusMenuOpen : undefined}
						aria-haspopup={isBookTracked ? "menu" : undefined}
						aria-label={
							isBookTracked ? "Change book status" : "Add to library as planned"
						}
						disabled={updateTrackingMutation.isPending}
						onClick={handleAddButtonClick}
						onKeyDown={handleAddButtonKeyDown}
					>
						{isBookTracked ? (
							<>
								<span>{currentStatusLabel}</span>
								<KeyboardArrowDownIcon aria-hidden="true" />
							</>
						) : (
							<PlusIcon />
						)}
					</BookAddButton>
					{isBookTracked ? null : (
						<BookStatusMenuButton
							aria-expanded={isStatusMenuOpen}
							aria-label="Choose book status"
							disabled={updateTrackingMutation.isPending}
							type="button"
							onClick={handleStatusMenuButtonClick}
							onKeyDown={handleAddButtonKeyDown}
						>
							<KeyboardArrowDownIcon aria-hidden="true" />
						</BookStatusMenuButton>
					)}
					{isStatusMenuOpen && menuPosition
						? createPortal(
								<CardStatusMenu
									ref={menuRef}
									$left={menuPosition.left}
									$top={menuPosition.top}
									role="menu"
									onClick={(event) => event.stopPropagation()}
								>
									{bookStatuses.map((status) => (
										<CardStatusMenuItem
											key={status.id}
											$isActive={localStatus === status.id}
											role="menuitem"
											type="button"
											onClick={(event) => {
												event.stopPropagation();
												void saveStatus(status.id);
											}}
										>
											<span>{status.label}</span>
											{localStatus === status.id ? (
												<CheckIcon aria-hidden="true" />
											) : null}
										</CardStatusMenuItem>
									))}
								</CardStatusMenu>,
								document.body,
							)
						: null}
				</CardLibraryAction>
				{addStatus ? <AddStatus>{addStatus}</AddStatus> : null}
			</BookCover>

			<BookMeta $coverWidth={coverWidth} $size={size}>
				<BookTitle $size={size}>
					{seriesBadgeLabel ? (
						<SeriesTitlePrefix>{seriesBadgeLabel} · </SeriesTitlePrefix>
					) : null}
					{title}
				</BookTitle>
				{resolvedAuthorId ? (
					<BookAuthorLink
						$size={size}
						href={`/authors/${resolvedAuthorId}`}
						onClick={stopNestedNavigation}
						onKeyDown={stopNestedNavigation}
					>
						{authorName}
					</BookAuthorLink>
				) : (
					<BookAuthor $size={size}>{authorName}</BookAuthor>
				)}
			</BookMeta>
		</BookCardWrapper>
	);
};

export default BookCard;

const getSeriesBadgeLabel = ({
	orderInSeries,
	relationType,
	seriesLabel,
	seriesTotal,
}: {
	orderInSeries?: number;
	relationType?: IBookSeriesRelationType;
	seriesLabel?: string;
	seriesTotal?: number;
}) => {
	if (relationType === "spin_off") {
		return "spin-off";
	}

	if (relationType === "collection" || relationType === "omnibus") {
		return seriesLabel?.trim() || "bundle";
	}

	if (orderInSeries && orderInSeries > 0) {
		return seriesTotal && seriesTotal > 0
			? `${orderInSeries}/${seriesTotal}`
			: String(orderInSeries);
	}

	return null;
};

const BookCardWrapper = styled.article<{
	$isActive: boolean;
	$size: IBookCardSize;
}>`
	position: relative;
	display: flex;
	width: min-content;
	height: ${({ $size }) =>
		$size === "tiny"
			? "11.3rem"
			: $size === "compact"
				? "14.75rem"
				: "18.95rem"};
	max-width: 100%;
	flex-direction: column;
	gap: 0.5rem;
	overflow: hidden;
	background: ${theme.colors.transparent};
	box-shadow: none;
	color: ${theme.colors.foreground};
	cursor: pointer;
	transition: transform 220ms ease;
	align-items: flex-start;

	&:focus-visible {
		outline: 0.25rem solid ${theme.colors.orangeDark};
		outline-offset: 0.25rem;
	}

	&:focus-within {
		z-index: 30;
	}

	${finePointer} {
		&:hover {
			z-index: 30;
		}
	}

	@media (max-width: ${theme.rubberSize.tablet}) {
		gap: 0.35rem;
		height: 11.45rem;
	}
`;

const BookCover = styled.div<{
	$size: IBookCardSize;
	$coverWidth: number | null;
}>`
	position: relative;
	z-index: 2;
	flex: 0 0 auto;
	overflow: hidden;
	width: ${({ $size, $coverWidth }) =>
		$coverWidth ? `${$coverWidth}px` : getFallbackCoverWidthBySize($size)};
	height: ${({ $size }) =>
		$size === "tiny"
			? "8.6rem"
			: $size === "compact"
				? "11.45rem"
				: "15.25rem"};

	border-radius: 0.9rem;
	transition:
		border-color 220ms ease,
		box-shadow 220ms ease,
		height 220ms ease,
		transform 300ms ease;
	${BookCardWrapper}[aria-current="page"] & {
		border: 0.175rem solid ${theme.colors.orangeDark};
	}

	${BookCardWrapper}:focus-visible & {
		transform: scale(1.02);
	}

	${finePointer} {
		${BookCardWrapper}:hover &,
		${BookCardWrapper}:focus-visible & {
			transform: scale(1.02);
		}
	}
`;

const BookCoverImage = styled.img<{ $isLoaded: boolean }>`
	display: block;
	width: 100%;
	height: 100%;
	object-fit: contain;
	object-position: center;
	border-radius: 0.9rem;
	opacity: ${({ $isLoaded }) => ($isLoaded ? 1 : 0)};
	transition: opacity 220ms ease;
`;

const StatusBadge = styled.span<{ $color: string }>`
	position: absolute;
	top: 0.45rem;
	right: 0.45rem;
	z-index: 2;
	display: inline-flex;
	width: 1.6rem;
	height: 1.6rem;
	align-items: center;
	justify-content: center;
	border: 0.0625rem solid rgb(242 239 237 / 0.62);
	border-radius: 50%;
	background: rgb(242 239 237 / 0.9);
	box-shadow: 0 0.25rem 0.75rem rgb(4 18 26 / 0.16);
	color: ${({ $color }) => $color};

	& svg {
		width: 0.95rem;
		height: 0.95rem;
	}
`;

const BookMeta = styled.div<{
	$coverWidth: number | null;
	$size: IBookCardSize;
}>`
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	width: ${({ $size, $coverWidth }) =>
		$coverWidth ? `${$coverWidth}px` : getFallbackCoverWidthBySize($size)};
	height: ${({ $size }) =>
		$size === "tiny" ? "2.25rem" : $size === "compact" ? "2.8rem" : "3.2rem"};

	@media (max-width: ${theme.rubberSize.tablet}) {
		display: ${({ $size }) => ($size === "default" ? "flex" : "none")};
	}
`;

const BookTitle = styled.h2<{ $size: IBookCardSize }>`
	display: -webkit-box;
	overflow: hidden;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	margin-block: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: ${({ $size }) =>
		$size === "tiny"
			? "0.72rem"
			: $size === "compact"
				? "0.88rem"
				: "1.045rem"};
	font-weight: 500;
	line-height: ${({ $size }) =>
		$size === "tiny" ? "0.96rem" : $size === "compact" ? "1.06rem" : "1.55rem"};
	transition: color 220ms ease;
	overflow-wrap: anywhere;

	${BookCardWrapper}:focus-visible & {
		color: ${theme.colors.orangeDark};
	}

	${finePointer} {
		${BookCardWrapper}:hover &,
		${BookCardWrapper}:focus-visible & {
			color: ${theme.colors.orangeDark};
		}
	}
`;

const BookAuthor = styled.p<{ $size: IBookCardSize }>`
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	margin-block: 0;
	color: ${theme.colors.lightText};
	font-size: ${({ $size }) =>
		$size === "tiny" ? "0.62rem" : $size === "compact" ? "0.7rem" : "0.875rem"};
	line-height: 1.3334;
`;

const BookAuthorLink = styled(Link)<{ $size: IBookCardSize }>`
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	margin-block: 0;
	color: ${theme.colors.lightText};
	font-size: ${({ $size }) =>
		$size === "tiny" ? "0.62rem" : $size === "compact" ? "0.7rem" : "0.875rem"};
	line-height: 1.3334;
	text-decoration: none;

	${finePointer} {
		&:hover,
		&:focus-visible {
			color: ${theme.colors.orangeDark};
			outline: none;
			text-decoration: underline;
		}
	}
`;

const SeriesTitlePrefix = styled.span`
	color: ${theme.colors.orangeDark};
	font-family: ${theme.fonts.sans};
	font-size: 0.84em;
	font-weight: 700;
	text-transform: lowercase;
`;

const CardLibraryAction = styled.div<{ $isTracked: boolean }>`
	position: absolute;
	right: 0.5rem;
	bottom: 0.5rem;
	z-index: 40;
	display: inline-flex;
	align-items: center;
	opacity: 0;
	transform: translateY(0.25rem);
	transition:
		opacity 0.2s ease,
		transform 0.15s ease;

	@media (max-width: ${theme.rubberSize.tablet}) {
		display: none;
	}

	${BookCardWrapper}:focus-within & {
		opacity: 1;
		transform: translateY(0);
	}

	@media (hover: none), (pointer: coarse) {
		opacity: 1;
		transform: none;
	}

	${finePointer} {
		${BookCardWrapper}:hover &,
		${BookCardWrapper}:focus-within & {
			opacity: 1;
			transform: translateY(0);
		}
	}
`;

const CoverActionButton = styled.button`
	display: inline-flex;
	min-height: 1.72rem;
	align-items: center;
	justify-content: center;
	border: 0;
	cursor: pointer;
	font-family: ${theme.fonts.serif};
	font-size: 0.76rem;
	font-weight: 700;
	line-height: 1;
	transition:
		background 0.2s ease,
		color 0.2s ease;

	& svg {
		width: 1rem;
		height: 1rem;
	}

	& svg path {
		fill: currentColor;
		transition: fill 0.2s ease;
	}

	&:focus-visible {
		outline: none;
	}
`;

const BookAddButton = styled(CoverActionButton)<{ $isTracked: boolean }>`
	gap: 0.12rem;
	min-width: ${({ $isTracked }) => ($isTracked ? "4.8rem" : "1.72rem")};
	border-radius: ${({ $isTracked }) =>
		$isTracked ? "62.4375rem" : "62.4375rem 0 0 62.4375rem"};
	background: ${({ $isTracked }) =>
		$isTracked ? theme.colors.surface : theme.colors.orangeLight};
	padding: ${({ $isTracked }) => ($isTracked ? "0 0.42rem 0 0.56rem" : "0")};
	color: ${({ $isTracked }) =>
		$isTracked ? theme.colors.darkerOrangeLight : theme.colors.invertedText};

	${finePointer} {
		&:hover,
		&:focus-visible {
			background: ${({ $isTracked }) =>
				$isTracked ? theme.colors.orangeLight : theme.colors.surface};
			color: ${({ $isTracked }) =>
				$isTracked
					? theme.colors.invertedText
					: theme.colors.darkerOrangeLight};
		}
	}

	&[aria-expanded="true"] svg {
		transform: rotate(180deg);
	}
`;

const BookStatusMenuButton = styled(CoverActionButton)`
	width: 1.72rem;
	border-left: 0.0625rem solid rgb(242 239 237 / 0.46);
	border-radius: 0 62.4375rem 62.4375rem 0;
	background: ${theme.colors.orangeLight};
	padding: 0;
	color: ${theme.colors.invertedText};

	${finePointer} {
		&:hover,
		&:focus-visible {
			background: ${theme.colors.surface};
			color: ${theme.colors.darkerOrangeLight};
		}
	}

	&[aria-expanded="true"] svg {
		transform: rotate(180deg);
	}
`;

const CardStatusMenu = styled.div<{ $left: number; $top: number }>`
	position: fixed;
	left: ${({ $left }) => $left}px;
	top: ${({ $top }) => $top}px;
	z-index: 1000;
	display: grid;
	width: 9.4rem;
	overflow: hidden;
	border: 0.0625rem solid ${theme.colors.orangeLight};
	border-radius: 0.75rem;
	background: ${theme.colors.surface};
	box-shadow: 0 0.8rem 1.6rem rgb(4 18 26 / 0.18);
	padding: 0.25rem;
	text-align: left;
`;

const CardStatusMenuItem = styled.button<{ $isActive: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.45rem;
	border: 0;
	border-radius: 0.55rem;
	background: ${({ $isActive }) =>
		$isActive ? "rgb(218 142 91 / 0.16)" : "transparent"};
	padding: 0.5rem 0.55rem;
	color: ${({ $isActive }) =>
		$isActive ? theme.colors.orangeDark : theme.colors.foreground};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.78rem;
	font-weight: ${({ $isActive }) => ($isActive ? 700 : 500)};
	line-height: 1;

	& svg {
		width: 0.92rem;
		height: 0.92rem;
		color: ${theme.colors.orangeDark};
	}

	${finePointer} {
		&:hover,
		&:focus-visible {
			background: rgb(238 179 141 / 0.16);
			color: ${theme.colors.orangeDark};
			outline: none;
		}
	}
`;

const AddStatus = styled.span`
	position: absolute;
	right: 0.45rem;
	bottom: 2.65rem;
	z-index: 2;
	max-width: calc(100% - 0.9rem);
	overflow: hidden;
	border-radius: 999px;
	background: rgb(242 239 237 / 0.92);
	padding: 0.25rem 0.5rem;
	color: ${theme.colors.orangeDark};
	font-size: 0.68rem;
	font-weight: 700;
	line-height: 1;
	text-overflow: ellipsis;
	white-space: nowrap;
`;
