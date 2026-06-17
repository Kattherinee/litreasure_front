import styled, { css } from "styled-components";

import { theme } from "@/shared/theme";

interface IChipTabItem {
	count?: number;
	id: string;
	label: string;
}

interface IChipTabsProps {
	activeId: string;
	ariaLabel?: string;
	className?: string;
	items: IChipTabItem[];
	variant?: "pill" | "block";
	onChange: (id: string) => void;
}

export const ChipTabs = ({
	activeId,
	ariaLabel,
	className,
	items,
	variant = "pill",
	onChange,
}: IChipTabsProps) => (
	<Root $variant={variant} aria-label={ariaLabel} className={className}>
		{items.map((item) => {
			const isActive = activeId === item.id;

			return (
				<TabButton
					key={item.id}
					$isActive={isActive}
					$variant={variant}
					type="button"
					onClick={() => onChange(item.id)}
				>
					<TabLabel>{item.label}</TabLabel>
					{typeof item.count === "number" ? (
						variant === "block" ? (
							<BlockCount>{item.count}</BlockCount>
						) : (
							<PillCount>{item.count}</PillCount>
						)
					) : null}
				</TabButton>
			);
		})}
	</Root>
);

const Root = styled.div<{ $variant: "pill" | "block" }>`
	display: flex;
	flex-wrap: wrap;
	${({ $variant }) =>
		$variant === "block"
			? css`
					display: grid;
					gap: 0.5rem;
					grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));

					@media (max-width: ${theme.rubberSize.tablet}) {
						display: flex;
						flex-wrap: nowrap;
						overflow-x: auto;
						overflow-y: hidden;
						padding-bottom: 0.15rem;
						scroll-snap-type: x proximity;
						scrollbar-width: none;
						-ms-overflow-style: none;
						grid-template-columns: none;

						&::-webkit-scrollbar {
							display: none;
						}
					}

					@media (max-width: 30rem) {
						gap: 0.45rem;
					}
				`
			: css`
					gap: 0.55rem;

					@media (max-width: ${theme.rubberSize.tablet}) {
						flex-wrap: nowrap;
						overflow-x: auto;
						overflow-y: hidden;
						padding-bottom: 0.15rem;
						scroll-snap-type: x proximity;
						scrollbar-width: none;
						-ms-overflow-style: none;

						&::-webkit-scrollbar {
							display: none;
						}
					}
				`};
`;

const TabButton = styled.button<{
	$isActive: boolean;
	$variant: "pill" | "block";
}>`
	cursor: pointer;
	font: inherit;
	outline: none;
	${({ $variant, $isActive }) =>
		$variant === "block"
			? css`
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 0.75rem;
					border: 0.0625rem solid
						${$isActive ? "transparent" : "rgb(211 202 196 / 0.82)"};
					border-radius: 0.75rem;
					background: ${$isActive ? "var(--tabs-content-bg)" : "transparent"};
					padding: 0.7rem 0.8rem;
					color: ${$isActive
						? theme.colors.orangeDark
						: theme.colors.foreground};
					font-size: 1.05rem;
					font-weight: 500;
					line-height: 1.2;
					text-align: left;

					@media (max-width: ${theme.rubberSize.tablet}) {
						padding: 0.6rem 0.7rem;
						font-size: 0.95rem;
					}
				`
			: css`
					display: inline-flex;
					align-items: center;
					gap: 0.45rem;
					border: 0.0625rem solid
						${$isActive ? theme.colors.orangeLight : "rgb(211 202 196 / 0.82)"};
					border-radius: 999px;
					background: ${$isActive
						? "rgb(218 142 91 / 0.14)"
						: theme.colors.surface};
					padding: 0.45rem 0.85rem;
					color: ${$isActive
						? theme.colors.orangeDark
						: theme.colors.foreground};
					font-size: 0.9rem;
					font-weight: ${$isActive ? 700 : 400};
					line-height: 1.2;

					@media (max-width: ${theme.rubberSize.tablet}) {
						flex: 0 0 auto;
						width: fit-content;
						padding: 0.4rem 0.75rem;
						font-size: 0.86rem;
						scroll-snap-align: start;
					}
				`};

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		color: ${theme.colors.orangeDark};
	}
`;

const TabLabel = styled.span`
	white-space: nowrap;
`;

const PillCount = styled.span`
	color: ${theme.colors.orangeDark};
	font-weight: 700;
`;

const BlockCount = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 1.75rem;
	height: 1.75rem;
	border-radius: 999px;
	background: rgb(218 142 91 / 0.14);
	color: ${theme.colors.orangeDark};
	font-size: 1rem;
	font-weight: 700;
	line-height: 1;
`;
