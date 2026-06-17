"use client";

import styled, { keyframes } from "styled-components";

import { theme } from "@/shared/theme";

interface ISkeletonBlockProps {
	$height?: string;
	$radius?: string;
	$width?: string;
}

export const SkeletonBlock = styled.div<ISkeletonBlockProps>`
	position: relative;
	overflow: hidden;
	width: ${({ $width }) => $width ?? "100%"};
	height: ${({ $height }) => $height ?? "1rem"};
	border-radius: ${({ $radius }) => $radius ?? "0.5rem"};
	background: linear-gradient(
		135deg,
		rgb(242 239 237 / 0.7),
		rgb(211 202 196 / 0.72)
	);

	&::after {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			rgb(255 255 255 / 0) 0%,
			rgb(255 255 255 / 0.34) 45%,
			rgb(255 255 255 / 0) 100%
		);
		content: "";
		transform: translateX(-100%);
		animation: ${keyframes`
			to {
				transform: translateX(100%);
			}
		`} 1.4s ease-in-out infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		&::after {
			animation: none;
		}
	}
`;

export const BookCardSkeleton = ({ size = "default" }: { size?: "compact" | "default" }) => (
	<BookCardSkeletonWrap $size={size} aria-hidden="true">
		<SkeletonBlock
			$height={size === "compact" ? "11.45rem" : "15.25rem"}
			$radius="0.7rem"
			$width={size === "compact" ? "6.9rem" : "10rem"}
		/>
		<SkeletonBlock $height="1rem" $width={size === "compact" ? "6.3rem" : "9rem"} />
		<SkeletonBlock $height="0.8rem" $width={size === "compact" ? "5rem" : "7rem"} />
	</BookCardSkeletonWrap>
);

const BookCardSkeletonWrap = styled.div<{ $size: "compact" | "default" }>`
	display: flex;
	width: ${({ $size }) => ($size === "compact" ? "6.9rem" : "10rem")};
	height: ${({ $size }) => ($size === "compact" ? "14.75rem" : "18.95rem")};
	flex-direction: column;
	gap: 0.5rem;
	overflow: hidden;
`;

export const GenrePillSkeleton = () => (
	<SkeletonBlock aria-hidden="true" $height="2.25rem" $radius="62.4375rem" $width="7.5rem" />
);

export const CoverPlaceholder = styled.div`
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background:
		linear-gradient(145deg, rgb(242 239 237 / 0.82), rgb(211 202 196 / 0.86)),
		${theme.colors.surface};

	&::before {
		position: absolute;
		inset: 18%;
		border: 0.0625rem solid rgb(35 61 77 / 0.1);
		border-radius: 0.45rem;
		content: "";
	}
`;
