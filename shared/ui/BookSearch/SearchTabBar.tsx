"use client";

import styled from "styled-components";

import { theme } from "@/shared/theme";

export type ISearchTabId =
	| "author"
	| "book"
	| "collection"
	| "genre"
	| "series";
export type ISearchTabActiveId = ISearchTabId | "all";

export const SEARCH_TABS: Array<{ id: ISearchTabId; label: string }> = [
	{ id: "book", label: "Books" },
	{ id: "author", label: "Authors" },
	{ id: "series", label: "Series" },
	{ id: "genre", label: "Genres" },
	{ id: "collection", label: "Collections" },
];

export const ALL_SEARCH_TAB_OPTIONS: Array<{
	id: ISearchTabActiveId;
	label: string;
}> = [{ id: "all", label: "All" }, ...SEARCH_TABS];

interface ISearchTabBarProps {
	activeTab: ISearchTabActiveId;
	counts: Record<ISearchTabId, number>;
	isFetching: boolean;
	shouldSearch: boolean;
	total: number;
	visibleTabs?: ISearchTabId[];
	onTabChange: (tab: ISearchTabActiveId) => void;
}

export const SearchTabBar = ({
	activeTab,
	onTabChange,
	visibleTabs,
}: ISearchTabBarProps) => (
	<>
		{ALL_SEARCH_TAB_OPTIONS.filter(
			(tab) => !visibleTabs || visibleTabs.includes(tab.id as ISearchTabId),
		).map((tab) => {
			const isActive = activeTab === tab.id;

			return (
				<SearchTabButton
					key={tab.id}
					aria-pressed={isActive}
					$isActive={isActive}
					type="button"
					onClick={() => onTabChange(tab.id)}
				>
					{tab.label}
				</SearchTabButton>
			);
		})}
	</>
);

export const SearchTabButton = styled.button<{
	$isActive: boolean;
}>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.45rem;
	flex: 0 0 auto;
	min-height: 2rem;
	border: 0.0625rem solid
		${({ $isActive }) =>
			$isActive ? theme.colors.orangeLight : theme.colors.transparent};
	border-radius: 62.4375rem;
	background: ${({ $isActive }) =>
		$isActive ? theme.colors.orangeLight : theme.colors.surface};
	padding: 0.45rem 0.95rem;
	color: ${({ $isActive }) =>
		$isActive ? theme.colors.invertedText : theme.colors.foreground};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.9rem;
	line-height: 1;
	white-space: nowrap;
	transition:
		background 160ms ease,
		border-color 160ms ease,
		color 160ms ease;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		outline: none;
	}
`;

export const SearchTabCount = styled.span<{
	$hasResults: boolean;
	$isActive: boolean;
}>`
	display: inline-flex;
	min-width: 1.25rem;
	height: 1.25rem;
	align-items: center;
	justify-content: center;
	border-radius: 999px;
	background: ${({ $hasResults, $isActive }) =>
		$isActive
			? "rgb(242 239 237 / 0.9)"
			: $hasResults
				? "rgb(218 142 91 / 0.16)"
				: "rgb(186 183 180 / 0.18)"};
	color: ${({ $hasResults, $isActive }) =>
		$isActive
			? theme.colors.orangeDark
			: $hasResults
				? theme.colors.orangeDark
				: theme.colors.muted};
	font-size: 0.72rem;
	font-weight: 700;
	line-height: 1;
`;
