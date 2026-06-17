"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styled from "styled-components";

import { theme } from "@/shared/theme";

const PageBackButton = () => {
	const pathname = usePathname();
	const router = useRouter();
	const [isStandalone, setIsStandalone] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const mediaQuery = window.matchMedia("(display-mode: standalone)");
		const updateStandalone = () => {
			setIsStandalone(
				mediaQuery.matches ||
					Boolean(
						(window.navigator as Navigator & { standalone?: boolean })
							.standalone,
					),
			);
		};

		updateStandalone();
		mediaQuery.addEventListener("change", updateStandalone);

		return () => {
			mediaQuery.removeEventListener("change", updateStandalone);
		};
	}, []);

	if (pathname === "/") {
		return null;
	}

	const handleClick = () => {
		if (typeof window !== "undefined" && window.history.length > 1) {
			router.back();
			return;
		}

		router.push("/");
	};

	return (
		<BackButton
			$isStandalone={isStandalone}
			aria-label="Go back"
			title="Go back"
			type="button"
			onClick={handleClick}
		>
			<ArrowBackRoundedIcon aria-hidden="true" />
			<span>Back</span>
		</BackButton>
	);
};

export default PageBackButton;

const BackButton = styled.button<{ $isStandalone: boolean }>`
	position: fixed;
	top: ${({ $isStandalone }) => ($isStandalone ? "3rem" : "1rem")};
	left: calc(0.9rem + env(safe-area-inset-left));
	z-index: 1400;
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	border: 0.0625rem solid rgb(238 179 141 / 0.36);
	border-radius: 999px;
	background: rgb(242 239 237 / 0.88);
	padding: 0.55rem 0.85rem 0.55rem 0.7rem;
	color: ${theme.colors.bluePrimary};
	box-shadow: 0 0.65rem 1.5rem rgb(4 18 26 / 0.12);
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.86rem;
	font-weight: 700;
	line-height: 1;
	backdrop-filter: blur(14px) saturate(1.2);

	& svg {
		width: 1.15rem;
		height: 1.15rem;
	}

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		color: ${theme.colors.orangeDark};
		outline: none;
	}

	@media (min-width: ${theme.rubberSize.tablet}) {
		display: none;
	}

	@media (max-width: ${theme.rubberSize.tablet}) {
		padding: 0.5rem;

		span {
			display: none;
		}
	}
`;
