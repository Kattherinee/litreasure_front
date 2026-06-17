"use client";

import BookmarkIcon from "@mui/icons-material/Bookmark";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import Rating from "@mui/material/Rating";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styled from "styled-components";

import AuthModal, { type IAuthModalMode } from "@/components/pages/AuthModal";
import { useBookCollectionsQuery, type IBook } from "@/shared/api/books";
import {
	useSaveCollectionMutation,
	type IBookCollectionPreview,
} from "@/shared/api/collections";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import { Button } from "@/shared/ui/Button";

interface IBookDetailTabsProps {
	activeTab?: ITabId;
	book: IBook;
	onActiveTabChange?: (tab: ITabId) => void;
}

export type ITabId = "collections" | "description" | "reviews";
type ICollectionFilter = "all" | "saved" | "mine";

const tabs: Array<{
	count?: number;
	id: ITabId;
	label: string;
}> = [
	{ id: "description", label: "Description" },
	{ id: "collections", label: "In collections" },
	// { id: "reviews", label: "Reviews" },
];

const getCollectionOwnerLabel = (collection: IBookCollectionPreview) =>
	collection.source === "open_library"
		? "Litreasure"
		: collection.owner.username || collection.owner.name;

const getCollectionOwnerAvatar = (collection: IBookCollectionPreview) =>
	collection.source === "open_library"
		? "/favicon.ico"
		: collection.owner.avatarUrl || "/favicon.ico";

const BookDetailTabs = ({
	activeTab: controlledActiveTab,
	book,
	onActiveTabChange,
}: IBookDetailTabsProps) => {
	const currentUsername = useAuthStore(
		(state) => state.session?.user?.username,
	);
	const [internalActiveTab, setInternalActiveTab] =
		useState<ITabId>("description");
	const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
	const [canExpandDescription, setCanExpandDescription] = useState(false);
	const [authModalMode, setAuthModalMode] = useState<IAuthModalMode | null>(
		null,
	);
	// const [reviewRating, setReviewRating] = useState(0);
	// const [reviewText, setReviewText] = useState("");
	// const [reviewStatus, setReviewStatus] = useState("");
	const [collectionsFilter, setCollectionsFilter] =
		useState<ICollectionFilter>("all");
	const [savedCollectionOverrides, setSavedCollectionOverrides] = useState<
		Record<string, boolean>
	>({});
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const saveCollectionMutation = useSaveCollectionMutation();
	const descriptionRef = useRef<HTMLParagraphElement | null>(null);
	const description =
		book.description ??
		"A description has not been added for this book yet. You can save it to a collection and return later.";

	const activeTab = controlledActiveTab ?? internalActiveTab;
	const setActiveTab = onActiveTabChange ?? setInternalActiveTab;
	const {
		data: bookCollections = [],
		isError: isCollectionsError,
		isLoading: isCollectionsLoading,
	} = useBookCollectionsQuery(book.id, {
		enabled: activeTab === "collections",
	});
	const [savingCollectionId, setSavingCollectionId] = useState("");
	const [collectionStatus, setCollectionStatus] = useState("");
	const isCollectionMutationPending = saveCollectionMutation.isPending;
	const getIsCollectionSaved = useCallback(
		(collection: IBookCollectionPreview) =>
			savedCollectionOverrides[collection.id] ?? collection.isSaved ?? false,
		[savedCollectionOverrides],
	);
	const visibleCollections = useMemo(() => {
		let filtered = bookCollections;
		if (collectionsFilter === "saved") {
			filtered = filtered.filter((collection) =>
				getIsCollectionSaved(collection),
			);
		}
		if (collectionsFilter === "mine") {
			if (currentUsername) {
				filtered = filtered.filter(
					(collection) => collection.owner?.username === currentUsername,
				);
			} else {
				filtered = [];
			}
		}
		return filtered;
	}, [
		bookCollections,
		getIsCollectionSaved,
		collectionsFilter,
		currentUsername,
	]);

	useEffect(() => {
		const descriptionNode = descriptionRef.current;

		if (!descriptionNode) {
			return;
		}

		const updateDescriptionOverflow = () => {
			if (isDescriptionExpanded) {
				return;
			}

			setCanExpandDescription(
				descriptionNode.scrollHeight > descriptionNode.clientHeight + 1,
			);
		};

		updateDescriptionOverflow();

		const resizeObserver = new ResizeObserver(updateDescriptionOverflow);
		resizeObserver.observe(descriptionNode);

		return () => {
			resizeObserver.disconnect();
		};
	}, [description, isDescriptionExpanded]);

	const requestAuth = () => {
		setAuthModalMode("login");
	};

	// const handleRatingSelect = (value: number) => {
	// 	if (!isAuthenticated) {
	// 		requestAuth();
	// 		return;
	// 	}

	// 	setReviewRating(value);
	// 	setReviewStatus("");
	// };

	// const handleReviewSubmit = (event: FormEvent<HTMLFormElement>) => {
	// 	event.preventDefault();

	// 	if (!isAuthenticated) {
	// 		requestAuth();
	// 		return;
	// 	}

	// 	if (!reviewRating || !reviewText.trim()) {
	// 		setReviewStatus("Set a rating and write a review.");
	// 		return;
	// 	}

	// 	setReviewStatus(
	// 		"Review is ready to submit. API method will be connected later.",
	// 	);
	// };

	const handleSaveCollection = async (collection: IBookCollectionPreview) => {
		setCollectionStatus("");

		if (!isAuthenticated) {
			requestAuth();
			return;
		}

		if (getIsCollectionSaved(collection)) {
			return;
		}

		try {
			setSavingCollectionId(collection.id);
			setSavedCollectionOverrides((currentState) => ({
				...currentState,
				[collection.id]: true,
			}));
			await saveCollectionMutation.mutateAsync(collection.id);
			setCollectionStatus("Collection saved");
		} catch (error) {
			setSavedCollectionOverrides((currentState) => ({
				...currentState,
				[collection.id]: collection.isSaved ?? false,
			}));
			setCollectionStatus(
				error instanceof Error
					? error.message
					: "Could not update collection save state",
			);
		} finally {
			setSavingCollectionId("");
		}
	};

	return (
		<TabsBlock>
			<Tabs role="tablist" aria-label="Book sections">
				{tabs.map((tab) => {
					const isActive = activeTab === tab.id;

					return (
						<TabButton
							key={tab.id}
							aria-controls={`book-${tab.id}-panel`}
							aria-selected={isActive}
							$isActive={isActive}
							id={`book-${tab.id}-tab`}
							role="tab"
							type="button"
							onClick={() => setActiveTab(tab.id)}
						>
							{tab.label}
							{tab.count ? <Counter>{tab.count}</Counter> : null}
						</TabButton>
					);
				})}
			</Tabs>

			<TabPanel
				aria-labelledby={`book-${activeTab}-tab`}
				id={`book-${activeTab}-panel`}
				role="tabpanel"
			>
				{activeTab === "description" ? (
					<DescriptionWrap>
						<Description
							ref={descriptionRef}
							$isExpanded={isDescriptionExpanded}
						>
							{description}
						</Description>
						{canExpandDescription || isDescriptionExpanded ? (
							<DescriptionToggle
								$isExpanded={isDescriptionExpanded}
								type="button"
								onClick={() =>
									setIsDescriptionExpanded((currentState) => !currentState)
								}
							>
								{isDescriptionExpanded ? "Collapse" : "Show more"}
							</DescriptionToggle>
						) : null}
					</DescriptionWrap>
				) : null}

				{activeTab === "collections" ? (
					<CollectionsPanel>
						{bookCollections.length > 0 ? (
							<CollectionsFilter aria-label="Collection filter">
								<CollectionsFilterButton
									$isActive={collectionsFilter === "all"}
									type="button"
									onClick={() => setCollectionsFilter("all")}
								>
									All
								</CollectionsFilterButton>
								<CollectionsFilterButton
									$isActive={collectionsFilter === "saved"}
									type="button"
									onClick={() => setCollectionsFilter("saved")}
								>
									Saved
								</CollectionsFilterButton>
								<CollectionsFilterButton
									$isActive={collectionsFilter === "mine"}
									type="button"
									onClick={() => setCollectionsFilter("mine")}
								>
									Created by me
								</CollectionsFilterButton>
							</CollectionsFilter>
						) : null}
						{isCollectionsLoading ? (
							<PlaceholderText>Loading collections...</PlaceholderText>
						) : null}
						{isCollectionsError ? (
							<PlaceholderText>Could not load collections.</PlaceholderText>
						) : null}
						{!isCollectionsLoading &&
						!isCollectionsError &&
						bookCollections.length === 0 ? (
							<PlaceholderText>
								This book has not been added to public collections yet.
							</PlaceholderText>
						) : null}
						{collectionsFilter !== "all" &&
						!isCollectionsLoading &&
						!isCollectionsError &&
						bookCollections.length > 0 &&
						visibleCollections.length === 0 ? (
							<PlaceholderText>
								{collectionsFilter === "mine"
									? "There are no collections created by you for this book yet."
									: "This book is not saved in your collections yet."}
							</PlaceholderText>
						) : null}
						{visibleCollections.length > 0 ? (
							<CollectionsList>
								{visibleCollections.map((collection) => {
									const isSaved = getIsCollectionSaved(collection);
									const isMyCollection =
										!!currentUsername &&
										collection.owner?.username === currentUsername;
									const shouldShowSavedLikeFlag = isSaved || isMyCollection;
									const isPending =
										isCollectionMutationPending &&
										savingCollectionId === collection.id;

									return (
										<CompactCollectionCard key={collection.id}>
											<CompactCollectionLink
												href={`/collections/${collection.id}`}
											>
												<CompactCollectionTitle>
													{collection.title}
												</CompactCollectionTitle>
												<CompactCollectionMeta>
													<OwnerAvatar
														alt=""
														src={getCollectionOwnerAvatar(collection)}
													/>
													<span>{getCollectionOwnerLabel(collection)}</span>
													<MetaDot />
													<span>{collection.bookCount} books</span>
												</CompactCollectionMeta>
												{collection.description ? (
													<CompactDescription>
														{collection.description}
													</CompactDescription>
												) : null}
											</CompactCollectionLink>
											{shouldShowSavedLikeFlag ? (
												<CompactSavedFlag
													aria-label={
														isMyCollection
															? "Collection created by you and saved"
															: "Collection saved"
													}
													title={isMyCollection ? "Created by you" : "Saved"}
												>
													<BookmarkIcon aria-hidden="true" />
												</CompactSavedFlag>
											) : (
												<CompactSaveButton
													buttonType="containedInverted"
													disabled={isPending}
													type="button"
													onClick={() => void handleSaveCollection(collection)}
												>
													<span>{isPending ? "Saving..." : "Save"}</span>
												</CompactSaveButton>
											)}
										</CompactCollectionCard>
									);
								})}
							</CollectionsList>
						) : null}
						{collectionStatus ? (
							<CollectionStatus role="status">
								{collectionStatus}
							</CollectionStatus>
						) : null}
					</CollectionsPanel>
				) : null}

				{/* {activeTab === "reviews" ? (
					<ReviewsPanel>
						<PlaceholderText>
							No reviews have been added for this book yet.
						</PlaceholderText>

						<ReviewForm onSubmit={handleReviewSubmit}>
							<ReviewFormHeader>
								<ReviewTitle>Leave a review</ReviewTitle>
								{!isAuthenticated ? (
									<ReviewHint>Sign in to leave a review.</ReviewHint>
								) : null}
							</ReviewFormHeader>
							<ReviewMuiRating
								name="review-rating"
								value={reviewRating}
								onChange={(_, value) => handleRatingSelect(value ?? 0)}
							/>

							<RatingPicker aria-label="Book rating">
								{[1, 2, 3, 4, 5].map((value) => {
									const isActive = value <= reviewRating;

									return (
										<RatingButton
											key={value}
											aria-label={`${value} out of 5`}
											type="button"
											onClick={() => handleRatingSelect(value)}
										>
											{isActive ? (
												<StarIcon aria-hidden="true" />
											) : (
												<StarBorderIcon aria-hidden="true" />
											)}
										</RatingButton>
									);
								})}
							</RatingPicker>

							<ReviewTextarea
								disabled={!isAuthenticated}
								placeholder={
									isAuthenticated
										? "What stood out, resonated, or did not work for you?"
										: "Sign in to write a review"
								}
								value={reviewText}
								onChange={(event) => {
									setReviewText(event.target.value);
									setReviewStatus("");
								}}
							/>

							<ReviewActions>
								{!isAuthenticated ? (
									<AuthRequiredButton type="button" onClick={requestAuth}>
										Sign in and leave a review
									</AuthRequiredButton>
								) : (
									<SubmitReviewButton type="submit">Publish</SubmitReviewButton>
								)}
							</ReviewActions>

							{reviewStatus ? (
								<ReviewStatus role="status">{reviewStatus}</ReviewStatus>
							) : null}
						</ReviewForm>
					</ReviewsPanel>
				) : null} */}
			</TabPanel>

			{authModalMode ? (
				<AuthModal
					mode={authModalMode}
					redirectOnSuccess={false}
					onClose={() => setAuthModalMode(null)}
					onModeChange={setAuthModalMode}
				/>
			) : null}
		</TabsBlock>
	);
};

export default BookDetailTabs;

const TabsBlock = styled.section`
	min-width: 0;
	margin-top: 1.6rem;
	overflow: hidden;

	@media (max-width: 47.9375rem) {
		margin-top: 1.2rem;
	}
`;

const Tabs = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 2rem;

	@media (max-width: 56rem) {
		flex-wrap: wrap;
		gap: 1.75rem;
		align-items: center;
		align-self: center;
	}
`;

const TabButton = styled.button<{ $isActive: boolean }>`
	position: relative;
	display: inline-flex;
	align-items: baseline;
	border: 0;
	background: ${theme.colors.transparent};
	padding: 0 0 0.5rem;
	color: ${({ $isActive }) =>
		$isActive ? theme.colors.black : theme.colors.lightText};
	cursor: pointer;
	font-family: ${theme.fonts.serif};
	font-size: 1.225rem;
	font-weight: 500;
	line-height: 1.35;
	transition: color 180ms ease;

	&::after {
		position: absolute;
		right: 0;
		bottom: 0;
		left: 0;
		height: 0.1375rem;
		background: ${({ $isActive }) =>
			$isActive ? theme.colors.orangeDark : theme.colors.transparent};
		content: "";
	}

	&:hover,
	&:focus-visible {
		color: ${theme.colors.orangeDark};
		outline: none;
	}

	@media (max-width: 56rem) {
		font-size: 1.05rem;
	}
`;

const Counter = styled.span`
	margin-left: 0.4rem;
	color: ${theme.colors.muted};
	font-family: ${theme.fonts.sans};
	font-size: 1.25rem;
	font-weight: 400;
`;

const TabPanel = styled.div`
	min-width: 0;
	min-height: 8rem;
`;

const DescriptionWrap = styled.div`
	position: relative;
	max-width: 100%;
`;

const Description = styled.p<{ $isExpanded: boolean }>`
	max-width: 100%;
	margin: 1.2rem 0 0;
	overflow: hidden;
	color: ${theme.colors.black};
	font-family: ${theme.fonts.sans};
	font-size: 1.05rem;
	line-height: 1.7;
	overflow-wrap: anywhere;
	${({ $isExpanded }) =>
		$isExpanded
			? ""
			: `
				display: -webkit-box;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 4;
			`}

	@media (max-width: 56rem) {
		font-size: 1rem;
	}
`;

const DescriptionToggle = styled.button<{ $isExpanded: boolean }>`
	position: ${({ $isExpanded }) => ($isExpanded ? "static" : "absolute")};
	right: 0;
	bottom: 0.12rem;
	display: block;
	border: 0;
	background: linear-gradient(
		90deg,
		rgb(232 226 222 / 0),
		${theme.colors.background} 3.1rem,
		${theme.colors.background}
	);
	margin-top: ${({ $isExpanded }) => ($isExpanded ? "0.5rem" : "0")};
	margin-left: ${({ $isExpanded }) => ($isExpanded ? "auto" : "0")};
	padding: 0 0 0 3.7rem;
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.95rem;
	line-height: 1.7;
	transition: color 180ms ease;

	&:hover,
	&:focus-visible {
		color: ${theme.colors.orangePrimary};
		outline: none;
	}
`;

const PlaceholderText = styled.p`
	margin: 1.2rem 0 0;
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 1rem;
	line-height: 1.5;
`;

const CollectionsPanel = styled.div`
	max-width: 48rem;
	margin-top: 1.2rem;
`;

const CollectionsFilter = styled.div`
	display: inline-flex;
	gap: 0.2rem;
	border: 0.0625rem solid rgb(218 142 91 / 0.24);
	border-radius: 999rem;
	background: rgb(242 239 237 / 0.72);
	margin-bottom: 0.9rem;
	padding: 0.2rem;
`;

const CollectionsFilterButton = styled.button<{ $isActive: boolean }>`
	border: 0;
	border-radius: 999rem;
	background: ${({ $isActive }) =>
		$isActive ? theme.colors.bluePrimary : theme.colors.transparent};
	padding: 0.38rem 0.85rem;
	color: ${({ $isActive }) =>
		$isActive ? theme.colors.invertedText : theme.colors.softForeground};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.84rem;
	line-height: 1.2;
	transition:
		background 180ms ease,
		color 180ms ease;

	&:hover,
	&:focus-visible {
		background: ${({ $isActive }) =>
			$isActive ? theme.colors.bluePrimary : theme.alpha.blueWash};
		color: ${({ $isActive }) =>
			$isActive ? theme.colors.invertedText : theme.colors.foreground};
		outline: none;
	}
`;

const CollectionsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.8rem;
`;

const CompactCollectionCard = styled.article`
	display: grid;
	align-items: center;
	gap: 1rem;
	grid-template-columns: minmax(0, 1fr) auto;
	border: 0.0625rem solid rgb(218 142 91 / 0.18);
	border-radius: 0.9rem;
	background: rgb(242 239 237 / 0.58);
	padding: 1rem;

	@media (max-width: 36rem) {
		grid-template-columns: 1fr;
	}
`;

const CompactCollectionLink = styled(Link)`
	min-width: 0;
	color: inherit;
	text-decoration: none;

	&:hover h3,
	&:focus-visible h3 {
		color: ${theme.colors.orangeDark};
		text-decoration: underline;
		text-underline-offset: 0.16rem;
	}
`;

const CompactCollectionTitle = styled.h3`
	margin: 0;
	overflow: hidden;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.2rem;
	font-weight: 600;
	line-height: 1.2;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const CompactCollectionMeta = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.4rem;
	margin-top: 0.4rem;
	color: ${theme.colors.softForeground};
	font-size: 0.82rem;
	line-height: 1.25;
`;

const OwnerAvatar = styled.img`
	width: 1.25rem;
	height: 1.25rem;
	border-radius: 50%;
	object-fit: cover;
`;

const MetaDot = styled.span`
	width: 0.25rem;
	height: 0.25rem;
	border-radius: 50%;
	background: ${theme.colors.muted};
`;

const CompactDescription = styled.p`
	display: -webkit-box;
	margin: 0.45rem 0 0;
	overflow: hidden;
	color: ${theme.colors.softForeground};
	font-size: 0.88rem;
	line-height: 1.4;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
`;

const CompactSaveButton = styled(Button)`
	&& {
		gap: 0.35rem;
		padding: 0.5rem 0.9rem;
		font-family: ${theme.fonts.sans};
		font-size: 0.86rem;
		white-space: nowrap;

		svg {
			width: 1rem;
			height: 1rem;
		}
	}
`;

const CompactSavedFlag = styled.span`
	display: inline-grid;
	width: 2.4rem;
	height: 2.4rem;
	place-items: center;
	border-radius: 50%;
	background: rgb(255 255 255 / 0.86);
	color: ${theme.colors.orangePrimary};

	svg {
		width: 1.35rem;
		height: 1.35rem;
	}
`;

const CollectionStatus = styled.p`
	margin: 0.7rem 0 0;
	color: ${theme.colors.orangeDark};
	font-size: 0.86rem;
	line-height: 1.35;
`;

const ReviewsPanel = styled.div`
	max-width: 44rem;
`;

const ReviewForm = styled.form`
	display: flex;
	flex-direction: column;
	gap: 0.85rem;
	margin-top: 1.4rem;
	border: 0.0625rem solid rgb(218 142 91 / 0.2);
	border-radius: 0.75rem;
	background: rgb(242 239 237 / 0.48);
	padding: 1rem;
`;

const ReviewFormHeader = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`;

const ReviewTitle = styled.h3`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.2rem;
	line-height: 1.2;
`;

const ReviewHint = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.92rem;
	line-height: 1.4;
`;

const ReviewMuiRating = styled(Rating)`
	color: ${theme.colors.orangePrimary};

	& .MuiRating-icon {
		width: 2.35rem;
		height: 2.35rem;
	}

	& .MuiSvgIcon-root {
		width: 1.65rem;
		height: 1.65rem;
	}
`;

const RatingPicker = styled.div`
	display: none;
	gap: 0.15rem;
`;

const RatingButton = styled.button`
	display: inline-grid;
	width: 2.35rem;
	height: 2.35rem;
	place-items: center;
	border: 0;
	background: transparent;
	padding: 0;
	color: ${theme.colors.orangePrimary};
	cursor: pointer;

	& svg {
		width: 1.65rem;
		height: 1.65rem;
	}

	&:hover,
	&:focus-visible {
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;

const ReviewTextarea = styled.textarea`
	min-height: 7rem;
	resize: vertical;
	border: 0.0625rem solid ${theme.colors.border};
	border-radius: 0.75rem;
	background: rgb(242 239 237 / 0.86);
	padding: 0.8rem 0.9rem;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.sans};
	font-size: 1rem;
	line-height: 1.5;

	&:focus,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		outline: none;
	}

	&:disabled {
		color: ${theme.colors.inputDisabledText};
		cursor: not-allowed;
	}
`;

const ReviewActions = styled.div`
	display: flex;
	justify-content: flex-end;
`;

const SubmitReviewButton = styled.button`
	border: 0;
	border-radius: 62.4375rem;
	background: ${theme.colors.orangeLight};
	padding: 0.55rem 1.2rem;
	color: ${theme.colors.invertedText};
	cursor: pointer;
	font-family: ${theme.fonts.serif};
	font-size: 1rem;
	font-weight: 700;
	transition:
		background 180ms ease,
		color 180ms ease;

	&:hover,
	&:focus-visible {
		background: ${theme.colors.bluePrimary};
		outline: none;
	}
`;

const AuthRequiredButton = styled(SubmitReviewButton)`
	background: ${theme.colors.bluePrimary};

	&:hover,
	&:focus-visible {
		background: ${theme.colors.orangeLight};
	}
`;

const ReviewStatus = styled.p`
	margin: -0.25rem 0 0;
	color: ${theme.colors.orangeDark};
	font-family: ${theme.fonts.sans};
	font-size: 0.92rem;
	line-height: 1.4;
`;
