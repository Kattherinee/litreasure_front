"use client";

import Link from "next/link";
import styled from "styled-components";

import { ImageUploadField } from "@/shared/ui/ImageUploadField";
import { theme } from "@/shared/theme";

interface IAuthorEditModalProps {
	bio: string;
	books: Array<{
		id: string;
		title: string;
	}>;
	isSaving: boolean;
	name: string;
	onBioChange: (value: string) => void;
	onClose: () => void;
	onNameChange: (value: string) => void;
	onPhotoUrlChange: (value: string) => void;
	onSave: () => void;
	photoUrl: string;
}

export const AuthorEditModal = ({
	bio,
	books,
	isSaving,
	name,
	onBioChange,
	onClose,
	onNameChange,
	onPhotoUrlChange,
	onSave,
	photoUrl,
}: IAuthorEditModalProps) => (
	<Overlay role="presentation" onMouseDown={onClose}>
		<Dialog
			aria-modal="true"
			role="dialog"
			aria-labelledby="edit-author-title"
			onMouseDown={(event) => event.stopPropagation()}
		>
			<Title id="edit-author-title">Edit author</Title>
			<Form onSubmit={(event) => event.preventDefault()}>
				<UploadWrap>
					<ImageUploadField
						forceCrop
						idealHeight={768}
						idealWidth={768}
						placeholderHint="Circle crop"
						placeholderText="Upload photo"
						purpose="avatar"
						shape="circle"
						value={photoUrl}
						onChange={onPhotoUrlChange}
					/>
				</UploadWrap>

				<Field>
					<span>Name</span>
					<input
						value={name}
						onChange={(event) => onNameChange(event.target.value)}
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

				<Field>
					<span>Biography</span>
					<textarea
						value={bio}
						onChange={(event) => onBioChange(event.target.value)}
					/>
				</Field>
				<Actions>
					<SecondaryButton type="button" onClick={onClose}>
						Cancel
					</SecondaryButton>
					<PrimaryButton disabled={isSaving} type="button" onClick={onSave}>
						{isSaving ? "Saving..." : "Save"}
					</PrimaryButton>
				</Actions>
			</Form>
		</Dialog>
	</Overlay>
);

const Overlay = styled.div`
	position: fixed;
	z-index: 1500;
	inset: 0;
	display: grid;
	place-items: center;
	background: rgb(4 18 26 / 0.52);
	padding: 1rem;
`;

const Dialog = styled.section`
	width: min(100%, 34rem);
	max-height: min(92dvh, 42rem);
	overflow: auto;
	border-radius: 1rem;
	background: ${theme.colors.surface};
	padding: 1.5rem;
	box-shadow: 0 1.25rem 3rem rgb(4 18 26 / 0.18);
`;

const Title = styled.h2`
	margin: 0 0 1rem;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.55rem;
	line-height: 1.2;
`;

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
	color: ${theme.colors.foreground};
	font-size: 0.88rem;
	font-weight: 700;

	input,
	textarea {
		width: 100%;
		border: 0.0625rem solid rgb(211 202 196 / 0.82);
		border-radius: 0.7rem;
		background: rgb(255 255 255 / 0.56);
		padding: 0.65rem 0.75rem;
		color: ${theme.colors.foreground};
		font: inherit;
		font-weight: 400;
	}

	textarea {
		min-height: 8rem;
		resize: vertical;
	}

	input:focus,
	textarea:focus {
		border-color: ${theme.colors.orangeLight};
		outline: none;
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

const Actions = styled.div`
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 0.65rem;
`;

const SecondaryButton = styled.button`
	border: 0.0625rem solid rgb(211 202 196 / 0.82);
	border-radius: 999px;
	background: transparent;
	padding: 0.5rem 0.9rem;
	color: ${theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	font-weight: 700;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;

const PrimaryButton = styled(SecondaryButton)`
	border-color: ${theme.colors.orangeLight};
	background: ${theme.colors.orangeLight};
	color: ${theme.colors.invertedText};

	&:disabled {
		cursor: wait;
		opacity: 0.65;
	}
`;
