"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styled from "styled-components";

import { theme } from "@/shared/theme";

export interface IGenrePillProps extends Omit<
	ComponentPropsWithoutRef<typeof Link>,
	"as" | "children"
> {
	children: ReactNode;
	fontSize?: string;
	height?: string;
	paddingBlock?: string;
	paddingInline?: string;
	borderColor?: string;
	color?: string;
	backgroundColor?: string;
}

const GenrePill = ({
	children,
	fontSize = "1rem",
	height = "2.25rem",
	paddingBlock = "0.6rem",
	paddingInline = "1.325rem",
	color = theme.colors.foreground,
	borderColor = "transparent",
	backgroundColor = theme.colors.surface,
	...props
}: IGenrePillProps) => {
	return (
		<PillLink
			$fontSize={fontSize}
			$height={height}
			$paddingBlock={paddingBlock}
			$paddingInline={paddingInline}
			$borderColor={borderColor}
			$color={color}
		$backgroundColor={backgroundColor}
		prefetch={false}
		{...props}
	>
			{children}
		</PillLink>
	);
};

export default GenrePill;

const PillLink = styled(Link)<{
	$fontSize: string;
	$height: string;
	$paddingBlock: string;
	$paddingInline: string;
	$borderColor: string;
	$color: string;
	$backgroundColor: string;
}>`
	display: inline-flex;
	align-items: center;
	min-height: ${({ $height }) => $height};
	border-radius: 62.4375rem;
	border: 0.0625rem solid ${({ $borderColor }) => $borderColor};
	background: ${({ $backgroundColor }) => $backgroundColor};
	padding: ${({ $paddingBlock, $paddingInline }) =>
		`${$paddingBlock} ${$paddingInline}`};
	color: ${({ $color }) => $color};
	font-family: ${theme.fonts.sans};
	font-size: ${({ $fontSize }) => $fontSize};
	font-weight: 400;
	line-height: 1.2;
	text-decoration: none;
	white-space: nowrap;
	transition:
		background 180ms ease,
		color 180ms ease,
		transform 180ms ease;

	&:hover,
	&:focus-visible {
		background: ${theme.colors.orangeLight};
		color: ${theme.colors.invertedText};
		outline: none;
		transform: translateY(-0.0625rem);
	}

	@media (max-width: ${theme.rubberSize.tablet}) {
		padding: 0.4rem 0.9rem;
		font-size: 0.875rem;
		min-height: 2rem;
	}
`;
