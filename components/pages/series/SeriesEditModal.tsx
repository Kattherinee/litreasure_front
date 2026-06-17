"use client";

import Link from "next/link";
import { useState } from "react";
import styled from "styled-components";

import { theme } from "@/shared/theme";
import { FormModal } from "@/shared/ui/FormModal";
import { ImageUploadField } from "@/shared/ui/ImageUploadField";

interface ISeriesEditModalProps {
	books: Array<{
		id: string;
		title: string;
	}>;
	coverUrl?: string;
	isSaving: boolean;
	title: string;
	onClose: () => void;
	onSave: (payload: { coverUrl?: string; title: string }) => void;
}

export const SeriesEditModal = ({
	books,
	coverUrl,
	isSaving,
	title,
	onClose,
	onSave,
}: ISeriesEditModalProps) => {
	const [nextTitle, setNextTitle] = useState(title);
	const [nextCoverUrl, setNextCoverUrl] = useState(coverUrl ?? "");

	return (
		<FormModal
			isSaveDisabled={!nextTitle.trim()}
			isSaving={isSaving}
			saveLabel="Save series"
			savingLabel="Saving..."
			title="Edit series"
			onClose={onClose}
			onSave={() =>
				onSave({
					coverUrl: nextCoverUrl.trim() || undefined,
					title: nextTitle.trim(),
				})
			}
		>
			<Form onSubmit={(event) => event.preventDefault()}>
				<UploadWrap>
					<ImageUploadField
						aspectRatio={2 / 3}
						forceCrop
						idealHeight={900}
						idealWidth={600}
						placeholderHint="2:3 cover"
						placeholderText="Upload cover"
						purpose="book-cover"
						shape="square"
						value={nextCoverUrl}
						onChange={setNextCoverUrl}
					/>
				</UploadWrap>

				<Field>
					<FieldLabel>Title</FieldLabel>
					<StyledInput
						placeholder="Series title"
						value={nextTitle}
						onChange={(event) => setNextTitle(event.target.value)}
					/>
				</Field>

				{books.length > 0 ? (
					<BooksBlock>
						<BooksLabel>Linked books</BooksLabel>
						<BooksList>
							{books.map((book) => (
								<BookLink key={book.id} href={`/books/${book.id}`}>
									{book.title}
								</BookLink>
							))}
						</BooksList>
					</BooksBlock>
				) : null}
			</Form>
		</FormModal>
	);
};

const Form = styled.form`
	display: grid;
	gap: 0.9rem;
`;

const UploadWrap = styled.div`
	display: grid;
	justify-items: center;
	margin-bottom: 0.15rem;
`;

const Field = styled.label`
	display: grid;
	gap: 0.35rem;
`;

const FieldLabel = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.78rem;
	font-weight: 700;
`;

const StyledInput = styled.input`
	width: 100%;
	border: 0.0625rem solid #bab7b4;
	border-radius: 20px;
	background: #ddd6d2;
	padding: 0.62rem 0.875rem;
	color: #04121a;
	font: inherit;
	font-size: 1rem;
	line-height: 1.3;
	outline: none;

	&::placeholder {
		color: #9a9390;
	}
`;

const BooksBlock = styled.section`
	display: grid;
	gap: 0.45rem;
	border: 0.0625rem solid rgb(211 202 196 / 0.72);
	border-radius: 0.9rem;
	background: rgb(255 255 255 / 0.48);
	padding: 0.85rem 0.9rem;
`;

const BooksLabel = styled.span`
	color: ${theme.colors.foreground};
	font-size: 0.84rem;
	font-weight: 700;
`;

const BooksList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.45rem;
`;

const BookLink = styled(Link)`
	border: 0.0625rem solid rgb(211 202 196 / 0.82);
	border-radius: 999px;
	background: rgb(255 255 255 / 0.6);
	padding: 0.35rem 0.65rem;
	color: ${theme.colors.foreground};
	font-size: 0.84rem;
	text-decoration: none;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;
