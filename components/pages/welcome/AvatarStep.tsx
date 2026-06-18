"use client";

import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import MuiAvatar from "@mui/material/Avatar";
import type { CropperRef } from "react-advanced-cropper";
import { CircleStencil, Cropper } from "react-advanced-cropper";
import { createPortal } from "react-dom";
import styled from "styled-components";

import {
	getAvatarAssetUrl,
	useAvatarsQuery,
} from "@/shared/api/avatarsRepository";
import { useUploadImageMutation } from "@/shared/api/images";
import { theme } from "@/shared/theme";

import { StepBody, StepDescription, StepTitle } from "./stepStyles";

interface IAvatarStepProps {
	avatarUrl: string;
	onAvatarChange: (url: string) => void;
}

const AVATAR_SIZE = 512;

const getAvatarUploadErrorMessage = (error: unknown) => {
	if (!(error instanceof Error) || !error.message.trim()) {
		return "We couldn't upload your photo. Try another image or choose a dragon avatar instead.";
	}

	const message = error.message.toLowerCase();

	if (message.includes("authorization")) {
		return "Your session expired, so the photo upload was cancelled. Sign in again or choose a dragon avatar for now.";
	}

	if (
		message.includes("failed to fetch") ||
		message.includes("network") ||
		message.includes("load")
	) {
		return "The photo upload failed because of a connection issue. Try again in a moment or choose a dragon avatar instead.";
	}

	return "We couldn't upload your photo. Try another image or choose a dragon avatar instead.";
};

export const AvatarStep = ({ avatarUrl, onAvatarChange }: IAvatarStepProps) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const cropperRef = useRef<CropperRef>(null);
	const { data } = useAvatarsQuery();
	const uploadImageMutation = useUploadImageMutation();
	const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState("");
	const [uploadedFile, setUploadedFile] = useState<Blob | null>(null);
	const [isCropModalOpen, setIsCropModalOpen] = useState(false);
	const [uploadError, setUploadError] = useState("");
	const avatars = data ?? [];
	const selectedAvatar = avatars.find((avatar) => avatar.url === avatarUrl);
	const previewUrl = uploadedPreviewUrl || getAvatarAssetUrl(avatarUrl);

	useEffect(() => {
		return () => {
			if (uploadedPreviewUrl) URL.revokeObjectURL(uploadedPreviewUrl);
		};
	}, [uploadedPreviewUrl]);

	const openFileDialog = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;

		if (uploadedPreviewUrl) URL.revokeObjectURL(uploadedPreviewUrl);
		setUploadedFile(file);
		setUploadedPreviewUrl(URL.createObjectURL(file));
		setIsCropModalOpen(true);
		setUploadError("");
	};

	const clearAvatar = () => {
		if (uploadedPreviewUrl) URL.revokeObjectURL(uploadedPreviewUrl);
		setUploadedPreviewUrl("");
		setUploadedFile(null);
		setIsCropModalOpen(false);
		setUploadError("");
		onAvatarChange("");
	};

	const selectPresetAvatar = (url: string) => {
		if (uploadedPreviewUrl) URL.revokeObjectURL(uploadedPreviewUrl);
		setUploadedPreviewUrl("");
		setUploadedFile(null);
		setIsCropModalOpen(false);
		setUploadError("");
		onAvatarChange(url);
	};

	const cancelCrop = () => {
		if (uploadedPreviewUrl) URL.revokeObjectURL(uploadedPreviewUrl);
		setUploadedPreviewUrl("");
		setUploadedFile(null);
		setIsCropModalOpen(false);
	};

	const applyCrop = async () => {
		try {
			const blob = await getCroppedAvatarBlob(cropperRef.current);
			if (uploadedPreviewUrl) URL.revokeObjectURL(uploadedPreviewUrl);
			const nextPreviewUrl = URL.createObjectURL(blob);
			setUploadedFile(blob);
			setUploadedPreviewUrl(nextPreviewUrl);
			setIsCropModalOpen(false);
			setUploadError("");
			const response = await uploadImageMutation.mutateAsync({
				file: blob,
				purpose: "avatar",
			});
			onAvatarChange(response.url);
			setUploadedFile(null);
			URL.revokeObjectURL(nextPreviewUrl);
			setUploadedPreviewUrl("");
		} catch (error) {
			setUploadError(getAvatarUploadErrorMessage(error));
		}
	};

	return (
		<AvatarStepBody>
			<StepTitle>Choose an avatar</StepTitle>
			<StepDescription>
				You can upload your own photo. Click the circle and adjust the crop.
			</StepDescription>

			<AvatarLayout>
				<AvatarUpload
					role="button"
					tabIndex={0}
					aria-label="Choose profile photo"
					src={previewUrl}
					onClick={openFileDialog}
					onKeyDown={(event) => {
						if (event.key === "Enter" || event.key === " ") {
							event.preventDefault();
							openFileDialog();
						}
					}}
				>
					{previewUrl ? null : <AvatarPlaceholder>Photo</AvatarPlaceholder>}
				</AvatarUpload>
				<HiddenFileInput
					ref={fileInputRef}
					accept="image/*"
					type="file"
					onChange={handleFileChange}
				/>
				<Tools>
					<ToolButton
						disabled={uploadImageMutation.isPending}
						type="button"
						onClick={openFileDialog}
					>
						{uploadImageMutation.isPending
							? "Uploading..."
							: previewUrl
								? "Change"
								: "Choose photo"}
					</ToolButton>
					{previewUrl ? (
						<ToolButton
							disabled={uploadImageMutation.isPending}
							type="button"
							onClick={clearAvatar}
						>
							Remove
						</ToolButton>
					) : null}
				</Tools>
				<SectionHint>
					Upload your photo or pick one of the dragon avatars right away.
				</SectionHint>
				<AvatarScrollStrip>
					{avatars.map((avatar) => {
						const isSelected =
							!uploadedPreviewUrl && avatar.url === selectedAvatar?.url;
						return (
							<AvatarOption
								key={avatar.id}
								aria-label={`Choose avatar ${avatar.id}`}
								aria-pressed={isSelected}
								type="button"
								$isSelected={isSelected}
								onClick={() => selectPresetAvatar(avatar.url)}
							>
								<AvatarOptionImage alt="" src={getAvatarAssetUrl(avatar.url)} />
							</AvatarOption>
						);
					})}
				</AvatarScrollStrip>
				{uploadError ? (
					<UploadErrorBlock role="alert">
						<UploadError>{uploadError}</UploadError>
					</UploadErrorBlock>
				) : null}
			</AvatarLayout>

			{typeof document !== "undefined" && uploadedPreviewUrl && isCropModalOpen
				? createPortal(
						<CropModalOverlay role="presentation" onMouseDown={cancelCrop}>
							<CropModal
								aria-modal="true"
								role="dialog"
								aria-label="Crop photo"
								onMouseDown={(event) => event.stopPropagation()}
							>
								<CropModalTitle>Crop photo</CropModalTitle>
								<CropperShell>
									<StyledCropper
										ref={cropperRef}
										src={uploadedPreviewUrl}
										stencilComponent={CircleStencil}
									/>
								</CropperShell>
								<CropModalActions>
									<ToolButton type="button" onClick={cancelCrop}>
										Cancel
									</ToolButton>
									<PrimaryToolButton type="button" onClick={applyCrop}>
										Apply
									</PrimaryToolButton>
								</CropModalActions>
							</CropModal>
						</CropModalOverlay>,
						document.body,
					)
				: null}
		</AvatarStepBody>
	);
};

const getCroppedAvatarBlob = async (cropper: CropperRef | null) => {
	const canvas = cropper?.getCanvas({
		height: AVATAR_SIZE,
		imageSmoothingQuality: "high",
		width: AVATAR_SIZE,
	});
	if (!canvas) throw new Error("Could not prepare the image");

	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) resolve(blob);
				else reject(new Error("Could not prepare the image"));
			},
			"image/webp",
			0.92,
		);
	});
};

const AvatarStepBody = styled(StepBody)`
	height: 100%;
`;

const AvatarLayout = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	align-self: stretch;
	flex: 1 1 auto;
	gap: 1rem;
	margin-top: 2rem;
	min-height: 0;
`;

const AvatarUpload = styled(MuiAvatar)`
	&& {
		width: 8.5rem;
		height: 8.5rem;
		border: 0.35rem solid rgb(218 142 91 / 0.18);
		background: ${theme.alpha.blueWash};
		color: ${theme.colors.bluePrimary};
		cursor: pointer;
		font-family: ${theme.fonts.sans};
		font-weight: 700;
		transition:
			border-color 160ms,
			transform 160ms;
	}

	&&:hover,
	&&:focus-visible {
		border-color: rgb(218 142 91 / 0.42);
		outline: none;
		transform: translateY(-0.0625rem);
	}
`;

const AvatarPlaceholder = styled.span`
	font-size: 1rem;
	font-weight: 700;
	line-height: 1;
`;

const HiddenFileInput = styled.input`
	position: absolute;
	width: 0.0625rem;
	height: 0.0625rem;
	overflow: hidden;
	clip: rect(0 0 0 0);
	white-space: nowrap;
`;

const CropperShell = styled.div`
	width: min(100%, 25rem);
	height: clamp(14rem, 48vh, 20rem);
	overflow: hidden;
	border: 0.0625rem solid rgb(212 100 28 / 0.18);
	border-radius: 1rem;
	background: rgb(242 239 237 / 0.7);
`;

const StyledCropper = styled(Cropper)`
	width: 100%;
	height: 100%;
`;

const CropModalOverlay = styled.div`
	position: fixed;
	z-index: 80;
	inset: 0;
	display: grid;
	place-items: center;
	background: rgb(4 18 26 / 0.52);
	padding: 1rem;
`;

const CropModal = styled.section`
	width: min(100%, 29rem);
	max-height: calc(100dvh - 2rem);
	overflow-y: auto;
	border: 0.0625rem solid #eeb38d;
	border-radius: 1rem;
	background: #e8e2de;
	padding: 1rem;
	box-shadow: 0 1.25rem 3rem rgb(4 18 26 / 0.18);
`;

const CropModalTitle = styled.h3`
	margin: 0 0 0.8rem;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.25rem;
	line-height: 1.2;
`;

const CropModalActions = styled.div`
	display: flex;
	justify-content: flex-end;
	flex-wrap: wrap;
	gap: 0.75rem;
	margin-top: 1rem;
`;

const Tools = styled.div`
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.6rem;
`;

const ToolButton = styled.button`
	border: 0.0625rem solid rgb(212 100 28 / 0.24);
	border-radius: 999px;
	background: rgb(255 255 255 / 0.44);
	padding: 0.45rem 0.85rem;
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font: inherit;
	font-size: 0.88rem;
	font-weight: 700;

	&:hover,
	&:focus-visible {
		background: rgb(218 142 91 / 0.14);
		outline: none;
	}
`;

const PrimaryToolButton = styled(ToolButton)`
	border-color: transparent;
	background: ${theme.colors.orangeLight};
	color: ${theme.colors.invertedText};

	&:disabled {
		cursor: default;
		opacity: 0.6;
	}
`;

const UploadError = styled.p`
	margin: 0;
	color: ${theme.colors.orangeDark};
	font-size: 0.85rem;
	text-align: center;
`;

const UploadErrorBlock = styled.div`
	display: grid;
	justify-items: center;
	gap: 0.5rem;
`;

const SectionHint = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 0.85rem;
	line-height: 1.4;
	text-align: center;
`;

const AvatarScrollStrip = styled.div`
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.75rem;
	width: 100%;
	flex: 1 1 auto;
	align-content: flex-start;
	min-height: 0;
	overflow-y: auto;
	padding: 0.25rem 0.25rem 0.6rem;

	&::-webkit-scrollbar {
		width: 0.25rem;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
	}

	&::-webkit-scrollbar-thumb {
		background: rgb(186 183 180 / 0.5);
		border-radius: 999px;
	}
`;

const AvatarOption = styled.button<{ $isSelected: boolean }>`
	position: relative;
	display: grid;
	width: 5rem;
	height: 5rem;
	flex-shrink: 0;
	place-items: center;
	overflow: hidden;
	border: 0.1875rem solid
		${({ $isSelected }) => ($isSelected ? "#da8e5b" : "transparent")};
	border-radius: 50%;
	background: ${theme.colors.background};
	padding: 0;
	cursor: pointer;
	transform: ${({ $isSelected }) => ($isSelected ? "scale(1.1)" : "scale(1)")};
	transition:
		border-color 150ms,
		transform 150ms;

	&:hover {
		border-color: ${({ $isSelected }) =>
			$isSelected ? "#da8e5b" : "rgb(218 142 91 / 0.5)"};
		transform: scale(${({ $isSelected }) => ($isSelected ? "1.1" : "1.05")});
	}
`;

const AvatarOptionImage = styled(MuiAvatar)`
	&& {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
	}
`;
