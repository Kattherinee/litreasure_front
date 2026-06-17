import { useSaveCollectionMutation } from "@/shared/api/collections";
import type { ICollectionPreview } from "@/shared/api/collections";
import { useAuthStore } from "@/shared/store/auth-store";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import { theme } from "@/shared/theme";
import { Button } from "@/shared/ui/Button";
import { PlusIcon } from "@/shared/ui/PlusIcon";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import styled from "styled-components";
import { PreviewRail, RowCopy } from "./CollectionsPage";

export const CollectionRow = ({
	collection,
	onAuthRequired,
	showSaveButton = true,
}: {
	collection: ICollectionPreview;
	onAuthRequired: () => void;
	showSaveButton?: boolean;
}) => {
	const router = useRouter();
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const currentUsername = useAuthStore(
		(state) => state.session?.user?.username,
	);
	const saveCollectionMutation = useSaveCollectionMutation();
	const [saveStatus, setSaveStatus] = useState("");
	const [savedOverride, setSavedOverride] = useState<boolean | null>(null);
	const [subscriberCountOverride, setSubscriberCountOverride] = useState<
		number | null
	>(null);

	const hiddenBooksCount = Math.max(
		collection.bookCount - collection.previewBooks.length,
		0,
	);
	const ownerLabel =
		collection.source === "open_library"
			? "Litreasure"
			: collection.owner.username || collection.owner.name;

	const isMyCollection =
		!!currentUsername && collection.owner?.username === currentUsername;
	const isSaved = savedOverride ?? collection.isSaved ?? false;
	const subscriberCount =
		subscriberCountOverride ?? collection.subscriberCount ?? 0;
	const collectionRelationLabel = isMyCollection
		? "My collection"
		: isSaved
			? "Subscribed"
			: null;

	useEffect(() => {
		if (!saveStatus) return;

		const timeoutId = window.setTimeout(() => {
			setSaveStatus("");
		}, 2600);

		return () => window.clearTimeout(timeoutId);
	}, [saveStatus]);

	const openCollection = () => {
		router.push(`/collections/${collection.id}`);
	};

	const handleRowKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		if (event.key !== "Enter" && event.key !== " ") return;

		event.preventDefault();
		openCollection();
	};

	const handleSaveClick = async (event: MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setSaveStatus("");

		if (!isAuthenticated) {
			onAuthRequired();
			return;
		}

		try {
			await saveCollectionMutation.mutateAsync(collection.id);
			setSavedOverride(true);
			setSubscriberCountOverride((collection.subscriberCount ?? 0) + 1);
			setSaveStatus("Subscription enabled");
		} catch (error) {
			setSaveStatus(
				error instanceof Error ? error.message : "Could not subscribe",
			);
		}
	};
	const getCollectionOwnerAvatar = (collection: ICollectionPreview) => {
		if (collection.source === "open_library") return "/favicon.ico";

		return collection.owner.avatarUrl || "/favicon.ico";
	};

	return (
		<Row
			aria-label={`Open collection ${collection.title}`}
			role="link"
			tabIndex={0}
			onClick={openCollection}
			onKeyDown={handleRowKeyDown}
		>
			<RowCopy>
				<RowTitle>{collection.title}</RowTitle>

				<RowMeta>
					<OwnerLink>
						<OwnerAvatar src={getCollectionOwnerAvatar(collection)} alt="" />
						<span>{ownerLabel}</span>
					</OwnerLink>
					<BookCount>{collection.bookCount} books</BookCount>
					<SubscriberCount>{subscriberCount} subscribers</SubscriberCount>
					{collectionRelationLabel ? (
						<RelationChip
							aria-label={
								isMyCollection
									? "Collection created by you"
									: "You are subscribed to this collection"
							}
						>
							<BookmarkIcon aria-hidden="true" />
							<span>{collectionRelationLabel}</span>
						</RelationChip>
					) : null}
				</RowMeta>

				{showSaveButton && !collectionRelationLabel ? (
					<SaveButton
						buttonType="containedInverted"
						disabled={saveCollectionMutation.isPending}
						title="Subscribe to collection"
						onClick={handleSaveClick}
					>
						<PlusIcon />
						<span>
							{saveCollectionMutation.isPending
								? "Subscribing..."
								: "Subscribe"}
						</span>
					</SaveButton>
				) : null}
			</RowCopy>

			<PreviewRail aria-label={`Books from collection ${collection.title}`}>
				{collection.previewBooks.length > 0 ? (
					collection.previewBooks.map((book) => (
						<PreviewBook
							key={book.id}
							onClick={(event) => {
								event.stopPropagation();
								router.push(`/books/${book.id}`);
							}}
						>
							<PreviewCover
								src={book.coverUrl || "/images/book-placeholder.svg"}
								alt={`Cover of ${book.title}`}
							/>
							<BookTooltip>
								<TooltipTitle>{book.title}</TooltipTitle>
								<TooltipAuthor>{book.author}</TooltipAuthor>
							</BookTooltip>
						</PreviewBook>
					))
				) : (
					<EmptyPreview>No books in this collection yet.</EmptyPreview>
				)}
				{hiddenBooksCount > 0 ? (
					<MoreBooksBadge>+{hiddenBooksCount}</MoreBooksBadge>
				) : null}
			</PreviewRail>

			{saveStatus ? <SaveToast role="status">{saveStatus}</SaveToast> : null}
		</Row>
	);
};

const RowTitle = styled.h2`
	min-width: 0;
	margin: 0;
	overflow: hidden;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: clamp(1.05rem, 1.2vw, 1.4rem);
	font-weight: 500;
	line-height: 1.2;
	text-overflow: ellipsis;
	white-space: nowrap;

	&:hover {
		text-decoration: underline 1px;
	}

	@media (max-width: 42rem) {
		overflow: visible;
		white-space: normal;
		text-overflow: clip;
		overflow-wrap: anywhere;
	}
`;

const BookCount = styled.span`
	flex: 0 0 auto;
	color: ${theme.colors.bluePrimary};
	font-family: ${theme.fonts.sans};
	font-size: clamp(0.78rem, 0.84vw, 0.92rem);
	font-weight: 400;
	letter-spacing: 0.01em;
	line-height: 1rem;
`;

const SubscriberCount = styled(BookCount)`
	color: ${theme.colors.softForeground};
`;

const RowMeta = styled.div`
	display: flex;
	min-height: 1rem;
	align-items: center;
	flex-wrap: wrap;
	gap: 0.75rem;

	@media (max-width: 42rem) {
		gap: 0.45rem 0.65rem;
	}
`;

const OwnerLink = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.4vw;
	color: ${theme.colors.orangePrimary};
	font-family: ${theme.fonts.sans};
	font-size: clamp(0.78rem, 0.84vw, 0.92rem);
	font-weight: 400;
	letter-spacing: 0.01em;
	line-height: 1rem;
	text-decoration: underline;

	&:hover {
		color: ${theme.colors.orangeDark};
	}
`;

const OwnerAvatar = styled.img`
	width: 1.35rem;
	height: 1.35rem;
	border-radius: 50%;
	object-fit: cover;
`;

const SaveButton = styled(Button)`
	&& {
		width: max-content;
		gap: 0.4rem;
		font-weight: 400;
		font-family: ${theme.fonts.sans};
		margin-top: 0.5rem;
		font-size: 0.92rem;
		padding: 0.35rem 1rem 0.4rem;

		svg {
			width: 1rem;
			height: 1rem;
		}
	}
`;

const RelationChip = styled.span`
	display: inline-flex;
	flex: 0 0 auto;
	align-items: center;
	justify-content: center;
	gap: 0.35rem;
	border: 0.0625rem solid rgb(237 160 108 / 0.46);
	border-radius: 62.4375rem;
	background: rgb(242 239 237 / 0.72);
	padding: 0.32rem 0.68rem 0.34rem;
	color: ${theme.colors.orangeDark};
	font-family: ${theme.fonts.sans};
	font-size: 0.82rem;
	font-weight: 600;
	line-height: 1;

	svg {
		width: 0.95rem;
		height: 0.95rem;
	}
`;

const SaveToast = styled.div`
	position: absolute;
	left: 1.05vw;
	bottom: 0.85rem;
	z-index: 5;
	border: 0.0625rem solid rgb(237 160 108 / 0.42);
	border-radius: 62.4375rem;
	background: ${theme.colors.surface};
	padding: 0.45rem 0.8rem;
	box-shadow: 0 0.75rem 1.5rem rgb(4 18 26 / 0.12);
	color: ${theme.colors.orangeDark};
	font-family: ${theme.fonts.sans};
	font-size: 0.82rem;
	font-weight: 600;
	line-height: 1;
	pointer-events: none;
`;

const Row = styled.article`
	position: relative;
	display: flex;
	min-height: 7rem;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1.5rem;
	overflow: visible;
	border: 0.0625rem solid rgb(218 142 91 / 0.18);
	border-radius: 1rem;
	background: rgb(242 239 237 / 0.58);
	padding: 1rem;
	color: inherit;
	cursor: pointer;
	transition:
		box-shadow 180ms ease,
		transform 180ms ease;

	height: fit-content;

	&:hover,
	&:focus-visible {
		box-shadow: 0 0.75rem 1.5rem rgb(4 18 26 / 0.08);
		outline: none;
		transform: translateY(-0.0625rem);
	}

	@media (max-width: 56rem) {
		gap: 1rem;
	}

	@media (max-width: 42rem) {
		flex-direction: column;
		align-items: stretch;
		gap: 0.9rem;
		min-height: auto;
	}
`;

const PreviewBook = styled.span`
	position: relative;
	display: block;
	width: 3.5rem;
	height: 4.75rem;
	flex: 0 0 auto;
	border-radius: 0.75rem;
	background: #dadada;
	box-shadow: none;
`;

const PreviewCover = styled.img`
	display: block;
	width: 100%;
	height: 100%;
	border-radius: inherit;
	object-fit: cover;
`;

const MoreBooksBadge = styled.span`
	display: inline-flex;
	width: 1.75rem;
	height: 1.75rem;
	flex: 0 0 auto;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background-color: #ededed;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.sans};
	font-size: 0.75rem;
	font-weight: 400;
	letter-spacing: 0.01em;
	line-height: 1rem;
`;

const BookTooltip = styled.span`
	position: absolute;
	right: 50%;
	bottom: calc(100% + 0.5rem);
	z-index: 10;
	width: max-content;
	max-width: 14rem;
	border: 0.0625rem solid rgb(35 61 77 / 0.1);
	border-radius: 0.55rem;
	background: ${theme.colors.surface};
	padding: 0.5rem 0.65rem;
	box-shadow: 0 0.8rem 1.6rem rgb(4 18 26 / 0.16);
	opacity: 0;
	pointer-events: none;
	transform: translate(50%, 0.25rem);
	transition:
		opacity 150ms ease,
		transform 170ms ease;

	${PreviewBook}:hover & {
		opacity: 1;
		transform: translate(50%, 0);
	}

	&::after {
		position: absolute;
		right: calc(50% - 0.35rem);
		bottom: -0.35rem;
		width: 0.7rem;
		height: 0.7rem;
		background: inherit;
		content: "";
		transform: rotate(45deg);
	}
`;

const TooltipTitle = styled.span`
	display: block;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 0.9rem;
	font-weight: 600;
	line-height: 1.15;
`;

const TooltipAuthor = styled.span`
	display: block;
	margin-top: 0.18rem;
	color: ${theme.colors.softForeground};
	font-size: 0.78rem;
	line-height: 1.25;
`;

const EmptyPreview = styled.p`
	grid-column: 1 / -1;
	margin: 0;
	border: 0.0625rem dashed ${theme.colors.border};
	border-radius: 0.5rem;
	padding: 1rem;
	color: ${theme.colors.softForeground};
	font-size: 0.95rem;
	line-height: 1.5;
`;
