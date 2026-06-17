"use client";

import Link from "next/link";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import styled from "styled-components";

import { theme } from "@/shared/theme";
import { Button } from "@/shared/ui/Button";

export default function NotFound() {
	return (
		<Page>
			<Content>
				<Copy>
					<Code>404</Code>
					<IconWrap aria-hidden="true">
						<SearchOffIcon />
					</IconWrap>
					<Title>Page Not Found</Title>
					<Text>
						Looks like this shelf is empty for now. Return to your feed or try
						searching for another story.
					</Text>
					<ActionRow>
						<HomeButton component={Link} href="/">
							Back to Home
						</HomeButton>
						<LibraryHint>
							<AutoStoriesOutlinedIcon aria-hidden="true" />
							<span>Litreasure</span>
						</LibraryHint>
					</ActionRow>
				</Copy>

				<BookScene aria-hidden="true">
					<BookStack>
						<Book $tone="blue" />
						<Book $tone="orange" />
						<Book $tone="cream" />
					</BookStack>
					<Shelf />
				</BookScene>
			</Content>
		</Page>
	);
}

const Page = styled.div`
	min-height: calc(100dvh - 4.5rem);
	background:
		radial-gradient(
			circle at 18% 14%,
			${theme.alpha.orangeGlow},
			${theme.colors.transparent} 28%
		),
		linear-gradient(
			180deg,
			${theme.colors.backgroundTop} 0%,
			${theme.colors.background} 100%
		);
	padding: clamp(3rem, 7vw, 6rem) 1.5rem;
`;

const Content = styled.section`
	position: relative;
	display: grid;
	width: min(100%, 56rem);
	margin: 0 auto;
	align-items: center;
	gap: clamp(2rem, 6vw, 5rem);
	grid-template-columns: minmax(0, 1fr) minmax(12rem, 18rem);
	padding-top: clamp(2rem, 5vw, 4rem);
	color: ${theme.colors.foreground};

	@media (max-width: 42rem) {
		grid-template-columns: 1fr;
	}
`;

const Copy = styled.div`
	min-width: 0;
`;

const Code = styled.p`
	margin: 0 0 0.75rem;
	color: ${theme.colors.orangeDark};
	font-family: ${theme.fonts.sans};
	font-size: 0.875rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	line-height: 1.2;
	text-transform: uppercase;
`;

const IconWrap = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 4rem;
	height: 4rem;
	margin-bottom: 1.25rem;
	border: 0.0625rem solid ${theme.alpha.blueDivider};
	border-radius: 50%;
	background: ${theme.alpha.surfaceRaised};
	color: ${theme.colors.orangeDark};

	& svg {
		width: 2rem;
		height: 2rem;
	}
`;

const Title = styled.h1`
	max-width: 38rem;
	margin: 0;
	font-family: ${theme.fonts.serif};
	font-size: clamp(3rem, 7vw, 5.5rem);
	font-weight: 600;
	line-height: 0.98;
`;

const Text = styled.p`
	max-width: 34rem;
	margin: 1.25rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 1.1rem;
	line-height: 1.6;
`;

const ActionRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 1rem;
	margin-top: 2rem;
`;

const HomeButton = styled(Button)`
	&& {
		background: ${theme.colors.orangePrimary};
		border-color: ${theme.colors.orangePrimary};
		color: ${theme.colors.white};

		&:hover {
			background: ${theme.colors.bluePrimary};
			border-color: ${theme.colors.bluePrimary};
			color: ${theme.colors.invertedText};
		}
	}
`;

const LibraryHint = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.serif};
	font-size: 1rem;

	& svg {
		width: 1.25rem;
		height: 1.25rem;
		color: ${theme.colors.orangeDark};
	}
`;

const BookScene = styled.div`
	display: flex;
	min-height: 18rem;
	align-items: center;
	justify-content: center;
	flex-direction: column;

	@media (max-width: 42rem) {
		min-height: 12rem;
		align-items: flex-start;
	}
`;

const BookStack = styled.div`
	position: relative;
	width: 14rem;
	height: 12rem;
`;

const Book = styled.div<{ $tone: "blue" | "cream" | "orange" }>`
	position: absolute;
	bottom: 0;
	left: ${({ $tone }) =>
		$tone === "blue" ? "0.75rem" : $tone === "orange" ? "5rem" : "8.5rem"};
	width: ${({ $tone }) => ($tone === "cream" ? "4rem" : "4.4rem")};
	height: ${({ $tone }) =>
		$tone === "blue" ? "10.5rem" : $tone === "orange" ? "12rem" : "9.25rem"};
	border: 0.0625rem solid rgb(4 18 26 / 0.1);
	border-radius: 0.45rem 0.45rem 0.25rem 0.25rem;
	background: ${({ $tone }) => {
		if ($tone === "blue") {
			return theme.colors.bluePrimary;
		}

		if ($tone === "orange") {
			return theme.colors.orangePrimary;
		}

		return theme.colors.surface;
	}};
	box-shadow: 0 1rem 2rem rgb(4 18 26 / 0.12);
	transform: rotate(
		${({ $tone }) =>
			$tone === "blue" ? "-8deg" : $tone === "cream" ? "7deg" : "0deg"}
	);

	&::before {
		position: absolute;
		top: 1rem;
		left: 0.7rem;
		width: 0.35rem;
		height: calc(100% - 2rem);
		border-radius: 62.4375rem;
		background: rgb(255 255 255 / 0.32);
		content: "";
	}

	&::after {
		position: absolute;
		right: 0.65rem;
		bottom: 1rem;
		left: 0.65rem;
		height: 0.35rem;
		border-radius: 62.4375rem;
		background: rgb(4 18 26 / 0.14);
		content: "";
	}
`;

const Shelf = styled.div`
	width: 17rem;
	height: 0.8rem;
	border-radius: 62.4375rem;
	background: ${theme.colors.border};
	box-shadow: 0 0.75rem 1.5rem rgb(4 18 26 / 0.12);
`;
