"use client";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import { CreateAuthorModal } from "@/components/pages/author/CreateAuthorModal";
import { CreateBookModal } from "@/components/pages/my-books/CreateBookModal";
import type { IAuthorDetails, IAuthorPreview } from "@/shared/api/authors";
import { useCreateSeriesMutation } from "@/shared/api/series";
import type { ISearchAuthor, ISearchBook } from "@/shared/api/search";
import {
	useSearchAuthorsQuery,
	useSearchBooksQuery,
} from "@/shared/api/search";
import type { ISelectedAuthorOption } from "@/shared/ui/AuthorMultiSelectField";
import { FormModal } from "@/shared/ui/FormModal";
import { ImageUploadField } from "@/shared/ui/ImageUploadField";
import { theme } from "@/shared/theme";
import { useDebouncedValue } from "@/shared/utils/useDebouncedValue";

interface ICreateSeriesModalProps {
	onClose: () => void;
	onCreated?: () => void;
	onCreateError?: (message: string) => void;
}

type ISelectedBookOption = {
	authorId?: string;
	authorName: string;
	coverUrl?: string;
	id: string;
	title: string;
};

type ICreateSeriesFormState = {
	coverUrl: string;
	title: string;
};

const seriesCoverRules = {
	allowedMaxRatio: 0.86,
	allowedMinHeight: 750,
	allowedMinRatio: 0.56,
	allowedMinWidth: 500,
	idealHeight: 1500,
	idealRatio: 2 / 3,
	idealWidth: 1000,
};
const suggestionStep = 6;

const createDefaultForm = (): ICreateSeriesFormState => ({
	coverUrl: "",
	title: "",
});

const mapAuthor = (
	author: IAuthorPreview | ISearchAuthor,
): ISelectedAuthorOption => ({
	id: author.id,
	name: author.name,
});

const mapBook = (book: ISearchBook): ISelectedBookOption => ({
	authorId: book.authorId,
	authorName: book.author,
	coverUrl: book.coverUrl,
	id: book.id,
	title: book.title,
});

export const CreateSeriesModal = ({
	onClose,
	onCreated,
	onCreateError,
}: ICreateSeriesModalProps) => {
	const createSeriesMutation = useCreateSeriesMutation();
	const [form, setForm] = useState<ICreateSeriesFormState>(createDefaultForm);
	const [selectedAuthors, setSelectedAuthors] = useState<
		ISelectedAuthorOption[]
	>([]);
	const [selectedBooks, setSelectedBooks] = useState<ISelectedBookOption[]>([]);
	const [authorQuery, setAuthorQuery] = useState("");
	const [bookQuery, setBookQuery] = useState("");
	const [error, setError] = useState("");
	const [isCreateAuthorOpen, setIsCreateAuthorOpen] = useState(false);
	const [isCreateBookOpen, setIsCreateBookOpen] = useState(false);
	const [visibleAuthorSuggestions, setVisibleAuthorSuggestions] =
		useState(suggestionStep);
	const [visibleBookSuggestions, setVisibleBookSuggestions] =
		useState(suggestionStep);
	const [createdBookTitle, setCreatedBookTitle] = useState("");
	const [createdBookAuthors, setCreatedBookAuthors] = useState<
		ISelectedAuthorOption[]
	>([]);

	const debouncedAuthorQuery = useDebouncedValue(authorQuery, 250);
	const debouncedBookQuery = useDebouncedValue(bookQuery, 250);

	const selectedAuthorIds = useMemo(
		() => new Set(selectedAuthors.map((author) => author.id)),
		[selectedAuthors],
	);
	const selectedBookAuthorIds = useMemo(
		() =>
			new Set(
				selectedBooks
					.map((book) => book.authorId)
					.filter((authorId): authorId is string => Boolean(authorId)),
			),
		[selectedBooks],
	);
	const normalizedAuthorQuery = debouncedAuthorQuery.trim();
	const normalizedBookQuery = debouncedBookQuery.trim();
	const normalizedAuthorFilter = normalizedAuthorQuery.toLowerCase();
	const normalizedBookFilter = normalizedBookQuery.toLowerCase();
	const authorSearchQuery =
		normalizedAuthorQuery ||
		(selectedBooks.length > 0
			? Array.from(selectedBookAuthorIds)
					.map(
						(authorId) =>
							selectedBooks.find((book) => book.authorId === authorId)
								?.authorName ?? "",
					)
					.filter(Boolean)
					.join(" ")
			: "");
	const bookSearchQuery =
		normalizedBookQuery ||
		(selectedAuthors.length > 0
			? selectedAuthors.map((author) => author.name).join(" ")
			: "");

	const { data: authorsResponse, isFetching: isFetchingAuthors } =
		useSearchAuthorsQuery(authorSearchQuery, 1, 30, {
			enabled: authorSearchQuery.length >= 2,
		});
	const { data: booksResponse, isFetching: isFetchingBooks } =
		useSearchBooksQuery(bookSearchQuery, 1, 30, {
			enabled: bookSearchQuery.length >= 2,
		});
	const authorsData = authorsResponse?.items ?? [];
	const booksData = booksResponse?.items ?? [];

	const authorSuggestions = useMemo(() => {
		const filtered = authorsData
			.filter((author) => !selectedAuthorIds.has(author.id))
			.filter((author) => true);

		const byInput = normalizedAuthorFilter
			? filtered.filter((author) =>
					author.name.toLowerCase().includes(normalizedAuthorFilter),
				)
			: filtered;

		return byInput;
	}, [authorsData, normalizedAuthorFilter, selectedAuthorIds]);

	const bookSuggestions = useMemo(() => {
		const filtered = booksData
			.filter(
				(book) => !selectedBooks.some((selected) => selected.id === book.id),
			)
			.filter((book) =>
				selectedAuthors.length > 0
					? Boolean(book.authorId && selectedAuthorIds.has(book.authorId))
					: true,
			);

		const byInput = normalizedBookFilter
			? filtered.filter((book) =>
					`${book.title} ${book.author}`
						.toLowerCase()
						.includes(normalizedBookFilter),
				)
			: filtered;

		return byInput;
	}, [
		booksData,
		normalizedBookFilter,
		selectedAuthors.length,
		selectedBooks,
		selectedAuthorIds,
	]);
	const visibleAuthorSuggestionItems = authorSuggestions.slice(
		0,
		visibleAuthorSuggestions,
	);
	const visibleBookSuggestionItems = bookSuggestions.slice(
		0,
		visibleBookSuggestions,
	);

	useEffect(() => {
		setVisibleAuthorSuggestions(suggestionStep);
	}, [normalizedAuthorFilter]);

	useEffect(() => {
		setVisibleBookSuggestions(suggestionStep);
	}, [normalizedBookFilter, selectedAuthors.length]);

	const isFormValid =
		Boolean(form.title.trim()) &&
		selectedAuthors.length > 0 &&
		selectedBooks.length > 0;

	const closeModal = () => {
		if (createSeriesMutation.isPending) {
			return;
		}

		setError("");
		setForm(createDefaultForm());
		setSelectedAuthors([]);
		setSelectedBooks([]);
		setAuthorQuery("");
		setBookQuery("");
		onClose();
	};

	const updateForm = (
		field: keyof ICreateSeriesFormState,
		value: ICreateSeriesFormState[keyof ICreateSeriesFormState],
	) => {
		setError("");
		setForm((current) => ({ ...current, [field]: value }));
	};

	const addAuthor = (author: ISelectedAuthorOption) => {
		if (selectedAuthorIds.has(author.id)) {
			return;
		}

		setError("");
		setSelectedAuthors((current) => [...current, author]);
		setAuthorQuery("");
	};

	const addBook = (book: ISelectedBookOption) => {
		if (selectedBooks.some((item) => item.id === book.id)) {
			return;
		}

		setError("");
		setSelectedBooks((current) => [...current, book]);
		setBookQuery("");

		if (book.authorId && !selectedAuthorIds.has(book.authorId)) {
			setSelectedAuthors((current) => [
				...current,
				{ id: book.authorId as string, name: book.authorName },
			]);
		}
	};

	const removeAuthor = (id: string) => {
		setSelectedAuthors((current) =>
			current.filter((author) => author.id !== id),
		);
	};

	const removeBook = (id: string) => {
		setSelectedBooks((current) => current.filter((book) => book.id !== id));
	};

	const handleSubmit = async () => {
		setError("");

		const title = form.title.trim();
		const authorIds = selectedAuthors.map((author) => author.id);
		const bookIds = selectedBooks.map((book) => book.id);
		const coverUrl =
			form.coverUrl.trim() || selectedBooks[0]?.coverUrl?.trim() || undefined;

		if (!title) {
			setError("Series title is required.");
			return;
		}

		if (authorIds.length === 0) {
			setError("Add at least one author.");
			return;
		}

		if (bookIds.length === 0) {
			setError("Add at least one book.");
			return;
		}

		try {
			await createSeriesMutation.mutateAsync({
				authorIds,
				bookIds,
				coverUrl,
				title,
			});
			setError("");
			setForm(createDefaultForm());
			setSelectedAuthors([]);
			setSelectedBooks([]);
			onCreated?.();
			onClose();
		} catch (caughtError) {
			const message =
				caughtError instanceof Error
					? caughtError.message
					: "Failed to create series.";
			setError(message);
			onCreateError?.(message);
		}
	};

	return (
		<>
			<FormModal
				isSaveDisabled={!isFormValid}
				isSaving={createSeriesMutation.isPending}
				saveLabel="Create series"
				savingLabel="Creating..."
				title="New series"
				onClose={closeModal}
				onSave={handleSubmit}
			>
				<Form onSubmit={(event) => event.preventDefault()}>
					<Top>
						<CoverColumn>
							<CoverLabel>Cover</CoverLabel>
							<ImageUploadField
								aspectRatio={seriesCoverRules.idealRatio}
								cropLabel="Crop and upload"
								cropMessage="Image dimensions are not suitable. Choose a new image or crop this one."
								idealHeight={seriesCoverRules.idealHeight}
								idealWidth={seriesCoverRules.idealWidth}
								placeholderHint="Best ratio 2:3, minimum 500x750 px"
								placeholderText="Upload cover"
								purpose="book-cover"
								shape="square"
								value={form.coverUrl}
								validation={{
									maxRatio: seriesCoverRules.allowedMaxRatio,
									minHeight: seriesCoverRules.allowedMinHeight,
									minRatio: seriesCoverRules.allowedMinRatio,
									minWidth: seriesCoverRules.allowedMinWidth,
								}}
								onChange={(url) => updateForm("coverUrl", url)}
								onError={(message) => setError(message)}
							/>
							<HelperText>
								Optional. If empty, the first selected book cover will be used.
							</HelperText>
						</CoverColumn>

						<TopFields>
							<FormField>
								<FormLabel $required>Title</FormLabel>
								<FormInput
									required
									placeholder="Series title"
									value={form.title}
									onChange={(event) => updateForm("title", event.target.value)}
								/>
							</FormField>

							<FormField>
								<AuthorPicker>
									<FieldHeader>
										<FormLabel $required>Authors</FormLabel>
										{selectedBooks.length === 0 ? (
											<CreateInlineButton
												type="button"
												onClick={() => setIsCreateAuthorOpen(true)}
											>
												<AddIcon aria-hidden="true" />
												<span>Create author</span>
											</CreateInlineButton>
										) : null}
									</FieldHeader>
									<ChipsRow>
										{selectedAuthors.map((author) => (
											<Chip key={author.id}>
												<span>{author.name}</span>
												<ChipRemoveButton
													aria-label={`Remove author ${author.name}`}
													type="button"
													onClick={() => removeAuthor(author.id)}
												>
													<CloseIcon aria-hidden="true" />
												</ChipRemoveButton>
											</Chip>
										))}
										<QueryInput
											placeholder={"Start typing author name"}
											value={authorQuery}
											onChange={(event) => setAuthorQuery(event.target.value)}
										/>
									</ChipsRow>
									{authorSearchQuery.length >= 2 ? (
										<Suggestions>
											{isFetchingAuthors ? (
												<HintText>Searching...</HintText>
											) : null}
											{!isFetchingAuthors && authorSuggestions.length === 0 ? (
												<HintText>No matching authors found.</HintText>
											) : null}
											{visibleAuthorSuggestionItems.map((author) => (
												<SuggestionButton
													key={author.id}
													type="button"
													onMouseDown={(event) => event.preventDefault()}
													onClick={() => addAuthor(mapAuthor(author))}
												>
													{author.name}
												</SuggestionButton>
											))}
											{!isFetchingAuthors &&
											authorSuggestions.length > visibleAuthorSuggestions ? (
												<ShowMoreButton
													type="button"
													onClick={() =>
														setVisibleAuthorSuggestions(
															(current) => current + suggestionStep,
														)
													}
												>
													Show 6 more authors
												</ShowMoreButton>
											) : null}
										</Suggestions>
									) : null}
								</AuthorPicker>
							</FormField>
						</TopFields>
					</Top>

					<BookSection>
						<BookSectionHeader>
							<FormLabel $required>Books</FormLabel>
							<CreateInlineButton
								type="button"
								onClick={() => {
									setCreatedBookTitle(normalizedBookQuery);
									setCreatedBookAuthors(selectedAuthors);
									setIsCreateBookOpen(true);
								}}
							>
								<AddIcon aria-hidden="true" />
								<span>Create book</span>
							</CreateInlineButton>
						</BookSectionHeader>

						<ChipsRow>
							{selectedBooks.map((book) => (
								<BookChip key={book.id}>
									<BookChipCover $coverUrl={book.coverUrl} aria-hidden="true" />
									<BookChipText>
										<BookChipTitle>{book.title}</BookChipTitle>
										<BookChipMeta>{book.authorName}</BookChipMeta>
									</BookChipText>
									<ChipRemoveButton
										aria-label={`Remove book ${book.title}`}
										type="button"
										onClick={() => removeBook(book.id)}
									>
										<CloseIcon aria-hidden="true" />
									</ChipRemoveButton>
								</BookChip>
							))}
							<QueryInput
								placeholder={
									selectedAuthors.length > 0
										? "Suggested books by selected authors"
										: "Select or create books"
								}
								value={bookQuery}
								onChange={(event) => setBookQuery(event.target.value)}
							/>
						</ChipsRow>

						{bookSearchQuery.length >= 2 ? (
							<Suggestions>
								{isFetchingBooks ? <HintText>Searching...</HintText> : null}
								{!isFetchingBooks && bookSuggestions.length === 0 ? (
									<HintText>
										{selectedAuthors.length > 0
											? "Only books by selected authors are allowed."
											: "No matching books found."}
									</HintText>
								) : null}
								{visibleBookSuggestionItems.map((book) => (
									<SuggestionButton
										key={book.id}
										type="button"
										onMouseDown={(event) => event.preventDefault()}
										onClick={() => addBook(mapBook(book))}
									>
										{book.title}
										<BookSuggestionMeta>{book.author}</BookSuggestionMeta>
									</SuggestionButton>
								))}
								{!isFetchingBooks &&
								bookSuggestions.length > visibleBookSuggestions ? (
									<ShowMoreButton
										type="button"
										onClick={() =>
											setVisibleBookSuggestions(
												(current) => current + suggestionStep,
											)
										}
									>
										Show 6 more books
									</ShowMoreButton>
								) : null}
							</Suggestions>
						) : null}
					</BookSection>

					{error ? <FormError role="alert">{error}</FormError> : null}
				</Form>
			</FormModal>

			{isCreateAuthorOpen ? (
				<CreateAuthorModal
					onClose={() => setIsCreateAuthorOpen(false)}
					onCreated={(author: IAuthorDetails) => {
						addAuthor(mapAuthor(author));
						setIsCreateAuthorOpen(false);
					}}
				/>
			) : null}

			{isCreateBookOpen ? (
				<CreateBookModal
					initialAuthors={createdBookAuthors}
					initialTitle={createdBookTitle}
					onClose={() => setIsCreateBookOpen(false)}
					onCreated={(book) => {
						addBook({
							authorId: book.authors?.[0]?.id,
							authorName: book.authors?.[0]?.name ?? book.author ?? "",
							coverUrl: book.coverUrl,
							id: book.id,
							title: book.title,
						});
						setIsCreateBookOpen(false);
					}}
				/>
			) : null}
		</>
	);
};

const Form = styled.form`
	display: grid;
	gap: 1rem;
`;

const Top = styled.div`
	display: grid;
	grid-template-columns: 11rem minmax(0, 1fr);
	gap: 1rem;
	align-items: start;

	@media (max-width: 38rem) {
		grid-template-columns: 1fr;
	}
`;

const CoverColumn = styled.div`
	display: grid;
	gap: 0.6rem;
	justify-items: center;
`;

const HelperText = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 0.78rem;
	line-height: 1.35;
	text-align: center;
`;

const TopFields = styled.div`
	display: grid;
	gap: 0.85rem;
`;

const CoverLabel = styled.span`
	justify-self: start;
	width: 100%;
	color: ${theme.colors.softForeground};
	font-size: 0.78rem;
	font-weight: 700;
`;

const FieldHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
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

const AuthorPicker = styled.div`
	display: grid;
	gap: 0.35rem;
`;

const BookSection = styled.div`
	display: grid;
	gap: 0.5rem;
`;

const BookSectionHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
`;

const CreateInlineButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	border: 0;
	border-radius: 999px;
	background: rgb(242 239 237 / 0.82);
	padding: 0.38rem 0.65rem;
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font: inherit;
	font-size: 0.76rem;
	font-weight: 700;

	& svg {
		width: 0.95rem;
		height: 0.95rem;
	}

	&:hover,
	&:focus-visible {
		background: rgb(218 142 91 / 0.12);
		outline: none;
	}
`;

const ChipsRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.45rem;
	min-height: 2.75rem;
	border: 0.0625rem solid rgb(211 202 196 / 0.82);
	border-radius: 0.85rem;
	background: rgb(242 239 237 / 0.74);
	padding: 0.45rem;
`;

const Chip = styled.span`
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

const BookChip = styled(Chip)`
	padding-left: 0.35rem;
`;

const BookChipCover = styled.span<{ $coverUrl?: string }>`
	width: 1.45rem;
	height: 1.45rem;
	flex: 0 0 auto;
	border-radius: 0.4rem;
	background:
		linear-gradient(rgb(4 18 26 / 0.08), rgb(4 18 26 / 0.08)),
		url("${({ $coverUrl }) => $coverUrl || "/images/book-placeholder.svg"}")
			center / cover;
`;

const BookChipText = styled.span`
	display: grid;
	min-width: 0;
`;

const BookChipTitle = styled.span`
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const BookChipMeta = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.72rem;
	font-weight: 600;
`;

const ChipRemoveButton = styled.button`
	display: inline-flex;
	width: 1rem;
	height: 1rem;
	align-items: center;
	justify-content: center;
	border: 0;
	border-radius: 50%;
	background: rgb(212 100 28 / 0.16);
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font: inherit;
	line-height: 1;
	padding: 0;

	& svg {
		width: 0.75rem;
		height: 0.75rem;
	}

	&:hover,
	&:focus-visible {
		background: rgb(212 100 28 / 0.24);
		outline: none;
	}
`;

const QueryInput = styled.input`
	min-width: 10rem;
	flex: 1 1 10rem;
	border: 0;
	background: transparent;
	color: ${theme.colors.foreground};
	font: inherit;
	padding: 0.28rem;
	outline: none;
`;

const Suggestions = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
	align-items: stretch;
	gap: 0.45rem;
	max-height: 16rem;
	overflow-y: auto;
	padding: 0.15rem 0.15rem 0.3rem 0;
	scrollbar-width: none;
	-ms-overflow-style: none;

	&::-webkit-scrollbar {
		display: none;
	}
`;

const SuggestionButton = styled.button`
	display: inline-flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.1rem;
	width: 100%;
	max-width: 100%;
	border: 0.0625rem solid rgb(218 142 91 / 0.26);
	border-radius: 0.85rem;
	background: rgb(255 255 255 / 0.62);
	padding: 0.55rem 0.8rem;
	color: ${theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	font-size: 0.8rem;
	font-weight: 600;
	min-height: 3.1rem;
	text-align: left;
	overflow: hidden;
	box-shadow: 0 0.18rem 0.5rem rgb(4 18 26 / 0.05);

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		background: rgb(242 239 237 / 0.9);
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;

const BookSuggestionMeta = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.72rem;
	font-weight: 500;
`;

const ShowMoreButton = styled.button`
	grid-column: 1 / -1;
	width: 100%;
	border: 0.0625rem solid rgb(218 142 91 / 0.26);
	border-radius: 0.85rem;
	background: rgb(242 239 237 / 0.82);
	padding: 0.55rem 0.9rem;
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font: inherit;
	font-size: 0.78rem;
	font-weight: 700;
	text-decoration: none;
	box-shadow: 0 0.18rem 0.5rem rgb(4 18 26 / 0.05);

	&:hover,
	&:focus-visible {
		color: ${theme.colors.darkerOrangeLight};
		background: rgb(255 255 255 / 0.9);
		outline: none;
	}
`;

const HintText = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 0.8rem;
`;

const FormError = styled.p`
	margin: 0;
	color: #a03434;
	font-size: 0.86rem;
	font-weight: 700;
`;
