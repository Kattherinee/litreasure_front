"use client";

import { useState } from "react";
import styled from "styled-components";

import {
	type IAuthorDetails,
	useCreateAuthorMutation,
} from "@/shared/api/authors";
import { theme } from "@/shared/theme";
import { FormModal } from "@/shared/ui/FormModal";
import { ImageUploadField } from "@/shared/ui/ImageUploadField";
import InputField from "@/shared/ui/InputField/InputField";

interface ICreateAuthorModalProps {
	onClose: () => void;
	onCreated?: (author: IAuthorDetails) => void;
}

export const CreateAuthorModal = ({
	onClose,
	onCreated,
}: ICreateAuthorModalProps) => {
	const createAuthorMutation = useCreateAuthorMutation();
	const [name, setName] = useState("");
	const [bio, setBio] = useState("");
	const [photoUrl, setPhotoUrl] = useState("");
	const [error, setError] = useState("");

	const isSaving = createAuthorMutation.isPending;

	const handleSubmit = async () => {
		const trimmedName = name.trim();
		if (!trimmedName) {
			setError("Author name is required.");
			return;
		}

		setError("");
		try {
			const created = await createAuthorMutation.mutateAsync({
				bio: bio.trim() || undefined,
				name: trimmedName,
				photoUrl: photoUrl || undefined,
			});
			onCreated?.(created);
			onClose();
		} catch (submitError) {
			setError(
				submitError instanceof Error
					? submitError.message
					: "Could not create author.",
			);
		}
	};

	return (
		<FormModal
			isSaveDisabled={!name.trim()}
			isSaving={isSaving}
			saveLabel="Create"
			savingLabel="Creating..."
			title="Create author"
			onClose={onClose}
			onSave={handleSubmit}
		>
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
						onChange={(url) => {
							setError("");
							setPhotoUrl(url);
						}}
						onError={(message) => setError(message)}
					/>
				</UploadWrap>

				<Field>
					<FieldLabel>Name</FieldLabel>
					<StyledInput
						required
						placeholder="Author name"
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
				</Field>

				<Field>
					<FieldLabel>Bio</FieldLabel>
					<StyledTextarea
						placeholder="A short biography"
						value={bio}
						onChange={(event) => setBio(event.target.value)}
					/>
				</Field>

				{error ? <ErrorText role="alert">{error}</ErrorText> : null}
			</Form>
		</FormModal>
	);
};

const Form = styled.form`
	display: grid;
	gap: 0.85rem;
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

const StyledInput = styled(InputField)`
	width: 100%;
`;

const StyledTextarea = styled.textarea`
	width: 100%;
	min-height: 8.5rem;
	border: 0.0625rem solid #bab7b4;
	border-radius: 20px;
	background: #ddd6d2;
	padding: 0.62rem 0.875rem;
	color: #04121a;
	font: inherit;
	font-size: 1rem;
	line-height: 1.3;
	outline: none;
	resize: vertical;

	&::placeholder {
		color: #9a9390;
	}
`;

const ErrorText = styled.p`
	margin: 0;
	color: #d4471c;
	font-size: 0.86rem;
	line-height: 1.3;
`;
