"use client";

import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

import { CreateBookModal } from "@/components/pages/my-books/CreateBookModal";
import type { IBook } from "@/shared/api/books";
import {
	useCreatePaperBookStateMutation,
	type IPaperBookStatus,
	useDeletePaperBookStateMutation,
	useUpdatePaperBookStateMutation,
} from "@/shared/api/paper-books";
import {
	type IUserBookStatus,
	useDeleteBookTrackingMutation,
	useUpdateBookTrackingMutation,
} from "@/shared/api/user-books";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import { AuthorAvatar } from "@/shared/ui/AuthorAvatar";
import { PaperNotePanel } from "@/shared/ui/PaperNotePanel";

import { BookCollectionModal } from "./BookCollectionModal";

const finePointer = "@media (hover: hover) and (pointer: fine)";

interface IBookDetailHeroProps {
	book: IBook;
	onAuthRequired?: () => void;
}

const statusLabels: Record<IUserBookStatus, string> = {
	dropped: "Dropped",
	finished: "Finished",
	paused: "Paused",
	planned: "Planned",
	reading: "Reading",
	rereading: "Rereading",
};

const bookStatuses: Array<{ id: IUserBookStatus; label: string }> = [
	{ id: "planned", label: statusLabels.planned },
	{ id: "reading", label: statusLabels.reading },
	{ id: "finished", label: statusLabels.finished },
	{ id: "paused", label: statusLabels.paused },
	{ id: "rereading", label: statusLabels.rereading },
	{ id: "dropped", label: statusLabels.dropped },
];

const paperBookStatusLabels: Record<IPaperBookStatus, string> = {
	given_away: "Given away",
	owned: "Owned",
	wanted_to_buy: "Wanted to buy",
};

const paperBookStatuses: Array<{ id: IPaperBookStatus; label: string }> = [
	{ id: "owned", label: paperBookStatusLabels.owned },
	{ id: "wanted_to_buy", label: paperBookStatusLabels.wanted_to_buy },
	{ id: "given_away", label: paperBookStatusLabels.given_away },
];

const BookDetailHero = ({ book, onAuthRequired }: IBookDetailHeroProps) => {
	const router = useRouter();
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const updateTrackingMutation = useUpdateBookTrackingMutation();
	const deleteTrackingMutation = useDeleteBookTrackingMutation();
	const createPaperBookMutation = useCreatePaperBookStateMutation();
	const updatePaperBookMutation = useUpdatePaperBookStateMutation();
	const deletePaperBookMutation = useDeletePaperBookStateMutation();
	const [trackingOverride, setTrackingOverride] = useState<
		IBook["myTracking"] | undefined
	>();
	const [paperBookOverride, setPaperBookOverride] = useState<
		IBook["myPaperBook"] | undefined
	>(() => book.myPaperBook ?? undefined);
	const [collectionIdsOverride, setCollectionIdsOverride] = useState<
		Set<string> | undefined
	>();
	const [trackingStatus, setTrackingStatus] = useState("");
	const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
	const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
	const [isPaperMenuOpen, setIsPaperMenuOpen] = useState(false);
	const [isPaperNoteOpen, setIsPaperNoteOpen] = useState(true);
	const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
	const [noteDraft, setNoteDraft] = useState("");
	const [isNoteExpanded, setIsNoteExpanded] = useState(false);
	const [hasClampedNoteOverflow, setHasClampedNoteOverflow] = useState(false);
	const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
	const [isEditBookOpen, setIsEditBookOpen] = useState(false);
	const closeMoreMenuTimer = useRef<number | null>(null);
	const noteTextRef = useRef<HTMLParagraphElement | null>(null);
	const seriesTag = getSeriesTag(book);
	const seriesHref = book.series?.id
		? `/series/${book.series.id}`
		: book.series?.seriesId
			? `/series/${book.series.seriesId}`
			: undefined;
	const primaryAuthor = book.authors?.[0];
	const authorName = primaryAuthor?.name ?? book.author;
	const authorPhotoUrl = primaryAuthor?.photoUrl;
	const trackingState =
		trackingOverride === undefined
			? (book.myTracking ?? null)
			: trackingOverride;
	const collectionIds =
		collectionIdsOverride ?? new Set(book.myCollectionIds ?? []);
	const paperBookState =
		paperBookOverride === undefined
			? (book.myPaperBook ?? null)
			: paperBookOverride;
	const paperBookStatus = paperBookState?.status;
	const paperBookNote = paperBookState?.note?.trim() ?? "";
	const hasPaperBook = Boolean(paperBookState);
	const hasPaperBookNote = paperBookNote.length > 0;
	const currentStatus = trackingState?.status;
	const isBookTracked = Boolean(currentStatus);
	const canShowPaperNote = isBookTracked || hasPaperBook;
	const currentStatusLabel = currentStatus
		? statusLabels[currentStatus]
		: "Add to library";
	const isTrackingPending =
		updateTrackingMutation.isPending || deleteTrackingMutation.isPending;
	const isPaperBookPending =
		createPaperBookMutation.isPending ||
		updatePaperBookMutation.isPending ||
		deletePaperBookMutation.isPending;
	const isActionPending = isTrackingPending || isPaperBookPending;
	const isAnyMenuOpen =
		isStatusMenuOpen || isMoreMenuOpen || isPaperMenuOpen || isPaperNoteOpen;
	const canEditBook = book.isPublic === false;

	useEffect(() => {
		return () => {
			if (closeMoreMenuTimer.current) {
				window.clearTimeout(closeMoreMenuTimer.current);
			}
		};
	}, []);

	useEffect(() => {
		if (!hasPaperBookNote) {
			return;
		}

		const measureOverflow = () => {
			const node = noteTextRef.current;
			if (!node) return;
			setHasClampedNoteOverflow(node.scrollHeight - node.clientHeight > 1);
		};

		measureOverflow();
		window.addEventListener("resize", measureOverflow);

		return () => {
			window.removeEventListener("resize", measureOverflow);
		};
	}, [hasPaperBookNote, paperBookNote]);

	const cancelCloseMoreMenu = () => {
		if (!closeMoreMenuTimer.current) {
			return;
		}

		window.clearTimeout(closeMoreMenuTimer.current);
		closeMoreMenuTimer.current = null;
	};

	const scheduleCloseMoreMenu = () => {
		cancelCloseMoreMenu();
		closeMoreMenuTimer.current = window.setTimeout(() => {
			setIsMoreMenuOpen(false);
			setIsPaperMenuOpen(false);
			setIsNoteEditorOpen(false);
		}, 160);
	};

	const saveStatus = async (status: IUserBookStatus) => {
		setTrackingStatus("");
		setIsStatusMenuOpen(false);

		if (!isAuthenticated) {
			onAuthRequired?.();
			return;
		}

		try {
			const nextTracking = await updateTrackingMutation.mutateAsync({
				bookId: book.id,
				payload: {
					currentPage: trackingState?.currentPage,
					isRereading: status === "rereading",
					readCount: trackingState?.readCount ?? 0,
					status,
				},
			});
			setTrackingOverride(nextTracking);
			setTrackingStatus(`Status: ${statusLabels[status]}`);
		} catch (error) {
			setTrackingStatus(
				error instanceof Error ? error.message : "Could not update the book.",
			);
		}
	};

	const handlePrimaryLibraryClick = () => {
		setIsMoreMenuOpen(false);
		setIsPaperMenuOpen(false);
		setIsNoteEditorOpen(false);

		if (isBookTracked) {
			setIsStatusMenuOpen((current) => !current);
			return;
		}

		void saveStatus("planned");
	};

	const handleRemoveFromLibrary = async () => {
		setTrackingStatus("");
		setIsStatusMenuOpen(false);

		if (!isAuthenticated) {
			onAuthRequired?.();
			return;
		}

		try {
			await deleteTrackingMutation.mutateAsync(book.id);
			setTrackingOverride(null);
			setTrackingStatus("Removed from library");
		} catch (error) {
			setTrackingStatus(
				error instanceof Error ? error.message : "Could not remove the book.",
			);
		}
	};

	const upsertPaperBook = async (payload: {
		status?: IPaperBookStatus;
		note?: string | null;
	}) => {
		setTrackingStatus("");

		if (!isAuthenticated) {
			onAuthRequired?.();
			return null;
		}

		const nextPaperBook = hasPaperBook
			? await updatePaperBookMutation.mutateAsync({
					bookId: book.id,
					payload,
				})
			: await createPaperBookMutation.mutateAsync({
					bookId: book.id,
					payload,
				});
		setPaperBookOverride(nextPaperBook);
		return nextPaperBook;
	};

	const handlePaperStatusSelect = async (status: IPaperBookStatus) => {
		try {
			await upsertPaperBook({
				note: paperBookState?.note ?? null,
				status,
			});
			setTrackingStatus(`Paper book: ${paperBookStatusLabels[status]}`);
			setIsMoreMenuOpen(false);
			setIsPaperMenuOpen(false);
			setIsNoteEditorOpen(false);
		} catch (error) {
			setTrackingStatus(
				error instanceof Error
					? error.message
					: "Could not update paper state.",
			);
		}
	};

	const handleSavePaperNote = async () => {
		if (!paperBookState?.status) {
			setTrackingStatus("Choose paper status first");
			return;
		}

		try {
			const nextPaperBook = await upsertPaperBook({
				note: noteDraft.trim(),
				status: paperBookState?.status,
			});

			if (!nextPaperBook) {
				return;
			}

			setTrackingStatus(
				noteDraft.trim() ? "Paper note saved" : "Paper note cleared",
			);
			setIsNoteEditorOpen(false);
		} catch (error) {
			setTrackingStatus(
				error instanceof Error ? error.message : "Could not save paper note.",
			);
		}
	};

	const handleRemovePaperBook = async () => {
		setTrackingStatus("");

		if (!isAuthenticated) {
			onAuthRequired?.();
			return;
		}

		try {
			await deletePaperBookMutation.mutateAsync(book.id);
			setPaperBookOverride(null);
			setNoteDraft("");
			setIsMoreMenuOpen(false);
			setIsPaperMenuOpen(false);
			setIsNoteEditorOpen(false);
			setTrackingStatus("Removed from paper books");
		} catch (error) {
			setTrackingStatus(
				error instanceof Error
					? error.message
					: "Could not remove paper state.",
			);
		}
	};

	const openPaperNoteEditor = () => {
		if (!paperBookState?.status) {
			setTrackingStatus("");
			setIsStatusMenuOpen(false);
			setIsMoreMenuOpen(true);
			setIsPaperMenuOpen(true);
			setIsNoteEditorOpen(false);
			return;
		}

		setNoteDraft(paperBookState?.note ?? "");
		setIsNoteEditorOpen(true);
		setIsMoreMenuOpen(false);
		setIsPaperMenuOpen(false);
	};

	const togglePaperNotePanel = () => {
		setIsPaperNoteOpen((current) => !current);
		setIsMoreMenuOpen(false);
		setIsPaperMenuOpen(false);
		setIsNoteEditorOpen(false);
	};

	const handleClearPaperNote = async () => {
		if (!paperBookState?.status) {
			setTrackingStatus("Choose paper status first");
			return;
		}

		setNoteDraft("");
		try {
			await upsertPaperBook({
				note: "",
				status: paperBookState.status,
			});
			setTrackingStatus("Paper note cleared");
		} catch (error) {
			setTrackingStatus(
				error instanceof Error ? error.message : "Could not clear paper note.",
			);
		}
	};

	const openCollectionModal = () => {
		if (!isAuthenticated) {
			onAuthRequired?.();
			return;
		}

		setIsCollectionModalOpen(true);
	};

	return (
		<HeaderBlock>
			{seriesTag && seriesHref ? (
				<DesktopSeriesTag>
					<SeriesTagLink href={seriesHref}>
						<SeriesTag>{seriesTag}</SeriesTag>
					</SeriesTagLink>
				</DesktopSeriesTag>
			) : null}
			<Title>
				<TitleText>{book.title}</TitleText>
				{canEditBook ? (
					<TitleEditButton
						aria-label="Edit book"
						type="button"
						onClick={() => setIsEditBookOpen(true)}
					>
						<EditOutlinedIcon aria-hidden="true" />
					</TitleEditButton>
				) : null}
				{currentStatus === "finished" ? (
					<FinishedMark aria-label="Finished">
						<CheckCircleOutlinedIcon aria-hidden="true" />
						<span>Finished</span>
					</FinishedMark>
				) : null}
			</Title>
			{primaryAuthor ? (
				<AuthorLink href={`/authors/${primaryAuthor.id}`}>
					<AuthorBy>by</AuthorBy>
					<AuthorAvatar
						fontSize="0.85rem"
						name={authorName}
						photoUrl={authorPhotoUrl}
						size="1.75rem"
					/>
					<AuthorName>{authorName}</AuthorName>
				</AuthorLink>
			) : (
				<Author>
					<AuthorBy>by</AuthorBy>
					<AuthorName>{authorName}</AuthorName>
				</Author>
			)}

			<ActionRow>
				<LibraryAction
					onBlur={(event) => {
						if (!event.currentTarget.contains(event.relatedTarget)) {
							setIsStatusMenuOpen(false);
						}
					}}
				>
					<LibraryMainButton
						$isTracked={isBookTracked}
						aria-expanded={isBookTracked ? isStatusMenuOpen : undefined}
						aria-haspopup={isBookTracked ? "menu" : undefined}
						disabled={isTrackingPending}
						type="button"
						onClick={handlePrimaryLibraryClick}
					>
						<span>{currentStatusLabel}</span>
						{isBookTracked ? (
							<KeyboardArrowDownIcon aria-hidden="true" />
						) : null}
					</LibraryMainButton>
					{isBookTracked ? null : (
						<LibraryMenuButton
							aria-expanded={isStatusMenuOpen}
							aria-label="Change book status"
							$isTracked={isBookTracked}
							disabled={isTrackingPending}
							type="button"
							onClick={() => setIsStatusMenuOpen((current) => !current)}
						>
							<KeyboardArrowDownIcon aria-hidden="true" />
						</LibraryMenuButton>
					)}
					{isStatusMenuOpen ? (
						<StatusMenu role="menu">
							{bookStatuses.map((status) => (
								<StatusMenuItem
									key={status.id}
									$isActive={currentStatus === status.id}
									role="menuitem"
									type="button"
									onClick={() => void saveStatus(status.id)}
								>
									<span>{status.label}</span>
									{currentStatus === status.id ? (
										<CheckIcon aria-hidden="true" />
									) : null}
								</StatusMenuItem>
							))}
							{isBookTracked ? (
								<>
									<StatusMenuDivider />
									<StatusMenuItem
										$isActive={false}
										role="menuitem"
										type="button"
										onClick={() => void handleRemoveFromLibrary()}
									>
										<span>Remove</span>
									</StatusMenuItem>
								</>
							) : null}
						</StatusMenu>
					) : null}
				</LibraryAction>
				<RoundAction
					type="button"
					aria-label="Book shelves"
					onClick={openCollectionModal}
				>
					<AutoStoriesOutlinedIcon aria-hidden="true" />
				</RoundAction>
				{isBookTracked ? (
					<PaperNoteToggleAction
						aria-expanded={isPaperNoteOpen}
						aria-label="Paper note"
						type="button"
						onClick={togglePaperNotePanel}
					>
						<EditNoteOutlinedIcon aria-hidden="true" />
					</PaperNoteToggleAction>
				) : null}
				<MoreActionWrap
					onMouseEnter={cancelCloseMoreMenu}
					onMouseLeave={scheduleCloseMoreMenu}
					onBlur={(event) => {
						if (!event.currentTarget.contains(event.relatedTarget)) {
							setIsMoreMenuOpen(false);
							setIsPaperMenuOpen(false);
							setIsNoteEditorOpen(false);
						}
					}}
				>
					<RoundAction
						aria-expanded={isAnyMenuOpen}
						aria-haspopup="menu"
						type="button"
						aria-label="More actions"
						onClick={() => {
							setIsStatusMenuOpen(false);
							setIsMoreMenuOpen((current) => !current);
							setIsPaperMenuOpen(false);
							setIsNoteEditorOpen(false);
						}}
					>
						<MoreHorizIcon aria-hidden="true" />
					</RoundAction>
					{isMoreMenuOpen ? (
						<MoreMenu role="menu" onMouseEnter={cancelCloseMoreMenu}>
							<MoreMenuItem
								aria-expanded={isPaperMenuOpen}
								role="menuitem"
								type="button"
								onClick={() => setIsPaperMenuOpen((current) => !current)}
							>
								<span>Paper book</span>
								<KeyboardArrowRightIcon aria-hidden="true" />
							</MoreMenuItem>
							{isPaperMenuOpen ? (
								<PaperSubmenu
									role="menu"
									onMouseLeave={() => setIsPaperMenuOpen(false)}
								>
									{paperBookStatuses.map((status) => (
										<StatusMenuItem
											key={status.id}
											$isActive={paperBookStatus === status.id}
											role="menuitem"
											disabled={isActionPending}
											type="button"
											onClick={() => void handlePaperStatusSelect(status.id)}
										>
											<span>{status.label}</span>
											{paperBookStatus === status.id ? (
												<CheckIcon aria-hidden="true" />
											) : null}
										</StatusMenuItem>
									))}
									<StatusMenuDivider />
									{hasPaperBook ? (
										<StatusMenuItem
											$isActive={false}
											role="menuitem"
											disabled={isActionPending}
											type="button"
											onClick={() => void handleRemovePaperBook()}
										>
											<span>Remove from paper books</span>
										</StatusMenuItem>
									) : null}
								</PaperSubmenu>
							) : null}
						</MoreMenu>
					) : null}
				</MoreActionWrap>
			</ActionRow>
			{canShowPaperNote ? (
				<PaperNoteDock>
					<PaperNotePanelWrap $isOpen={isPaperNoteOpen}>
						<PaperNotePanel
							canExpand={hasClampedNoteOverflow}
							emptyText={
								paperBookState?.status
									? "Add a short note about your paper copy."
									: "Have a paper copy or plan to get one? Set the status."
							}
							hasNote={hasPaperBookNote}
							isActionPending={isActionPending}
							isExpanded={isNoteExpanded}
							isInlineEditing={
								isNoteEditorOpen && Boolean(paperBookState?.status)
							}
							noteText={paperBookNote}
							noteTextRef={noteTextRef}
							showClearAction={
								hasPaperBookNote && Boolean(paperBookState?.status)
							}
							value={noteDraft}
							onCancelInlineEdit={() => {
								setNoteDraft(paperBookState?.note ?? "");
								setIsNoteEditorOpen(false);
							}}
							onClear={() => void handleClearPaperNote()}
							onDraftChange={setNoteDraft}
							onEdit={openPaperNoteEditor}
							onSaveInlineEdit={() => void handleSavePaperNote()}
							onToggleExpand={() => setIsNoteExpanded((current) => !current)}
						/>
					</PaperNotePanelWrap>
				</PaperNoteDock>
			) : null}
			{trackingStatus ? (
				<VisuallyHidden role="status">{trackingStatus}</VisuallyHidden>
			) : null}
			{isCollectionModalOpen ? (
				<BookCollectionModal
					bookId={book.id}
					collectionIds={collectionIds}
					onCollectionIdsChange={setCollectionIdsOverride}
					onClose={() => setIsCollectionModalOpen(false)}
				/>
			) : null}
			{isEditBookOpen ? (
				<CreateBookModal
					bookId={book.id}
					onClose={() => setIsEditBookOpen(false)}
					onCreateError={(message) => setTrackingStatus(message)}
					onDeleted={() => {
						setTrackingStatus("Book deleted");
						setIsEditBookOpen(false);
						router.replace("/treasures/books");
					}}
					onUpdated={() => {
						setTrackingStatus("Book updated");
						setIsEditBookOpen(false);
					}}
				/>
			) : null}
		</HeaderBlock>
	);
};

export default BookDetailHero;

const getSeriesTag = (book: IBook) => {
	const series = book.series;
	const seriesTitle = series?.title;

	if (!series || !seriesTitle) {
		return null;
	}

	const orderInSeries = series.orderInSeries ?? book.orderInSeries;
	const relationType = series.relationType ?? book.relationType;
	const mainBooksCount =
		series.books?.filter(
			(seriesBook) =>
				(seriesBook.relationType === "main" ||
					!seriesBook.relationType ||
					seriesBook.relationType === "unknown") &&
				(seriesBook.orderInSeries ?? 0) > 0,
		).length ?? 0;

	if (relationType === "spin_off") {
		return `Spin-off in ${seriesTitle}`;
	}

	if (relationType === "collection" || relationType === "omnibus") {
		return `${series.seriesLabel ?? book.seriesLabel ?? "Collection"} in ${seriesTitle}`;
	}

	if (orderInSeries && orderInSeries > 0) {
		return mainBooksCount > 0
			? `Book ${orderInSeries} of ${mainBooksCount} in ${seriesTitle}`
			: `Book ${orderInSeries} in ${seriesTitle}`;
	}

	return `Part of ${seriesTitle}`;
};

const HeaderBlock = styled.section`
	position: relative;
	display: flex;
	height: var(--detail-backdrop-height);
	min-width: 0;
	flex-direction: column;
	padding-top: var(--detail-cover-offset);

	@media (max-width: 47.9375rem) {
		align-items: center;
		min-height: auto;
		padding-top: 0;
		padding-bottom: 0;
		text-align: center;
		height: auto;
	}
`;

const DesktopSeriesTag = styled.div`
	@media (max-width: 47.9375rem) {
		display: none;
	}
`;

export const SeriesTag = styled.div`
	display: inline-flex;
	align-items: center;
	width: fit-content;
	max-width: 100%;
	overflow: hidden;
	border: 0.0625rem solid rgb(242 239 237 / 0.22);
	border-radius: 62.4375rem;
	background: rgb(242 239 237 / 0.12);
	padding: 0.42rem 0.78rem;
	color: ${theme.colors.orangeLight};
	font-family: ${theme.fonts.sans};
	font-size: 0.82rem;
	font-weight: 600;
	line-height: 1;
	text-overflow: ellipsis;
	white-space: nowrap;

	@media (max-width: 74.9375rem) {
		font-size: 0.82rem;
	}
`;

const SeriesTagLink = styled(Link)`
	display: inline-flex;
	color: inherit;
	text-decoration: none;

	&:hover,
	&:focus-visible {
		outline: none;
	}
`;

const Title = styled.h1`
	display: flex;
	align-items: center;
	gap: 0.7rem;
	max-width: 100%;
	margin: 1.1rem 0 0;
	color: ${theme.colors.invertedText};
	font-family: ${theme.fonts.serif};
	font-size: 2.35rem;
	font-weight: 500;
	line-height: 1.12;
	overflow-wrap: anywhere;

	@media (max-width: 74.9375rem) {
		font-size: 1.72rem;
	}

	@media (max-width: 47.9375rem) {
		color: ${theme.colors.bluePrimary};
	}
`;

const TitleText = styled.span`
	display: -webkit-box;
	min-width: 0;
	max-width: 42rem;
`;

const TitleEditButton = styled.button`
	display: inline-flex;
	flex: 0 0 auto;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	border: 0.0625rem solid rgb(242 239 237 / 0.22);
	border-radius: 50%;
	background: rgb(242 239 237 / 0.12);
	color: ${theme.colors.orangeLight};
	cursor: pointer;
	padding: 0;
	-webkit-tap-highlight-color: transparent;
	touch-action: manipulation;

	& svg {
		width: 1.2rem;
		height: 1.2rem;
	}

	${finePointer} {
		&:hover,
		&:focus-visible {
			background: rgb(242 239 237 / 0.2);
			outline: none;
		}
	}
`;

const FinishedMark = styled.span`
	display: inline-flex;
	flex: 0 0 auto;
	align-items: center;
	justify-content: center;
	gap: 0.35rem;
	border: 0.0625rem solid rgb(242 239 237 / 0.22);
	border-radius: 62.4375rem;
	background: rgb(242 239 237 / 0.12);
	padding: 0.42rem 0.78rem;
	color: ${theme.colors.orangeLight};
	font-family: ${theme.fonts.sans};
	font-size: 0.82rem;
	font-weight: 600;
	line-height: 1;

	& svg {
		width: 1rem;
		height: 1rem;
	}

	@media (max-width: 74.9375rem) {
		padding: 0.36rem 0.64rem;
		font-size: 0.72rem;

		& svg {
			width: 0.9rem;
			height: 0.9rem;
		}
	}
`;

const Author = styled.p`
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	max-width: 100%;
	overflow: hidden;
	margin: 0.55rem 0 0;
	color: ${theme.colors.orangeLight};
	font-family: ${theme.fonts.sans};
	font-size: 1.125rem;
	line-height: 1.4;
	text-overflow: ellipsis;
	white-space: nowrap;

	@media (max-width: 74.9375rem) {
		font-size: 0.95rem;
	}

	@media (max-width: 47.9375rem) {
		font-size: 1.1rem;
	}
`;

const AuthorLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	width: fit-content;
	max-width: 100%;
	overflow: hidden;
	margin: 0.35vw 0 0;
	color: ${theme.colors.orangeLight};
	font-family: ${theme.fonts.sans};
	font-size: 1.1vw;
	line-height: 1.4;

	text-decoration: none;
	text-overflow: ellipsis;
	white-space: nowrap;

	&:hover,
	&:focus-visible {
		outline: none;
		text-decoration: underline;
	}

	@media (max-width: 74.9375rem) {
		font-size: 0.95rem;
		margin-top: 0.55rem;
	}

	@media (max-width: 47.9375rem) {
		font-size: 1.1rem;
	}
`;

const AuthorBy = styled.span`
	color: ${theme.colors.orangeLight};
	${AuthorLink}:hover & {
		text-decoration: none !important;
	}
`;

const AuthorName = styled.span`
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const ActionRow = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	padding-top: 1.4rem;

	@media (max-width: 74.9375rem) {
		gap: 0.75rem;
		padding-top: 1rem;
	}

	@media (max-width: 47.9375rem) {
		justify-content: center;
		padding-top: 0.9rem;
	}

	@media (max-width: 32rem) {
		flex-wrap: wrap;
	}
`;

const PaperNoteToggleAction = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2.65rem;
	height: 2.65rem;
	border: 0;
	border-radius: 50%;
	background: ${theme.colors.surface};
	color: ${theme.colors.darkerOrangeLight};
	cursor: pointer;
	-webkit-tap-highlight-color: transparent;
	touch-action: manipulation;
	transition:
		background 180ms ease,
		color 180ms ease,
		transform 180ms ease;

	& svg {
		width: 1.65rem;
		height: 1.65rem;
	}

	&[aria-expanded="true"] {
		background: ${theme.colors.orangeLight};
		color: ${theme.colors.invertedText};
	}

	margin-left: 0.45rem;

	@media (max-width: 74.9375rem) {
		width: 2.35rem;
		height: 2.35rem;

		& svg {
			width: 1.45rem;
			height: 1.45rem;
		}
	}

	${finePointer} {
		&:hover,
		&:focus-visible {
			background: ${theme.colors.orangeLight};
			color: ${theme.colors.invertedText};
			outline: none;
			transform: translateY(-0.0625rem);
		}
	}
	@media (min-width: 48rem) {
		${finePointer} {
			&:hover,
			&:focus-visible {
				background: ${theme.colors.surface};
				color: ${theme.colors.darkerOrangeLight};
				outline: unset;
				transform: unset;
			}
		}
	}
`;

const PaperNoteDock = styled.div`
	position: absolute;
	right: 0;
	top: 32%;
	transform: translateY(-50%);
	width: min(22rem, 42vw);
	z-index: 12;

	@media (max-width: 62rem) {
		position: static;
		top: auto;
		right: auto;
		transform: none;
		width: min(34rem, 100%);
		margin-top: 0.85rem;
	}
`;

const LibraryAction = styled.div`
	position: relative;
	display: inline-flex;
	align-items: stretch;
	margin-top: 0.1rem;
`;

const LibraryButtonBase = styled.button<{ $isTracked: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 2.65rem;
	border: 0;
	background: ${({ $isTracked }) =>
		$isTracked ? theme.colors.surface : theme.colors.orangeLight};
	color: ${({ $isTracked }) =>
		$isTracked ? theme.colors.darkerOrangeLight : theme.colors.invertedText};
	cursor: pointer;
	-webkit-tap-highlight-color: transparent;
	touch-action: manipulation;
	font-family: ${theme.fonts.serif};
	font-size: 1.1rem;
	font-weight: 700;
	line-height: 1.2;
	transition:
		background 180ms ease,
		color 180ms ease,
		transform 180ms ease;

	&:hover,
	&:focus-visible {
		background: ${({ $isTracked }) =>
			$isTracked ? theme.colors.orangeLight : theme.colors.surface};
		color: ${({ $isTracked }) =>
			$isTracked ? theme.colors.invertedText : theme.colors.darkerOrangeLight};
		outline: none;
	}

	&:disabled {
		cursor: wait;
		opacity: 0.72;
	}

	@media (max-width: 74.9375rem) {
		min-height: 2.35rem;
		font-size: 0.95rem;
	}
`;

const LibraryMainButton = styled(LibraryButtonBase)`
	min-width: ${({ $isTracked }) => ($isTracked ? "7.8rem" : "10.5rem")};
	gap: 0.35rem;
	border-radius: ${({ $isTracked }) =>
		$isTracked ? "62.4375rem" : "62.4375rem 0 0 62.4375rem"};
	padding: ${({ $isTracked }) =>
		$isTracked ? "0.58rem 1.25rem" : "0.58rem 0.9rem 0.58rem 1.2rem"};

	@media (max-width: 74.9375rem) {
		min-width: ${({ $isTracked }) => ($isTracked ? "6.8rem" : "8.6rem")};
		padding: ${({ $isTracked }) =>
			$isTracked ? "0.5rem 1rem" : "0.5rem 0.8rem 0.5rem 1rem"};
	}

	& svg {
		width: 1.35rem;
		height: 1.35rem;
		transition: transform 160ms ease;
	}

	&[aria-expanded="true"] svg {
		transform: rotate(180deg);
	}
`;

const LibraryMenuButton = styled(LibraryButtonBase)`
	width: 2.55rem;
	border-radius: 0 62.4375rem 62.4375rem 0;
	border-left: 0.0625rem solid rgb(242 239 237 / 0.46);
	padding: 0;

	& svg {
		width: 1.45rem;
		height: 1.45rem;
		transition: transform 160ms ease;
	}

	&[aria-expanded="true"] svg {
		transform: rotate(180deg);
	}

	@media (max-width: 74.9375rem) {
		width: 2.35rem;
	}
`;

const StatusMenu = styled.div`
	position: absolute;
	top: calc(100% + 0.55rem);
	left: 0;
	z-index: 20;
	display: grid;
	width: 13.5rem;
	overflow: hidden;
	border: 0.0625rem solid ${theme.colors.orangeLight};
	border-radius: 0.9rem;
	background: #f2efed;
	box-shadow: 0 1rem 2rem rgb(4 18 26 / 0.16);
	padding: 0.35rem;
	text-align: left;
`;

const StatusMenuItem = styled.button<{ $isActive: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	border: 0;
	border-radius: 0.65rem;
	background: ${({ $isActive }) =>
		$isActive ? "rgb(218 142 91 / 0.16)" : "transparent"} !important;
	padding: 0.65rem 0.75rem;
	color: ${({ $isActive }) =>
		$isActive ? theme.colors.orangeDark : theme.colors.foreground} !important;
	cursor: pointer;
	-webkit-tap-highlight-color: transparent;
	touch-action: manipulation;
	font: inherit;
	font-size: 0.95rem;
	font-weight: ${({ $isActive }) => ($isActive ? 700 : 500)};

	& svg {
		width: 1.1rem;
		height: 1.1rem;
		color: ${theme.colors.orangeDark};
	}

	&:hover,
	&:focus-visible {
		background: ${({ $isActive }) =>
			$isActive
				? "rgb(218 142 91 / 0.22)"
				: "rgb(238 179 141 / 0.16)"} !important;
		color: ${theme.colors.orangeDark} !important;
		outline: none;
	}
`;

const StatusMenuDivider = styled.div`
	height: 0.0625rem;
	margin: 0.25rem;
	background: rgb(238 179 141 / 0.55);
`;

const VisuallyHidden = styled.span`
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip: rect(0 0 0 0);
	white-space: nowrap;
`;

const MoreActionWrap = styled.div`
	position: relative;
`;

const MoreMenu = styled.div`
	position: absolute;
	top: calc(100% + 0.45rem);
	right: 0;
	z-index: 25;
	display: grid;
	width: 13.5rem;
	max-width: min(13.5rem, calc(100vw - 1rem));
	overflow: visible;
	box-sizing: border-box;
	border: 0.0625rem solid ${theme.colors.orangeLight};
	border-radius: 0.9rem;
	background: #f2efed;
	box-shadow: 0 1rem 2rem rgb(4 18 26 / 0.16);
	padding: 0.35rem;
	text-align: left;
`;

const MoreMenuItem = styled.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	border: 0;
	border-radius: 0.65rem;
	background: transparent;
	padding: 0.65rem 0.75rem;
	color: ${theme.colors.foreground};
	cursor: pointer;
	-webkit-tap-highlight-color: transparent;
	touch-action: manipulation;
	font: inherit;
	font-size: 0.95rem;
	font-weight: 500;

	& svg {
		width: 1.1rem;
		height: 1.1rem;
		color: ${theme.colors.orangeDark};
	}

	&:hover,
	&:focus-visible {
		background: rgb(238 179 141 / 0.16);
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;

const PaperSubmenu = styled.div`
	position: absolute;
	top: calc(100% + 0.35rem);
	right: 0;
	left: auto;
	z-index: 30;
	display: grid;
	width: 14.5rem;
	max-width: min(14.5rem, calc(100vw - 1rem));
	box-sizing: border-box;
	border: 0.0625rem solid ${theme.colors.orangeLight};
	border-radius: 0.9rem;
	background: #f2efed;
	box-shadow: 0 1rem 2rem rgb(4 18 26 / 0.16);
	padding: 0.35rem;
`;

const RoundAction = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2.65rem;
	height: 2.65rem;
	border: 0;
	border-radius: 50%;
	background: ${theme.colors.surface};
	color: ${theme.colors.darkerOrangeLight};
	cursor: pointer;
	-webkit-tap-highlight-color: transparent;
	touch-action: manipulation;
	transition:
		background 180ms ease,
		color 180ms ease,
		transform 180ms ease;

	& svg {
		width: 1.65rem;
		height: 1.65rem;
	}

	&[aria-expanded="true"] {
		background: ${theme.colors.orangeLight};
		color: ${theme.colors.invertedText};
	}

	@media (max-width: 74.9375rem) {
		width: 2.35rem;
		height: 2.35rem;

		& svg {
			width: 1.45rem;
			height: 1.45rem;
		}
	}

	&:hover,
	&:focus-visible {
		background: ${theme.colors.orangeLight};
		color: ${theme.colors.invertedText};
		outline: none;
		transform: translateY(-0.0625rem);
	}
`;

const PaperNotePanelWrap = styled.div<{ $isOpen: boolean }>`
	display: block;

	@media (max-width: ${theme.rubberSize.tablet}) {
		display: ${({ $isOpen }) => ($isOpen ? "block" : "none")};
	}
`;
