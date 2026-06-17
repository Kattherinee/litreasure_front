"use client";

import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import { useEffect, useRef, useState } from "react";
import type { CropperRef } from "react-advanced-cropper";
import { CircleStencil, Cropper } from "react-advanced-cropper";
import styled from "styled-components";

import { useUploadImageMutation, type IImageUploadPurpose } from "@/shared/api/images";
import { theme } from "@/shared/theme";

type IImageUploadShape = "square" | "circle";

interface IImageValidationRules {
	maxRatio?: number;
	minHeight?: number;
	minRatio?: number;
	minWidth?: number;
}

interface IImageUploadFieldProps {
	aspectRatio?: number;
	className?: string;
	cropLabel?: string;
	cropMessage?: string;
	disabled?: boolean;
	forceCrop?: boolean;
	idealHeight?: number;
	idealWidth?: number;
	onChange: (url: string) => void;
	onError?: (message: string) => void;
	placeholderHint?: string;
	placeholderText?: string;
	purpose: IImageUploadPurpose;
	shape?: IImageUploadShape;
	value?: string;
	validation?: IImageValidationRules;
}

type ICropState = {
	file: File;
	height: number;
	previewUrl: string;
	width: number;
};

const loadImage = (src: string) =>
	new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error("Failed to read image."));
		image.src = src;
	});

const readImageSize = async (src: string) => {
	const image = await loadImage(src);

	return {
		height: image.naturalHeight,
		width: image.naturalWidth,
	};
};

const isValidSize = (
	width: number,
	height: number,
	rules?: IImageValidationRules,
) => {
	if (!rules) return true;
	const ratio = width / height;

	if (rules.minWidth && width < rules.minWidth) return false;
	if (rules.minHeight && height < rules.minHeight) return false;
	if (rules.minRatio && ratio < rules.minRatio) return false;
	if (rules.maxRatio && ratio > rules.maxRatio) return false;

	return true;
};

export const ImageUploadField = ({
	aspectRatio,
	className,
	cropLabel = "Crop and upload",
	cropMessage = "Image dimensions are not suitable. Choose a new one or crop this one.",
	disabled = false,
	forceCrop = false,
	idealHeight,
	idealWidth,
	onChange,
	onError,
	placeholderHint,
	placeholderText = "Upload image",
	purpose,
	shape = "square",
	value,
	validation,
}: IImageUploadFieldProps) => {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const cropperRef = useRef<CropperRef>(null);
	const uploadImageMutation = useUploadImageMutation();
	const [previewUrl, setPreviewUrl] = useState("");
	const [cropState, setCropState] = useState<ICropState | null>(null);

	const setError = (message: string) => onError?.(message);

	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			if (cropState?.previewUrl) URL.revokeObjectURL(cropState.previewUrl);
		};
	}, [cropState?.previewUrl, previewUrl]);

	const clearLocal = () => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		if (cropState?.previewUrl) URL.revokeObjectURL(cropState.previewUrl);
		setPreviewUrl("");
		setCropState(null);
	};

	const uploadFile = async (file: Blob, fileName: string) => {
		const uploadingFile =
			file instanceof File ? file : new File([file], fileName, { type: file.type });
		const uploaded = await uploadImageMutation.mutateAsync({
			file: uploadingFile,
			purpose,
		});
		onChange(uploaded.url);
	};

	const openPicker = () => {
		if (disabled) return;
		inputRef.current?.click();
	};

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;

		setError("");
		onChange("");
		clearLocal();

		const localPreview = URL.createObjectURL(file);
		try {
			const { height, width } = await readImageSize(localPreview);
			const shouldCrop = forceCrop || !isValidSize(width, height, validation);

			if (shouldCrop) {
				setCropState({ file, height, previewUrl: localPreview, width });
				return;
			}

			await uploadFile(file, file.name);
			URL.revokeObjectURL(localPreview);
		} catch (caughtError) {
			URL.revokeObjectURL(localPreview);
			setError(
				caughtError instanceof Error
					? caughtError.message
					: "Failed to process image.",
			);
		}
	};

	const handleApplyCrop = async () => {
		if (!cropState) return;

		try {
			setError("");
			const canvas = cropperRef.current?.getCanvas({
				height: idealHeight,
				imageSmoothingQuality: "high",
				width: idealWidth,
			});
			if (!canvas) throw new Error("Failed to prepare crop.");

			const blob = await new Promise<Blob | null>((resolve) =>
				canvas.toBlob(resolve, "image/jpeg", 0.92),
			);
			if (!blob) throw new Error("Failed to crop image.");

			await uploadFile(blob, cropState.file.name);
			URL.revokeObjectURL(cropState.previewUrl);
			setCropState(null);
		} catch (caughtError) {
			setError(
				caughtError instanceof Error
					? caughtError.message
					: "Failed to crop image.",
			);
		}
	};

	const activeUrl = previewUrl || value;
	const isCircle = shape === "circle";

	return (
		<Root className={className}>
			<UploadArea
				$shape={shape}
				$url={activeUrl}
				aria-label="Upload image"
				disabled={disabled || uploadImageMutation.isPending}
				type="button"
				onClick={openPicker}
			>
				{activeUrl ? null : (
					<UploadPlaceholder>
						<AutoStoriesOutlinedIcon aria-hidden="true" />
						<span>{placeholderText}</span>
						{placeholderHint ? <small>{placeholderHint}</small> : null}
					</UploadPlaceholder>
				)}
			</UploadArea>

			{activeUrl ? (
				<Actions>
					<ActionButton
						disabled={uploadImageMutation.isPending}
						type="button"
						onClick={openPicker}
					>
						{uploadImageMutation.isPending ? "Uploading..." : "Replace"}
					</ActionButton>
					<ActionButton
						disabled={uploadImageMutation.isPending}
						type="button"
						onClick={() => {
							clearLocal();
							onChange("");
						}}
					>
						Remove
					</ActionButton>
				</Actions>
			) : null}

			<HiddenInput
				ref={inputRef}
				accept="image/*"
				type="file"
				onChange={handleFileChange}
			/>

			{cropState ? (
				<CropOverlay role="presentation" onMouseDown={(event) => event.stopPropagation()}>
					<CropModal
						aria-label="Crop image"
						aria-modal="true"
						role="dialog"
						onMouseDown={(event) => event.stopPropagation()}
					>
						<CropMessage>{cropMessage}</CropMessage>
						<CropperShell>
							<StyledCropper
								ref={cropperRef}
								src={cropState.previewUrl}
								stencilComponent={isCircle ? CircleStencil : undefined}
								stencilProps={aspectRatio ? { aspectRatio } : undefined}
							/>
						</CropperShell>
						<CropMeta>
							Original size: {cropState.width}x{cropState.height} px.
						</CropMeta>
						<CropActions>
							<ActionButton type="button" onClick={openPicker}>
								Choose another image
							</ActionButton>
							<ActionButton type="button" onClick={handleApplyCrop}>
								{cropLabel}
							</ActionButton>
						</CropActions>
					</CropModal>
				</CropOverlay>
			) : null}
		</Root>
	);
};

const Root = styled.div`
	display: grid;
	gap: 0.65rem;
	justify-items: center;
`;

const UploadArea = styled.button<{ $shape: IImageUploadShape; $url?: string }>`
	position: relative;
	display: grid;
	width: ${({ $shape }) => ($shape === "circle" ? "7.25rem" : "11rem")};
	aspect-ratio: ${({ $shape }) => ($shape === "circle" ? "1 / 1" : "2 / 3")};
	place-items: center;
	overflow: hidden;
	border: 0.0625rem dashed
		${({ $url }) => ($url ? "transparent" : "rgb(218 142 91 / 0.62)")};
	border-radius: ${({ $shape }) => ($shape === "circle" ? "999px" : "0.8rem")};
	background:
		linear-gradient(
			rgb(4 18 26 / ${({ $url }) => ($url ? "0.12" : "0.06")}),
			rgb(4 18 26 / ${({ $url }) => ($url ? "0.12" : "0.06")})
		),
		${({ $url }) =>
			$url ? `url("${$url}") center / cover no-repeat` : "rgb(242 239 237 / 0.72)"};
	color: ${theme.colors.softForeground};
	cursor: pointer;
	font: inherit;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		outline: none;
	}
`;

const UploadPlaceholder = styled.span`
	display: grid;
	justify-items: center;
	gap: 0.45rem;
	padding: 0.8rem;
	font-size: 0.82rem;
	font-weight: 700;
	text-align: center;

	& svg {
		width: 2rem;
		height: 2rem;
		color: ${theme.colors.orangeDark};
	}

	& small {
		color: ${theme.colors.muted};
		font-size: 0.72rem;
		font-weight: 600;
		line-height: 1.2;
	}
`;

const HiddenInput = styled.input`
	display: none;
`;

const Actions = styled.div`
	display: flex;
	gap: 0.45rem;
`;

const ActionButton = styled.button`
	border: 0.0625rem solid rgb(211 202 196 / 0.82);
	border-radius: 999px;
	background: rgb(242 239 237 / 0.74);
	padding: 0.35rem 0.7rem;
	color: ${theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	font-size: 0.76rem;
	font-weight: 700;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;

const CropOverlay = styled.div`
	position: fixed;
	z-index: 1410;
	inset: 0;
	display: grid;
	place-items: center;
	background: rgb(4 18 26 / 0.48);
	padding: 1rem;
`;

const CropModal = styled.section`
	display: grid;
	width: min(100%, 32rem);
	gap: 0.75rem;
	border: 0.0625rem solid rgb(218 142 91 / 0.42);
	border-radius: 1rem;
	background: ${theme.colors.background};
	padding: 1rem;
	box-shadow: 0 1.25rem 3rem rgb(4 18 26 / 0.2);
`;

const CropMessage = styled.p`
	margin: 0;
	color: ${theme.colors.orangeDark};
	font-size: 0.84rem;
	font-weight: 700;
	line-height: 1.35;
`;

const CropperShell = styled.div`
	height: 21rem;
	overflow: hidden;
	border: 0.0625rem solid rgb(218 142 91 / 0.2);
	border-radius: 0.85rem;
	background: rgb(242 239 237 / 0.72);
`;

const StyledCropper = styled(Cropper)`
	width: 100%;
	height: 100%;
`;

const CropMeta = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 0.78rem;
`;

const CropActions = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 0.45rem;
`;
