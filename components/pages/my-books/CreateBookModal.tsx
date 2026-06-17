"use client";

import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import type { KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import styled from "styled-components";

import {
	type IBook,
	type ICreateBookPayload,
	useBookQuery,
	useCreateBookMutation,
	useDeleteBookMutation,
	useUpdateBookMutation,
} from "@/shared/api/books";
import { useGenresQuery } from "@/shared/api/genres";
import { theme } from "@/shared/theme";
import {
	AuthorMultiSelectField,
	type ISelectedAuthorOption,
} from "@/shared/ui/AuthorMultiSelectField";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { FormModal } from "@/shared/ui/FormModal";
import { ImageUploadField } from "@/shared/ui/ImageUploadField";
import { Button } from "@/shared/ui/Button";

interface ICreateBookModalProps {
	initialAuthors?: ISelectedAuthorOption[];
	initialTitle?: string;
	bookId?: string;
	onClose: () => void;
	onCreated?: (book: IBook) => void;
	onCreateError?: (message: string) => void;
	onDeleted?: (bookId: string) => void;
	onUpdated?: (book: IBook) => void;
}

type ICreateBookFormState = {
	coverUrl: string;
	description: string;
	genreInput: string;
	genres: string[];
	language: string;
	pagesCount: string;
	publishedYear: string;
	publisher: string;
	rating: number;
	title: string;
};

const bookCoverRules = {
	allowedMaxRatio: 0.86,
	allowedMinHeight: 750,
	allowedMinRatio: 0.56,
	allowedMinWidth: 500,
	idealHeight: 1500,
	idealRatio: 2 / 3,
	idealWidth: 1000,
};

const createDefaultBookForm = (): ICreateBookFormState => ({
	coverUrl: "",
	description: "",
	genreInput: "",
	genres: [],
	language: "",
	pagesCount: "",
	publishedYear: "",
	publisher: "",
	rating: 0,
	title: "",
});

export const CreateBookModal = ({
	initialAuthors = [],
	initialTitle = "",
	bookId,
	onClose,
	onCreated,
	onCreateError,
	onDeleted,
	onUpdated,
}: ICreateBookModalProps) => {
	const isEditMode = Boolean(bookId);
	const createBookMutation = useCreateBookMutation();
	const updateBookMutation = useUpdateBookMutation();
	const deleteBookMutation = useDeleteBookMutation();
	const { data: editingBook } = useBookQuery(bookId ?? "");
	const { data: genreSuggestionsSource = [] } = useGenresQuery();
	const [form, setForm] = useState<ICreateBookFormState>(createDefaultBookForm);
	const [selectedAuthors, setSelectedAuthors] = useState<ISelectedAuthorOption[]>(
		[],
	);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [error, setError] = useState("");
	const normalizedGenreInput = form.genreInput.trim().toLowerCase();
	const genreSuggestions = genreSuggestionsSource
		.filter((genre) => {
			const isAlreadySelected = form.genres.some(
				(selectedGenre) =>
					selectedGenre.toLowerCase() === genre.name.toLowerCase(),
			);
			if (isAlreadySelected) return false;
			if (!normalizedGenreInput) return true;

			return genre.name.toLowerCase().includes(normalizedGenreInput);
		})
		.slice(0, 6);

	useEffect(() => {
		if (!isEditMode || !editingBook) return;
		setForm({
			coverUrl: editingBook.coverUrl ?? "",
			description: editingBook.description ?? "",
			genreInput: "",
			genres: (editingBook.genres ?? []).map((genre) => genre.name),
			language: editingBook.language ?? "",
			pagesCount: editingBook.pagesCount ? String(editingBook.pagesCount) : "",
			publishedYear: editingBook.publishedYear
				? String(editingBook.publishedYear)
				: "",
			publisher: editingBook.publisher ?? "",
			rating: editingBook.rating ?? 0,
			title: editingBook.title ?? "",
		});
		setSelectedAuthors(
			(editingBook.authors ?? []).map((author) => ({
				id: author.id,
				name: author.name,
			})),
		);
	}, [editingBook, isEditMode]);

	useEffect(() => {
		if (isEditMode) {
			return;
		}

		if (initialTitle.trim()) {
			setForm((current) =>
				current.title.trim() ? current : { ...current, title: initialTitle },
			);
		}

		if (initialAuthors.length > 0) {
			setSelectedAuthors((current) =>
				current.length > 0 ? current : initialAuthors,
			);
		}
	}, [initialAuthors, initialTitle, isEditMode]);

	const closeModal = () => {
		if (
			createBookMutation.isPending ||
			updateBookMutation.isPending ||
			deleteBookMutation.isPending
		) {
			return;
		}
		setError("");
		setForm(createDefaultBookForm());
		setSelectedAuthors([]);
		onClose();
	};

	const updateForm = (
		field: keyof ICreateBookFormState,
		value: ICreateBookFormState[keyof ICreateBookFormState],
	) => {
		setError("");
		setForm((current) => ({ ...current, [field]: value }));
	};

	const addGenre = (rawGenre: string) => {
		const genre = rawGenre.trim();
		const isAlreadySelected = form.genres.some(
			(selectedGenre) => selectedGenre.toLowerCase() === genre.toLowerCase(),
		);
		if (!genre || isAlreadySelected) return;

		setError("");
		setForm((current) => ({
			...current,
			genreInput: "",
			genres: [...current.genres, genre],
		}));
	};

	const removeGenre = (genre: string) => {
		setForm((current) => ({
			...current,
			genres: current.genres.filter((item) => item !== genre),
		}));
	};

	const handleGenreKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter" || event.key === ",") {
			event.preventDefault();
			addGenre(form.genreInput);
		}
	};

	const isBookFormValid =
		Boolean(form.title.trim()) &&
		Boolean(form.description.trim()) &&
		Boolean(form.coverUrl.trim()) &&
		form.genres.length > 0 &&
		selectedAuthors.length > 0;

	const handleSubmit = async () => {
		setError("");

		const title = form.title.trim();
		const pendingGenre = form.genreInput.trim();
		const genres = pendingGenre
			? Array.from(new Set([...form.genres, pendingGenre]))
			: form.genres;

		if (!title || selectedAuthors.length === 0) {
			setError("Please provide title and author.");
			return;
		}

		const payload: ICreateBookPayload = {
			authorIds: selectedAuthors.map((item) => item.id),
			genres,
			title,
		};
		const description = form.description.trim();
		const coverUrl = form.coverUrl.trim();
		const publishedYear = Number(form.publishedYear);
		const pagesCount = Number(form.pagesCount);
		const publisher = form.publisher.trim();
		const language = form.language.trim();

		if (description) payload.description = description;
		if (coverUrl) payload.coverUrl = coverUrl;
		if (publisher) payload.publisher = publisher;
		if (language) payload.language = language;
		if (Number.isFinite(pagesCount) && pagesCount > 0) {
			payload.pagesCount = Math.round(pagesCount);
		}
		if (Number.isFinite(publishedYear) && publishedYear > 0) {
			payload.publishedYear = Math.round(publishedYear);
		}
		if (Number.isFinite(form.rating) && form.rating > 0) {
			payload.rating = Math.min(5, Math.max(0, form.rating));
		}

		try {
			if (isEditMode && bookId) {
				const book = await updateBookMutation.mutateAsync({
					id: bookId,
					payload,
				});
				setError("");
				onUpdated?.(book);
				onClose();
				return;
			}

			const book = await createBookMutation.mutateAsync(payload);
			setError("");
			setForm(createDefaultBookForm());
			setSelectedAuthors([]);
			onCreated?.(book);
			onClose();
		} catch (caughtError) {
			const message =
				caughtError instanceof Error
					? caughtError.message
					: "Failed to create book.";
			setError(message);
			onCreateError?.(message);
		}
	};

	const handleDelete = async () => {
		if (!bookId) return;

		try {
			await deleteBookMutation.mutateAsync(bookId);
			setIsDeleteConfirmOpen(false);
			onDeleted?.(bookId);
			onClose();
		} catch (caughtError) {
			const message =
				caughtError instanceof Error
					? caughtError.message
					: "Failed to delete book.";
			setError(message);
			onCreateError?.(message);
			setIsDeleteConfirmOpen(false);
		}
	};

	return (
		<>
		<FormModal
			isSaveDisabled={!isBookFormValid}
			isSaving={createBookMutation.isPending || updateBookMutation.isPending}
			leftAction={
				isEditMode ? (
					<DeleteButton
						buttonType="outlined"
						disabled={deleteBookMutation.isPending}
						type="button"
						onClick={() => setIsDeleteConfirmOpen(true)}
					>
						Delete book
					</DeleteButton>
				) : undefined
			}
			saveLabel={isEditMode ? "Save changes" : "Create book"}
			savingLabel={isEditMode ? "Saving..." : "Creating..."}
			title={isEditMode ? "Edit book" : "New book"}
			onClose={closeModal}
			onSave={handleSubmit}
		>
			<Form onSubmit={(event) => event.preventDefault()}>
						<Top>
							<CoverColumn>
								<CoverLabel $required>Cover</CoverLabel>
								<ImageUploadField
									aspectRatio={bookCoverRules.idealRatio}
									cropLabel="Crop and upload"
									cropMessage="Image dimensions are not suitable. Choose a new image or crop this one."
									idealHeight={bookCoverRules.idealHeight}
									idealWidth={bookCoverRules.idealWidth}
									placeholderHint="Best ratio 2:3, minimum 500x750 px"
									placeholderText="Upload cover"
									purpose="book-cover"
									shape="square"
									value={form.coverUrl}
									validation={{
										maxRatio: bookCoverRules.allowedMaxRatio,
										minHeight: bookCoverRules.allowedMinHeight,
										minRatio: bookCoverRules.allowedMinRatio,
										minWidth: bookCoverRules.allowedMinWidth,
									}}
									onChange={(url) => updateForm("coverUrl", url)}
									onError={(message) => setError(message)}
								/>
							</CoverColumn>
							<TopFields>
								<FormField>
									<FormLabel $required>Title</FormLabel>
									<FormInput
										required
										value={form.title}
										onChange={(event) =>
											updateForm("title", event.target.value)
										}
									/>
								</FormField>
								<FormField>
									<AuthorMultiSelectField
										required
										error={
											error && selectedAuthors.length === 0
												? "Select at least one author."
												: undefined
										}
										selectedAuthors={selectedAuthors}
										onChange={(authors) => {
											setError("");
											setSelectedAuthors(authors);
										}}
									/>
								</FormField>
								<FormField>
									<FormLabel>Genres</FormLabel>
									<TagInputRow>
										{form.genres.map((genre) => (
											<TagChip key={genre}>
												<span>{genre}</span>
												<TagRemoveButton
													aria-label={`Remove genre ${genre}`}
													type="button"
													onClick={() => removeGenre(genre)}
												>
													×
												</TagRemoveButton>
											</TagChip>
										))}
										<TagInput
											placeholder="For example: fantasy, romance, detective"
											value={form.genreInput}
											onBlur={() => addGenre(form.genreInput)}
											onChange={(event) =>
												updateForm("genreInput", event.target.value)
											}
											onKeyDown={handleGenreKeyDown}
										/>
									</TagInputRow>
									{genreSuggestions.length > 0 || form.genreInput.trim() ? (
										<TagSuggestions>
											{genreSuggestions.map((genre) => (
												<TagSuggestionButton
													key={genre.id}
													type="button"
													onMouseDown={(event) => event.preventDefault()}
													onClick={() => addGenre(genre.name)}
												>
													{genre.name}
												</TagSuggestionButton>
											))}
											{form.genreInput.trim() &&
											!form.genres.some(
												(genre) =>
													genre.toLowerCase() ===
													form.genreInput.trim().toLowerCase(),
											) ? (
												<TagSuggestionButton
													type="button"
													onMouseDown={(event) => event.preventDefault()}
													onClick={() => addGenre(form.genreInput)}
												>
													Add {form.genreInput.trim()}
												</TagSuggestionButton>
											) : null}
										</TagSuggestions>
									) : null}
								</FormField>
							</TopFields>
						</Top>
						<FormField>
							<FormLabel $required>Description</FormLabel>
							<FormTextarea
								rows={4}
								value={form.description}
								onChange={(event) =>
									updateForm("description", event.target.value)
								}
							/>
						</FormField>
						<FormGrid $columns={3}>
							<FormField>
								<FormLabel>Publication year</FormLabel>
								<FormInput
									inputMode="numeric"
									pattern="[0-9]*"
									type="text"
									value={form.publishedYear}
									onChange={(event) =>
										updateForm(
											"publishedYear",
											event.target.value.replace(/\D/g, ""),
										)
									}
								/>
							</FormField>
							<FormField>
								<FormLabel>Pages</FormLabel>
								<FormInput
									inputMode="numeric"
									pattern="[0-9]*"
									type="text"
									value={form.pagesCount}
									onChange={(event) =>
										updateForm(
											"pagesCount",
											event.target.value.replace(/\D/g, ""),
										)
									}
								/>
							</FormField>
							<FormField>
								<FormLabel>Rating</FormLabel>
								<RatingStars>
									{[1, 2, 3, 4, 5].map((star) => {
										const isActive = form.rating >= star;

										return (
											<StarButton
												key={star}
												$isActive={isActive}
												aria-label={`${star} of 5`}
												type="button"
												onClick={() => updateForm("rating", star)}
											>
												{isActive ? (
													<StarIcon aria-hidden="true" />
												) : (
													<StarBorderIcon aria-hidden="true" />
												)}
											</StarButton>
										);
									})}
									{form.rating > 0 ? (
										<ClearRatingButton
											type="button"
											onClick={() => updateForm("rating", 0)}
										>
											Clear
										</ClearRatingButton>
									) : null}
								</RatingStars>
							</FormField>
						</FormGrid>
						<FormGrid>
							<FormField>
								<FormLabel>Publisher</FormLabel>
								<FormInput
									value={form.publisher}
									onChange={(event) =>
										updateForm("publisher", event.target.value)
									}
								/>
							</FormField>
							<FormField>
								<FormLabel>Language</FormLabel>
								<FormInput
									placeholder="For example: English"
									value={form.language}
									onChange={(event) =>
										updateForm("language", event.target.value)
									}
								/>
							</FormField>
						</FormGrid>
						{error ? <FormError role="alert">{error}</FormError> : null}
					</Form>
		</FormModal>
		{isDeleteConfirmOpen ? (
			<ConfirmModal
				confirmLabel="Delete"
				confirmLoadingLabel="Deleting..."
				isLoading={deleteBookMutation.isPending}
				title="Delete this book?"
				onCancel={() => setIsDeleteConfirmOpen(false)}
				onConfirm={() => void handleDelete()}
			>
				This action cannot be undone.
			</ConfirmModal>
		) : null}
		</>
	);
};

const Form = styled.form`
	display: grid;
	gap: 0.85rem;
`;

const Top = styled.div`
	display: grid;
	align-items: start;
	gap: 1rem;
	grid-template-columns: 11rem minmax(0, 1fr);

	@media (max-width: 38rem) {
		grid-template-columns: 1fr;
	}
`;

const CoverColumn = styled.div`
	display: grid;
	gap: 0.65rem;
	justify-items: center;
`;

const TopFields = styled.div`
	display: grid;
	gap: 0.75rem;
`;

const FormGrid = styled.div<{ $columns?: number }>`
	display: grid;
	gap: 0.75rem;
	grid-template-columns: repeat(
		${({ $columns = 2 }) => $columns},
		minmax(0, 1fr)
	);

	@media (max-width: 48rem) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 36rem) {
		grid-template-columns: 1fr;
	}
`;

const FormField = styled.label`
	display: grid;
	gap: 0.35rem;
`;

const FormLabel = styled.span<{ $required?: boolean }>`
	color: ${theme.colors.softForeground};
	font-size: 0.78rem;
	font-weight: 700;

	&::after {
		content: ${({ $required }) => ($required ? '" *"' : '""')};
		color: ${theme.colors.orangeDark};
	}
`;

const CoverLabel = styled(FormLabel)`
	justify-self: start;
	width: 100%;
`;

const fieldStyles = `
	width: 100%;
	border: 0.0625rem solid rgb(211 202 196 / 0.82);
	border-radius: 0.85rem;
	background: rgb(242 239 237 / 0.74);
	padding: 0.72rem 0.8rem;
	color: ${theme.colors.foreground};
	font: inherit;
	font-size: 0.95rem;
	outline: none;
	transition:
		background-color 150ms,
		border-color 150ms,
		box-shadow 150ms;

	&:hover {
		border-color: rgb(218 142 91 / 0.45);
		background: rgb(242 239 237 / 0.92);
	}

	&:focus,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		box-shadow: 0 0 0 0.15rem rgb(218 142 91 / 0.14);
	}
`;

const FormInput = styled.input`
	${fieldStyles}
`;

const FormTextarea = styled.textarea`
	${fieldStyles}
	resize: vertical;
`;

const TagInputRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.45rem;
	min-height: 2.75rem;
	border: 0.0625rem solid rgb(211 202 196 / 0.82);
	border-radius: 0.85rem;
	background: rgb(242 239 237 / 0.74);
	padding: 0.45rem;
`;

const TagChip = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	border: 0.0625rem solid rgb(218 142 91 / 0.28);
	border-radius: 999px;
	background: rgb(218 142 91 / 0.12);
	padding: 0.28rem 0.42rem 0.28rem 0.62rem;
	color: ${theme.colors.orangeDark};
	font-size: 0.82rem;
	font-weight: 700;
`;

const TagRemoveButton = styled.button`
	display: inline-grid;
	width: 1.15rem;
	height: 1.15rem;
	place-items: center;
	border: 0;
	border-radius: 50%;
	background: rgb(255 255 255 / 0.58);
	color: inherit;
	cursor: pointer;
	font: inherit;
	line-height: 1;

	&:hover,
	&:focus-visible {
		background: ${theme.colors.orangeLight};
		color: ${theme.colors.invertedText};
		outline: none;
	}
`;

const TagInput = styled.input`
	min-width: 8rem;
	flex: 1 1 8rem;
	border: 0;
	background: transparent;
	color: ${theme.colors.foreground};
	font: inherit;
	outline: none;
	padding: 0.28rem;
`;

const TagSuggestions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
`;

const TagSuggestionButton = styled.button`
	border: 0.0625rem solid rgb(218 142 91 / 0.3);
	border-radius: 999px;
	background: rgb(242 239 237 / 0.82);
	padding: 0.28rem 0.65rem;
	color: ${theme.colors.softForeground};
	cursor: pointer;
	font: inherit;
	font-size: 0.78rem;
	font-weight: 700;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		background: rgb(218 142 91 / 0.12);
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;

const RatingStars = styled.div`
	display: flex;
	align-items: center;
	gap: 0.2rem;
	min-height: 2.75rem;
`;

const StarButton = styled.button<{ $isActive: boolean }>`
	display: inline-grid;
	width: 2rem;
	height: 2rem;
	place-items: center;
	border: 0;
	border-radius: 50%;
	background: transparent;
	color: ${({ $isActive }) =>
		$isActive ? theme.colors.orangeLight : theme.colors.muted};
	cursor: pointer;
	padding: 0;

	& svg {
		width: 1.45rem;
		height: 1.45rem;
	}

	&:hover,
	&:focus-visible {
		background: rgb(218 142 91 / 0.12);
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;

const ClearRatingButton = styled.button`
	border: 0;
	background: transparent;
	color: ${theme.colors.softForeground};
	cursor: pointer;
	font: inherit;
	font-size: 0.75rem;

	&:hover,
	&:focus-visible {
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;

const FormError = styled.p`
	margin: 0;
	color: #a03434;
	font-size: 0.86rem;
	font-weight: 700;
`;

const DeleteButton = styled(Button)`
	min-height: 2.2rem;
	&& {
		border-color: #b34034;
		color: #b34034;
	}
	&&:hover,
	&&:focus-visible {
		border-color: #a03434;
		background: rgb(179 64 52 / 0.12);
		color: #a03434;
	}
`;
