"use client";

import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PublicIcon from "@mui/icons-material/Public";
import { useMemo, useState } from "react";
import styled from "styled-components";

import {
	type ICollectionPreview,
	useAddBookToCollectionMutation,
	useMyCollectionsQuery,
	useRemoveBookFromCollectionMutation,
} from "@/shared/api/collections";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";

import { CreateCollectionModalContent } from "./CreateCollectionModalContent";

interface IBookCollectionModalProps {
	bookId: string;
	collectionIds: Set<string>;
	onClose: () => void;
	onCollectionIdsChange: (ids: Set<string>) => void;
}

export const BookCollectionModal = ({
	bookId,
	collectionIds,
	onClose,
	onCollectionIdsChange,
}: IBookCollectionModalProps) => {
	const session = useAuthStore((state) => state.session);
	const { data, isLoading } = useMyCollectionsQuery({ limit: 50 });
	const addBookMutation = useAddBookToCollectionMutation();
	const removeBookMutation = useRemoveBookFromCollectionMutation();
	const [isCreatingCollection, setIsCreatingCollection] = useState(false);
	const [message, setMessage] = useState("");
	const collections = useMemo(() => data?.items ?? [], [data?.items]);
	const isSaving = addBookMutation.isPending || removeBookMutation.isPending;
	const canManageCollection = (collection: ICollectionPreview) =>
		!session?.user.id ||
		!collection.owner?.id ||
		collection.owner.id === session.user.id;

	const toggleCollection = async (collection: ICollectionPreview) => {
		setMessage("");
		if (!canManageCollection(collection)) {
			setMessage("You can manage only your collections");
			return;
		}

		const isSelected = collectionIds.has(collection.id);
		const nextIds = new Set(collectionIds);

		try {
			if (isSelected) {
				await removeBookMutation.mutateAsync({ bookId, id: collection.id });
				nextIds.delete(collection.id);
				setMessage("Removed from collection");
			} else {
				await addBookMutation.mutateAsync({ bookId, id: collection.id });
				nextIds.add(collection.id);
				setMessage("Added to collection");
			}

			onCollectionIdsChange(nextIds);
		} catch (error) {
			setMessage(
				error instanceof Error ? error.message : "Could not update collection",
			);
		}
	};

	return (
		<ModalOverlay role="presentation" onMouseDown={onClose}>
			<CollectionDialog
				aria-modal="true"
				role="dialog"
				aria-labelledby="collection-modal-title"
				onMouseDown={(event) => event.stopPropagation()}
			>
				<ModalTitle id="collection-modal-title">
					{isCreatingCollection
						? "Create new collection"
						: "Add book to the collection"}
				</ModalTitle>
				<ModalCloseButton
					type="button"
					aria-label="Close modal"
					onClick={onClose}
				>
					<CloseIcon aria-hidden="true" />
				</ModalCloseButton>
				<CollectionList $allowScroll={!isCreatingCollection}>
					{isCreatingCollection ? (
						<CreateCollectionModalContent
							bookId={bookId}
							collectionIds={collectionIds}
							collections={collections}
							onBack={() => setIsCreatingCollection(false)}
							onCollectionIdsChange={onCollectionIdsChange}
							onMessage={setMessage}
						/>
					) : (
						<>
							<CreateCollectionButton
								type="button"
								onClick={() => {
									setMessage("");
									setIsCreatingCollection(true);
								}}
							>
								<CreateCollectionIcon>
									<AddIcon aria-hidden="true" />
								</CreateCollectionIcon>
								<CreateCollectionText>Create new collection</CreateCollectionText>
							</CreateCollectionButton>
							{isLoading ? (
								<CollectionMessage>Loading collections...</CollectionMessage>
							) : collections.length > 0 ? (
								collections.map((collection, index) => {
									const isSelected = collectionIds.has(collection.id);
									const canManage = canManageCollection(collection);

									return (
										<CollectionOption
											key={collection.id}
											disabled={isSaving || !canManage}
											type="button"
											onClick={() => void toggleCollection(collection)}
										>
											<CollectionCover
												$coverUrl={collection.coverUrl}
												$variant={index % 2 === 0 ? "image" : "color"}
											/>
											<CollectionMeta>
												<CollectionName>
													{collection.title}
													{collection.isPublic ? (
														<PublicIcon aria-hidden="true" />
													) : (
														<LockOutlinedIcon aria-hidden="true" />
													)}
												</CollectionName>
												<CollectionOwner>
													{collection.owner?.name ||
														collection.owner?.username ||
														"Owner of the shelf"}
												</CollectionOwner>
											</CollectionMeta>
											<CollectionCheckbox
												$isChecked={isSelected}
												aria-hidden="true"
											>
												{isSelected ? <CheckIcon aria-hidden="true" /> : null}
											</CollectionCheckbox>
										</CollectionOption>
									);
								})
							) : (
								<CollectionMessage>No collections yet</CollectionMessage>
							)}
						</>
					)}
					{message ? (
						<CollectionMessage role="status">{message}</CollectionMessage>
					) : null}
				</CollectionList>
			</CollectionDialog>
		</ModalOverlay>
	);
};

const ModalOverlay = styled.div`
	position: fixed;
	z-index: 80;
	inset: 0;
	display: grid;
	place-items: center;
	background: rgb(4 18 26 / 0.48);
	padding: 1rem;
`;

const CollectionDialog = styled.section`
	position: relative;
	width: min(100%, 42rem);
	max-height: min(94dvh, 42rem);
	overflow: hidden;
	border-radius: 0.75rem;
	background: #f2efed;
	padding: 1.25rem 1.5rem 1.5rem;
	box-shadow: 0 1.25rem 3.5rem rgb(4 18 26 / 0.18);
`;

const ModalTitle = styled.h2`
	margin: 0 3rem 1.75rem;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.35rem;
	font-weight: 600;
	line-height: 1.2;
	text-align: center;
`;

const ModalCloseButton = styled.button`
	position: absolute;
	top: 1.35rem;
	right: 1.55rem;
	display: inline-flex;
	width: 1.6rem;
	height: 1.6rem;
	align-items: center;
	justify-content: center;
	border: 0;
	border-radius: 50%;
	background: #bab7b4;
	color: #f2efed;
	cursor: pointer;

	& svg {
		width: 1rem;
		height: 1rem;
	}

	&:hover,
	&:focus-visible {
		background: ${theme.colors.orangeLight};
		outline: none;
	}
`;

const CollectionList = styled.div<{ $allowScroll: boolean }>`
	display: grid;
	max-height: ${({ $allowScroll }) => ($allowScroll ? "23.75rem" : "none")};
	overflow-y: ${({ $allowScroll }) => ($allowScroll ? "auto" : "visible")};
	gap: 0.9rem;
	padding: 0.1rem 0.5rem 0.25rem 0;
	scrollbar-color: #bab7b4 transparent;

	&::-webkit-scrollbar {
		width: 0.45rem;
	}

	&::-webkit-scrollbar-thumb {
		border-radius: 999px;
		background: #bab7b4;
	}
`;

const CreateCollectionButton = styled.button`
	display: grid;
	align-items: center;
	grid-template-columns: 4.625rem minmax(0, 1fr);
	gap: 0.95rem;
	border: 0;
	background: transparent;
	padding: 0;
	color: ${theme.colors.foreground};
	cursor: pointer;
	text-align: left;

	&:hover,
	&:focus-visible {
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;

const CreateCollectionIcon = styled.span`
	display: inline-flex;
	width: 4.625rem;
	height: 4.625rem;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: ${theme.colors.orangeLight};
	color: ${theme.colors.invertedText};

	& svg {
		width: 2.35rem;
		height: 2.35rem;
	}
`;

const CreateCollectionText = styled.span`
	font-family: ${theme.fonts.sans};
	font-size: 1.25rem;
	font-weight: 700;
	line-height: 1.2;
`;

const CollectionOption = styled.button`
	display: grid;
	align-items: start;
	grid-template-columns: 4.125rem minmax(0, 1fr) 2rem;
	gap: 0.85rem;
	border: 0;
	border-radius: 0.6rem;
	background: transparent;
	padding: 0.35rem 0.45rem 0.35rem 0;
	color: ${theme.colors.foreground};
	cursor: pointer;
	text-align: left;

	&:hover,
	&:focus-visible {
		background: rgb(218 142 91 / 0.08);
		outline: none;
	}

	&:disabled {
		cursor: wait;
		opacity: 0.68;
	}
`;

const CollectionCover = styled.span<{
	$coverUrl?: string;
	$variant: "image" | "color";
}>`
	display: inline-flex;
	width: 4.125rem;
	height: 4.125rem;
	border-radius: 50%;
	background: ${({ $coverUrl, $variant }) =>
		$coverUrl
			? `url("${$coverUrl}") center / cover no-repeat`
			: $variant === "image"
				? "url('/images/welcome-fantasy-library.png') center / cover no-repeat"
				: "#74cfdd"};
`;

const CollectionMeta = styled.span`
	min-width: 0;
`;

const CollectionName = styled.span`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	min-width: 0;
	overflow: hidden;
	gap: 0.3rem;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.sans};
	font-size: 1rem;
	font-weight: 700;
	line-height: 1.2;
	overflow-wrap: anywhere;

	& svg {
		width: 1rem;
		height: 1rem;
		flex: 0 0 auto;
	}
`;

const CollectionOwner = styled.span`
	display: block;
	margin-top: 0.25rem;
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.82rem;
	line-height: 1.2;
`;

const CollectionCheckbox = styled.span<{ $isChecked?: boolean }>`
	display: inline-flex;
	width: 1.65rem;
	height: 1.65rem;
	align-items: center;
	justify-content: center;
	justify-self: end;
	align-self: center;
	border: 0.0625rem solid
		${({ $isChecked }) =>
			$isChecked ? theme.colors.orangeLight : "rgb(186 183 180 / 0.78)"};
	border-radius: 0.45rem;
	background: ${({ $isChecked }) =>
		$isChecked ? theme.colors.orangeLight : "transparent"};
	color: ${theme.colors.invertedText};

	& svg {
		width: 1.1rem;
		height: 1.1rem;
	}
`;

const CollectionMessage = styled.p`
	margin: 0.25rem 0 0 5.575rem;
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.9rem;
	line-height: 1.35;

	${CollectionOption} + & {
		margin-left: calc(4.125rem + 0.85rem);
	}
`;
