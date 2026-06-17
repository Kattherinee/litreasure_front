"use client";

import { useState } from "react";
import styled from "styled-components";

import { type IGenre, useCreateGenreMutation } from "@/shared/api/genres";
import { theme } from "@/shared/theme";

interface ICreateGenreModalProps {
	onClose: () => void;
	onCreated?: (genre: IGenre) => void;
}

export const CreateGenreModal = ({
	onClose,
	onCreated,
}: ICreateGenreModalProps) => {
	const createGenreMutation = useCreateGenreMutation();
	const [name, setName] = useState("");
	const [category, setCategory] = useState("");
	const [subcategory, setSubcategory] = useState("");
	const [isPublic, setIsPublic] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async () => {
		const trimmedName = name.trim();
		if (!trimmedName) {
			setError("Genre name is required.");
			return;
		}

		setError("");
		try {
			const created = await createGenreMutation.mutateAsync({
				category: category.trim() || undefined,
				isPublic,
				name: trimmedName,
				subcategory: subcategory.trim() || undefined,
			});
			onCreated?.(created);
			onClose();
		} catch (submitError) {
			setError(
				submitError instanceof Error
					? submitError.message
					: "Could not create genre.",
			);
		}
	};

	return (
		<Overlay role="presentation" onMouseDown={onClose}>
			<Dialog
				aria-modal="true"
				role="dialog"
				aria-labelledby="create-genre-title"
				onMouseDown={(event) => event.stopPropagation()}
			>
				<Title id="create-genre-title">Create genre</Title>
				<Form onSubmit={(event) => event.preventDefault()}>
					<Field>
						<span>Name</span>
						<input
							required
							value={name}
							onChange={(event) => setName(event.target.value)}
						/>
					</Field>
					<Field>
						<span>Category</span>
						<input
							value={category}
							onChange={(event) => setCategory(event.target.value)}
						/>
					</Field>
					<Field>
						<span>Subcategory</span>
						<input
							value={subcategory}
							onChange={(event) => setSubcategory(event.target.value)}
						/>
					</Field>
					<CheckboxField>
						<input
							checked={isPublic}
							type="checkbox"
							onChange={(event) => setIsPublic(event.target.checked)}
						/>
						<span>Visible for other users</span>
					</CheckboxField>
					{error ? <ErrorText role="alert">{error}</ErrorText> : null}
					<Actions>
						<SecondaryButton type="button" onClick={onClose}>
							Cancel
						</SecondaryButton>
						<PrimaryButton
							disabled={createGenreMutation.isPending}
							type="button"
							onClick={handleSubmit}
						>
							{createGenreMutation.isPending ? "Creating..." : "Create"}
						</PrimaryButton>
					</Actions>
				</Form>
			</Dialog>
		</Overlay>
	);
};

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

const Field = styled.label`
	display: grid;
	gap: 0.35rem;
	color: ${theme.colors.foreground};
	font-size: 0.88rem;
	font-weight: 700;

	input {
		width: 100%;
		border: 0.0625rem solid rgb(211 202 196 / 0.82);
		border-radius: 0.7rem;
		background: rgb(255 255 255 / 0.56);
		padding: 0.65rem 0.75rem;
		color: ${theme.colors.foreground};
		font: inherit;
		font-weight: 400;
	}

	input:focus {
		border-color: ${theme.colors.orangeLight};
		outline: none;
	}
`;

const CheckboxField = styled.label`
	display: flex;
	align-items: center;
	gap: 0.55rem;
	color: ${theme.colors.foreground};
	font-size: 0.88rem;
`;

const ErrorText = styled.p`
	margin: 0;
	color: #a03434;
	font-size: 0.86rem;
	line-height: 1.3;
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
