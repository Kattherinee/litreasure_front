"use client";

import styled from "styled-components";

import { theme } from "@/shared/theme";

interface IRecommendationSearchTabProps {
	isActive: boolean;
	onClick: () => void;
}

export const RecommendationSearchTab = ({
	isActive,
	onClick,
}: IRecommendationSearchTabProps) => (
	<RecommendationTabButton
		aria-pressed={isActive}
		$isActive={isActive}
		type="button"
		onClick={onClick}
	>
		{isActive ? "Back to normal search" : "Recommendation mode"}
	</RecommendationTabButton>
);

const RecommendationTabButton = styled.button<{ $isActive: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.45rem;
	flex: 0 0 auto;
	min-height: 2rem;
	border: 0.0625rem solid
		${({ $isActive }) =>
			$isActive ? theme.colors.orangeDark : theme.colors.orangeLight};
	border-radius: 62.4375rem;
	background: ${({ $isActive }) =>
		$isActive
			? `linear-gradient(135deg, ${theme.colors.orangeDark}, ${theme.colors.orangeLight})`
			: `linear-gradient(135deg, rgb(255 249 244), rgb(242 239 237))`};
	padding: 0.45rem 1rem;
	color: ${({ $isActive }) =>
		$isActive ? theme.colors.invertedText : theme.colors.orangeDark};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.9rem;
	font-weight: 700;
	line-height: 1;
	white-space: nowrap;
	box-shadow:
		0 0.6rem 1.2rem rgb(218 142 91 / 0.14),
		inset 0 0 0 0.0625rem rgb(255 255 255 / 0.35);
	transition:
		transform 160ms ease,
		box-shadow 160ms ease,
		background 160ms ease,
		color 160ms ease;

	&:hover,
	&:focus-visible {
		outline: none;
		transform: translateY(-0.0625rem);
		box-shadow:
			0 0.85rem 1.6rem rgb(218 142 91 / 0.2),
			inset 0 0 0 0.0625rem rgb(255 255 255 / 0.45);
	}
`;
