"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { useUpdateUserProfileMutation } from "@/shared/api/users";
import type { IAuthSession } from "@/shared/store/auth-store";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";

interface IProfileAvatarModalProps {
	onClose: () => void;
	session: IAuthSession;
}

const AVATAR_SIZE = 512;

export const ProfileAvatarModal = ({
	onClose,
	session,
}: IProfileAvatarModalProps) => {
	const updateUser = useAuthStore((state) => state.updateUser);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const cropperRef = useRef<CropperRef>(null);
	const { data: avatars = [], isLoading: isAvatarsLoading } = useAvatarsQuery();
	const uploadImageMutation = useUploadImageMutation();
	const updateProfileMutation = useUpdateUserProfileMutation();
	const initialAvatarUrl = session.user.avatarUrl ?? "";
	const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(initialAvatarUrl);
	const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState("");
	const [uploadedFile, setUploadedFile] = useState<Blob | null>(null);
	const [isCropModalOpen, setIsCropModalOpen] = useState(false);
	const [error, setError] = useState("");
	const isSaving =
		uploadImageMutation.isPending || updateProfileMutation.isPending;
	const currentImageUrl =
		uploadedPreviewUrl || getAvatarAssetUrl(selectedAvatarUrl);
	const hasChanges =
		Boolean(uploadedFile) || selectedAvatarUrl !== initialAvatarUrl;
	const canSave = Boolean(session.user.id) && hasChanges;
	const initials = useMemo(
		() =>
			(session.user.name || session.user.username || session.user.email || "L")
				.split(/[\s._-]+/)
				.filter(Boolean)
				.slice(0, 2)
				.map((part) => part.charAt(0).toUpperCase())
				.join(""),
		[session.user.email, session.user.name, session.user.username],
	);

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
		setError("");
	};

	const clearAvatar = () => {
		if (uploadedPreviewUrl) URL.revokeObjectURL(uploadedPreviewUrl);
		setUploadedPreviewUrl("");
		setUploadedFile(null);
		setIsCropModalOpen(false);
		setSelectedAvatarUrl("");
		setError("");
	};

	const selectPresetAvatar = (url: string) => {
		if (uploadedPreviewUrl) URL.revokeObjectURL(uploadedPreviewUrl);
		setUploadedPreviewUrl("");
		setUploadedFile(null);
		setIsCropModalOpen(false);
		setSelectedAvatarUrl(url);
		setError("");
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
			setUploadedFile(blob);
			setUploadedPreviewUrl(URL.createObjectURL(blob));
			setIsCropModalOpen(false);
			setError("");
		} catch (caughtError) {
			setError(
				caughtError instanceof Error
					? caughtError.message
					: "Failed to prepare image",
			);
		}
	};

	const handleSave = async () => {
		if (!session.user.id || !canSave) return;
		setError("");

		try {
			const avatarUrl =
				uploadedFile && uploadedPreviewUrl
					? (
							await uploadImageMutation.mutateAsync({
								file: uploadedFile,
								purpose: "avatar",
							})
						).url
					: selectedAvatarUrl;

			await updateProfileMutation.mutateAsync({
				payload: { avatarUrl },
				userId: session.user.id,
			});
			updateUser({ avatarUrl });
			onClose();
		} catch (caughtError) {
			setError(
				caughtError instanceof Error
					? caughtError.message
					: "Failed to update avatar",
			);
		}
	};

	return (
		<Overlay role="presentation" onMouseDown={onClose}>
			<Dialog
				aria-modal="true"
				role="dialog"
				aria-labelledby="profile-avatar-title"
				onMouseDown={(event) => event.stopPropagation()}
			>
				<CloseButton type="button" aria-label="Close" onClick={onClose}>
					<span />
					<span />
				</CloseButton>
				<Title id="profile-avatar-title">Profile avatar</Title>
				<Lead $withMargin={true}>Upload your profile photo</Lead>

				<AvatarArea>
					<AvatarUpload
						role="button"
						tabIndex={0}
						aria-label="Choose profile photo"
						src={currentImageUrl}
						onClick={openFileDialog}
						onKeyDown={(event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								openFileDialog();
							}
						}}
					>
						{currentImageUrl ? null : (
							<AvatarPlaceholder>{initials || "Photo"}</AvatarPlaceholder>
						)}
					</AvatarUpload>
					<HiddenFileInput
						ref={fileInputRef}
						accept="image/*"
						type="file"
						onChange={handleFileChange}
					/>

					<Tools>
						<ToolButton type="button" onClick={openFileDialog}>
							{currentImageUrl ? "Change" : "Choose photo"}
						</ToolButton>
						{currentImageUrl ? (
							<ToolButton type="button" onClick={clearAvatar}>
								Remove
							</ToolButton>
						) : null}
					</Tools>

					<Lead $withMargin={false}>
						Or choose one of the dragon avatars below
					</Lead>
					<AvatarOptions>
						{isAvatarsLoading
							? Array.from({ length: 8 }, (_, index) => (
									<AvatarSkeleton key={index} />
								))
							: avatars.map((avatar) => {
									const isSelected =
										!uploadedPreviewUrl && avatar.url === selectedAvatarUrl;

									return (
										<AvatarOption
											key={avatar.id}
											aria-label={`Choose avatar ${avatar.id}`}
											aria-pressed={isSelected}
											$isSelected={isSelected}
											onClick={() => selectPresetAvatar(avatar.url)}
										>
											<AvatarOptionImage
												alt=""
												src={getAvatarAssetUrl(avatar.url)}
											/>
										</AvatarOption>
									);
								})}
					</AvatarOptions>
				</AvatarArea>

				{typeof document !== "undefined" &&
				uploadedPreviewUrl &&
				isCropModalOpen
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
										<SecondaryButton type="button" onClick={cancelCrop}>
											Cancel
										</SecondaryButton>
										<PrimaryButton type="button" onClick={applyCrop}>
											Apply
										</PrimaryButton>
									</CropModalActions>
								</CropModal>
							</CropModalOverlay>,
							document.body,
						)
					: null}

				{error ? <ErrorText role="alert">{error}</ErrorText> : null}
				<Actions>
					<SecondaryButton type="button" onClick={onClose}>
						Cancel
					</SecondaryButton>
					<PrimaryButton
						disabled={!canSave || isSaving}
						type="button"
						onClick={handleSave}
					>
						{isSaving ? "Saving..." : "Save"}
					</PrimaryButton>
				</Actions>
			</Dialog>
		</Overlay>
	);
};

const getCroppedAvatarBlob = async (cropper: CropperRef | null) => {
	const canvas = cropper?.getCanvas({
		height: AVATAR_SIZE,
		imageSmoothingQuality: "high",
		width: AVATAR_SIZE,
	});
	if (!canvas) throw new Error("Failed to prepare image");

	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) resolve(blob);
				else reject(new Error("Failed to prepare image"));
			},
			"image/webp",
			0.92,
		);
	});
};

const Overlay = styled.div`
	position: fixed;
	z-index: 70;
	inset: 0;
	display: grid;
	place-items: center;
	background: rgb(4 18 26 / 0.48);
	padding: 1rem;
`;

const Dialog = styled.section`
	position: relative;
	width: min(100%, 38rem);
	border: 0.0625rem solid #eeb38d;
	border-radius: 1rem;
	background: #e8e2de;
	padding: 1.5rem;
	box-shadow: 0 1.25rem 3rem rgb(4 18 26 / 0.16);
`;

const CloseButton = styled.button`
	position: absolute;
	top: 1rem;
	right: 1rem;
	display: grid;
	width: 2rem;
	height: 2rem;
	place-items: center;
	border: 0;
	border-radius: 999px;
	background: transparent;
	padding: 0;
	cursor: pointer;

	span {
		grid-area: 1 / 1;
		width: 1rem;
		height: 0.125rem;
		border-radius: 999px;
		background: #2e363c;
	}

	span:first-child {
		transform: rotate(45deg);
	}

	span:last-child {
		transform: rotate(-45deg);
	}

	&:hover,
	&:focus-visible {
		background: rgb(218 142 91 / 0.16);
		outline: none;
	}
`;

const Title = styled.h2`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.75rem;
	line-height: 1.2;
`;

const Lead = styled.p<{ $withMargin?: boolean }>`
	margin: ${({ $withMargin }) =>
		$withMargin ? "0.45rem 2rem 1.25rem 0" : "0.45rem 0 0 0"};
	color: ${theme.colors.softForeground};
	font-size: 0.95rem;
	line-height: 1.45;
`;

const AvatarArea = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
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
		font-size: 2.2rem;
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
	height: 20rem;
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
	gap: 0.75rem;
	margin-top: 1rem;
`;

const Tools = styled.div`
	display: flex;
	justify-content: center;
	gap: 0.6rem;
`;

const AvatarOptions = styled.div`
	display: flex;
	max-height: 12rem;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.6rem;
	overflow-y: auto;
	padding: 0.2rem;
`;

const AvatarOption = styled.button<{ $isSelected: boolean }>`
	display: grid;
	width: 4.6rem;
	height: 4.6rem;
	place-items: center;
	overflow: hidden;
	border: 0.1875rem solid
		${({ $isSelected }) => ($isSelected ? "#da8e5b" : "transparent")};
	border-radius: 50%;
	background: ${theme.colors.background};
	padding: 0;
	cursor: pointer;

	&:hover,
	&:focus-visible {
		border-color: #da8e5b;
		outline: none;
	}
`;

const AvatarOptionImage = styled(MuiAvatar)`
	&& {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
`;

const AvatarSkeleton = styled.span`
	width: 4.6rem;
	height: 4.6rem;
	border-radius: 50%;
	background: rgb(242 239 237 / 0.7);
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

const ErrorText = styled.p`
	margin: 1rem 0 0;
	color: ${theme.colors.orangeDark};
	font-size: 0.9rem;
`;

const Actions = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
	margin-top: 1.25rem;
`;

const SecondaryButton = styled.button`
	border: 0.0625rem solid ${theme.colors.orangeDark};
	border-radius: 999px;
	background: transparent;
	padding: 0.55rem 1rem;
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font: inherit;
	font-weight: 700;
`;

const PrimaryButton = styled.button`
	border: 0;
	border-radius: 999px;
	background: ${theme.colors.orangeLight};
	padding: 0.58rem 1.15rem;
	color: ${theme.colors.invertedText};
	cursor: pointer;
	font: inherit;
	font-weight: 700;

	&:disabled {
		cursor: default;
		opacity: 0.6;
	}
`;
