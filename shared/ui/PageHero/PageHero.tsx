"use client";

import type { ReactNode } from "react";
import styled from "styled-components";

import { theme } from "@/shared/theme";
import { Button } from "@/shared/ui/Button";

interface IPageHeroProps {
	actionLabel?: string;
	copyWidth?: string;
	children?: ReactNode;
	titleSuffix?: ReactNode;
	text: string;
	title: string;
	onAction?: () => void;
}

export const PageHero = ({
	actionLabel,
	children,
	copyWidth,
	text,
	title,
	titleSuffix,
	onAction,
}: IPageHeroProps) => (
	<Hero>
		<HeroInner $copyWidth={copyWidth}>
			<HeroCopy $copyWidth={copyWidth}>
				<PageTitleRow>
					<PageTitle>{title}</PageTitle>
					{titleSuffix ? <TitleSuffix>{titleSuffix}</TitleSuffix> : null}
				</PageTitleRow>
				<HeroText>{text}</HeroText>
				{children ? <HeroActions>{children}</HeroActions> : null}
			</HeroCopy>
			{actionLabel && onAction ? (
				<Button buttonType="containedInverted" type="button" onClick={onAction}>
					{actionLabel}
				</Button>
			) : null}
		</HeroInner>
	</Hero>
);

const Hero = styled.section`
	width: 100vw;
	margin-left: calc(50% - 50vw);
	background: url("/images/TitleBlock.svg") center / cover no-repeat;
	@media (max-width: ${theme.rubberSize.tablet}) {
		padding-top: 2rem;
	}
`;

const HeroInner = styled.div<{ $copyWidth?: string }>`
	display: flex;
	width: ${({ $copyWidth }) => $copyWidth ?? "100%"};
	align-items: flex-end;
	justify-content: space-between;
	gap: 1rem;
	margin: 0 auto;
	padding: 4.5vw 0 1.25rem;

	@media (max-width: 42rem) {
		width: 92vw;
		flex-direction: column;
		align-items: flex-start;
		padding: 15.5vw 0 1.25rem;
	}
`;

const HeroCopy = styled.div<{ $copyWidth?: string }>`
	min-width: 0;
	max-width: ${({ $copyWidth }) => $copyWidth ?? "43rem"};
`;

const PageTitle = styled.h1`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 2.5vw;
	font-weight: 600;
	line-height: 1.8;

	@media (max-width: 48rem) {
		font-size: 2.5rem;
	}
`;

const PageTitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
	flex-wrap: wrap;
`;

const TitleSuffix = styled.div`
	display: flex;
	flex: 1 1 auto;
	align-items: center;
	justify-content: flex-end;
`;

const HeroText = styled.p`
	max-width: 43rem;
	margin: 1rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 1.05rem;
	line-height: 1.6;
`;

const HeroActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
`;
