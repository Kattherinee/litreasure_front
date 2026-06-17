"use client";

import PersonIcon from "@mui/icons-material/Person";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styled from "styled-components";

import {
	ResultsBadge as BaseResultsBadge,
	ResultsNumber as TotalNumber,
	ResultsText as TotalText,
} from "@/components/pages/AuthorsFilters";
import { CreateCollectionModal } from "@/components/pages/book-details/CreateCollectionModal";
import {
	useCollectionQuery,
	useDeleteCollectionMutation,
	useRemoveBookFromCollectionMutation,
	useUnsaveCollectionMutation,
} from "@/shared/api/collections";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import { BookCard } from "@/shared/ui/BookCard";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { BookCardSkeleton } from "@/shared/ui/Skeleton";

interface ICollectionPageProps {
	id: string;
}

const CollectionPage = ({ id }: ICollectionPageProps) => {
	const router = useRouter();
	const sessionUser = useAuthStore((state) => state.session?.user);
	const deleteCollectionMutation = useDeleteCollectionMutation();
	const removeBookMutation = useRemoveBookFromCollectionMutation();
	const unsaveCollectionMutation = useUnsaveCollectionMutation();
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [actionMessage, setActionMessage] = useState("");
	const [savedOverride, setSavedOverride] = useState<boolean | null>(null);
	const [subscriberCountOverride, setSubscriberCountOverride] = useState<
		number | null
	>(null);
	const {
		data: collection,
		error,
		isError,
		isLoading,
	} = useCollectionQuery(id);
	const visibleBooks = collection?.books.slice(0, 27) ?? [];
	const isMyCollection =
		collection?.source === "user" &&
		((sessionUser?.id && collection.owner.id === sessionUser.id) ||
			(sessionUser?.username &&
				collection.owner.username === sessionUser.username));
	const ownerLabel = collection
		? collection.source === "open_library"
			? "Litreasure"
			: collection.owner.name || collection.owner.username || "Litreasure"
		: "";
	const ownerAvatarUrl =
		collection?.source === "user" && collection.owner.avatarUrl
			? collection.owner.avatarUrl
			: "/favicon.ico";
	const isCollectionSaved = savedOverride ?? collection?.isSaved ?? false;
	const subscriberCount =
		subscriberCountOverride ?? collection?.subscriberCount ?? 0;

	const deleteCollection = async () => {
		if (!collection) return;

		setActionMessage("");
		try {
			await deleteCollectionMutation.mutateAsync(collection.id);
			router.push("/collections/_username");
		} catch (error) {
			setActionMessage(
				error instanceof Error ? error.message : "Could not delete collection",
			);
		}
	};

	const unsubscribeFromCollection = async () => {
		if (!collection) return;

		setActionMessage("");
		try {
			await unsaveCollectionMutation.mutateAsync(collection.id);
			setSavedOverride(false);
			setSubscriberCountOverride(Math.max(0, subscriberCount - 1));
			setActionMessage("Collection subscription canceled");
		} catch (error) {
			setActionMessage(
				error instanceof Error ? error.message : "Could not unsubscribe",
			);
		}
	};

	const removeBook = async (bookId: string) => {
		if (!collection) return;

		setActionMessage("");
		try {
			await removeBookMutation.mutateAsync({ bookId, id: collection.id });
			setActionMessage("Book removed from collection");
		} catch (error) {
			setActionMessage(
				error instanceof Error ? error.message : "Could not remove book",
			);
		}
	};

	return (
		<Page>
			<Content>
				{isLoading ? (
					<>
						<TitleSkeleton />
						<BookGrid aria-label="Loading collection books">
							{Array.from({ length: 10 }, (_, index) => (
								<BookItem key={index}>
									<BookCardSkeleton size="compact" />
								</BookItem>
							))}
						</BookGrid>
					</>
				) : isError ? (
					<StateMessage>
						Could not load collection: {error.message}
					</StateMessage>
				) : collection ? (
					<>
						<Hero $coverUrl={collection.coverUrl}>
							{!isMyCollection && isCollectionSaved ? (
								<UnsubscribeButton
									type="button"
									disabled={unsaveCollectionMutation.isPending}
									onClick={() => void unsubscribeFromCollection()}
								>
									{unsaveCollectionMutation.isPending
										? "Unsubscribing..."
										: "Unsubscribe"}
								</UnsubscribeButton>
							) : null}
							<HeroCopy>
								<Kicker>
									{collection.isPublic
										? "Public collection"
										: "Private collection"}
								</Kicker>
								<Title>{collection.title}</Title>
								<Lead>{collection.description || "No description."}</Lead>
								<MetaButtons>
									<Meta>
										<OwnerMeta>
											<OwnerAvatar src={ownerAvatarUrl} alt="" />
											<span>{ownerLabel}</span>
										</OwnerMeta>
										<BookTotalBadge
											aria-label={`Total books: ${collection.bookCount}`}
										>
											<TotalNumber>{collection.bookCount}</TotalNumber>
											<TotalText>total books</TotalText>
										</BookTotalBadge>
										{collection.isPublic && (
											<TextMeta>
												<PersonIcon aria-hidden="true" />
												<span>{subscriberCount} subscribers</span>
											</TextMeta>
										)}
									</Meta>
									{isMyCollection ? (
										<OwnerActions aria-label="Collection owner actions">
											<Button
												buttonType="containedInverted"
												type="button"
												onClick={() => setIsEditOpen(true)}
											>
												Edit
											</Button>
											<DangerButton
												type="button"
												disabled={deleteCollectionMutation.isPending}
												onClick={() => setIsDeleteConfirmOpen(true)}
											>
												Delete
											</DangerButton>
										</OwnerActions>
									) : null}
								</MetaButtons>
							</HeroCopy>
						</Hero>

						{actionMessage ? (
							<ActionMessage role="status">{actionMessage}</ActionMessage>
						) : null}

						{visibleBooks.length === 0 ? (
							<StateMessage>No books in this collection yet.</StateMessage>
						) : (
							<BookGrid>
								{visibleBooks.map((book) => (
									<BookItem key={book.id}>
										<BookCard book={book} size="compact" />
										{isMyCollection ? (
											<RemoveBookButton
												type="button"
												disabled={removeBookMutation.isPending}
												onClick={() => void removeBook(book.id)}
											>
												Remove
											</RemoveBookButton>
										) : null}
									</BookItem>
								))}
							</BookGrid>
						)}
					</>
				) : null}
			</Content>
			{collection && isEditOpen ? (
				<CreateCollectionModal
					collection={collection}
					onClose={() => setIsEditOpen(false)}
				/>
			) : null}
			{isDeleteConfirmOpen ? (
				<ConfirmModal
					cancelLabel="Cancel"
					confirmLabel="Delete"
					confirmLoadingLabel="Deleting..."
					isLoading={deleteCollectionMutation.isPending}
					title="Delete collection?"
					onCancel={() => setIsDeleteConfirmOpen(false)}
					onConfirm={() => void deleteCollection()}
				>
					This action will remove the collection and cannot be undone.
				</ConfirmModal>
			) : null}
		</Page>
	);
};

export default CollectionPage;

const Page = styled.div`
	min-height: 100dvh;
	background: ${theme.colors.background};
	padding: clamp(1rem, 3vw, 2.5rem) clamp(1.5rem, 2.78vw, 2.5rem);
`;

const Content = styled.section`
	margin: 0 auto;
	max-width: 70.5rem;
`;

const Hero = styled.section<{ $coverUrl?: string }>`
	position: relative;
	overflow: hidden;
	border-radius: 1.25rem;
	background:
		linear-gradient(
			90deg,
			rgb(232 226 222 / 0.96) 0%,
			rgb(232 226 222 / 0.6) 36%,
			rgb(232 226 222 / 0.24) 100%
		),
		${({ $coverUrl }) =>
			$coverUrl
				? `url("${$coverUrl}") center / cover no-repeat`
				: "linear-gradient(135deg, rgb(242 239 237 / 0.95), rgb(211 202 196 / 0.72))"};
	padding: clamp(1rem, 2vw, 2.4rem);

	@media (max-width: 42rem) {
		background:
			linear-gradient(rgb(232 226 222 / 0.92), rgb(232 226 222 / 0.92)),
			${({ $coverUrl }) =>
				$coverUrl
					? `url("${$coverUrl}") center / cover no-repeat`
					: "linear-gradient(135deg, rgb(242 239 237 / 0.95), rgb(211 202 196 / 0.72))"};
	}
`;

const HeroCopy = styled.div`
	position: relative;
	z-index: 1;
	min-width: 0;
`;

const MetaButtons = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const UnsubscribeButton = styled.button`
	position: absolute;
	top: 1rem;
	right: 1rem;
	z-index: 2;
	border: 0.0625rem solid rgb(218 142 91 / 0.46);
	border-radius: 999px;
	background: rgb(242 239 237 / 0.84);
	padding: 0.55rem 0.95rem;
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font: inherit;
	font-size: 0.88rem;
	font-weight: 700;
	box-shadow: 0 0.65rem 1.35rem rgb(4 18 26 / 0.08);

	&:hover,
	&:focus-visible {
		background: ${theme.colors.orangeLight};
		border-color: ${theme.colors.orangeLight};
		color: ${theme.colors.invertedText};
		outline: none;
	}

	&:disabled {
		cursor: progress;
		opacity: 0.68;
	}
`;

const Kicker = styled.p`
	margin: 0 0 0.75rem;
	color: ${theme.colors.orangeDark};
	font-size: 0.8rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	line-height: 1.2;
	text-transform: uppercase;
`;

const Title = styled.h1`
	max-width: 50rem;
	margin: 0;
	font-family: ${theme.fonts.serif};
	font-size: clamp(2.05rem, 3vw, 3.7rem);
	font-weight: 600;
	line-height: 1;
	overflow-wrap: anywhere;
`;

const Lead = styled.p`
	max-width: 48rem;
	margin: 1rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 1rem;
	line-height: 1.55;
`;

const Meta = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.65rem 0.85rem;
	margin-top: 1rem;
	color: ${theme.colors.softForeground};
	font-size: 0.9rem;
	line-height: 1.4;
`;

const OwnerMeta = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	color: ${theme.colors.orangeDark};
	font-weight: 700;
	text-decoration: underline;
	text-underline-offset: 0.16rem;
`;

const OwnerAvatar = styled.img`
	width: 1.35rem;
	height: 1.35rem;
	border: 0.0625rem solid rgb(242 239 237 / 0.72);
	border-radius: 50%;
	object-fit: cover;
`;

const TextMeta = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	color: ${theme.colors.lightText};

	svg {
		width: 1rem;
		height: 1rem;
		color: ${theme.colors.orangeDark};
	}
`;

const BookTotalBadge = styled(BaseResultsBadge)`
	min-height: 2rem;
	padding: 0.36rem 0.7rem;
`;

const StateMessage = styled.p`
	margin: 2.5rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 1rem;
	line-height: 1.5;
`;

const BookGrid = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	justify-content: center;
	align-items: flex-start;
	margin-top: clamp(1.75rem, 3.5vw, 3rem);
`;

const BookItem = styled.div`
	display: grid;
	gap: 0.45rem;
	width: fit-content;
`;

const TitleSkeleton = styled.div`
	width: min(100%, 38rem);
	height: clamp(3rem, 7vw, 5rem);
	border-radius: 0.7rem;
	background: linear-gradient(
		135deg,
		rgb(242 239 237 / 0.72),
		rgb(211 202 196 / 0.72)
	);
`;

const OwnerActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	margin-top: 1.25rem;
`;

const DangerButton = styled.button`
	border: 0.0625rem solid rgb(180 58 58 / 0.34);
	border-radius: 999px;
	background: rgb(180 58 58 / 0.08);
	padding: 0.55rem 1rem;
	color: #9c2f2f;
	cursor: pointer;
	font: inherit;
	font-weight: 700;

	&:hover,
	&:focus-visible {
		background: rgb(180 58 58 / 0.14);
		outline: none;
	}

	&:disabled {
		cursor: wait;
		opacity: 0.6;
	}
`;

const RemoveBookButton = styled.button`
	border: 0;
	background: transparent;
	padding: 0;
	color: ${theme.colors.lightText};
	cursor: pointer;
	font: inherit;
	font-size: 0.82rem;
	line-height: 1.2;
	text-align: left;

	&:hover,
	&:focus-visible {
		color: ${theme.colors.orangeDark};
		outline: none;
		text-decoration: underline;
		text-underline-offset: 0.15rem;
	}

	&:disabled {
		cursor: wait;
		opacity: 0.55;
	}
`;

const ActionMessage = styled.p`
	margin: 1rem 0 0;
	color: ${theme.colors.orangeDark};
	font-size: 0.95rem;
	font-weight: 700;
	line-height: 1.4;
`;
