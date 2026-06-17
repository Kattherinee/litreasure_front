"use client";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import type { ReactNode } from "react";
import styled from "styled-components";

import { theme } from "@/shared/theme";

export interface IFilterOption<TValue extends string> {
	label: string;
	value: TValue;
}

interface ISelectFilterProps<TValue extends string> {
	isOpen: boolean;
	label: string;
	options: Array<IFilterOption<TValue>>;
	value: TValue;
	valueLabel: string;
	onSelect: (value: TValue) => void;
	onToggle: () => void;
}

export const SelectFilter = <TValue extends string>({
	isOpen,
	label,
	onSelect,
	onToggle,
	options,
	value,
	valueLabel,
}: ISelectFilterProps<TValue>) => (
	<DropdownField>
		<FilterLabel>{label}</FilterLabel>
		<DropdownButton aria-expanded={isOpen} type="button" onClick={onToggle}>
			<DropdownValue>{valueLabel}</DropdownValue>
			<ChevronIcon $isOpen={isOpen} aria-hidden="true" />
		</DropdownButton>
		<DropdownMenu $isOpen={isOpen}>
			{options.map((option) => (
				<DropdownMenuItem
					key={option.value}
					$isSelected={option.value === value}
					type="button"
					onClick={() => onSelect(option.value)}
				>
					{option.label}
				</DropdownMenuItem>
			))}
		</DropdownMenu>
	</DropdownField>
);

interface ISearchDropdownFilterProps {
	ariaLabel: string;
	children: ReactNode;
	isOpen: boolean;
	label: string;
	placeholder: string;
	searchValue: string;
	onOpen: () => void;
	onSearchChange: (value: string) => void;
}

export const SearchDropdownFilter = ({
	ariaLabel,
	children,
	isOpen,
	label,
	onOpen,
	onSearchChange,
	placeholder,
	searchValue,
}: ISearchDropdownFilterProps) => (
	<DropdownField>
		<FilterLabel>{label}</FilterLabel>
		<SearchDropdownField $isOpen={isOpen} onClick={onOpen}>
			<InlineSearchInput
				aria-label={ariaLabel}
				placeholder={placeholder}
				value={searchValue}
				onChange={(event) => {
					onSearchChange(event.target.value);
					onOpen();
				}}
				onFocus={onOpen}
			/>
			<ChevronIcon $isOpen={isOpen} aria-hidden="true" />
		</SearchDropdownField>
		<FilterMenu $isOpen={isOpen}>{children}</FilterMenu>
	</DropdownField>
);

interface IModeFilterProps<TValue extends string> {
	label: string;
	options: Array<IFilterOption<TValue>>;
	value: TValue;
	onChange: (value: TValue) => void;
}

export const ModeFilter = <TValue extends string>({
	label,
	onChange,
	options,
	value,
}: IModeFilterProps<TValue>) => (
	<ModeField>
		<FilterLabel>{label}</FilterLabel>
		<ModeSwitch>
			{options.map((option) => (
				<ModeButton
					key={option.value}
					$isActive={value === option.value}
					type="button"
					onClick={() => onChange(option.value)}
				>
					{option.label}
				</ModeButton>
			))}
		</ModeSwitch>
	</ModeField>
);

interface IResultsFilterBadgeProps {
	label: string;
	total: number;
}

export const ResultsFilterBadge = ({
	label,
	total,
}: IResultsFilterBadgeProps) => (
	<ResultsBadge aria-label={`Found ${label}: ${total}`}>
		<ResultsNumber>{total}</ResultsNumber>
		<ResultsText>{label}</ResultsText>
	</ResultsBadge>
);

interface ISelectedFilterItem {
	label: string;
	value: string;
}

interface ISelectedFiltersProps {
	clearLabel?: string;
	items: ISelectedFilterItem[];
	removeAriaLabel: (label: string) => string;
	onClear: () => void;
	onRemove: (value: string) => void;
}

export const SelectedFilters = ({
	clearLabel = "Clear all",
	items,
	onClear,
	onRemove,
	removeAriaLabel,
}: ISelectedFiltersProps) => {
	if (items.length === 0) return null;

	return (
		<SelectedFiltersRow>
			{items.map((item) => (
				<SelectedFilterChip key={item.value}>
					<span>{item.label}</span>
					<RemoveFilterButton
						aria-label={removeAriaLabel(item.label)}
						type="button"
						onClick={() => onRemove(item.value)}
					>
						×
					</RemoveFilterButton>
				</SelectedFilterChip>
			))}
			<ClearSelectedFiltersButton type="button" onClick={onClear}>
				{clearLabel}
			</ClearSelectedFiltersButton>
		</SelectedFiltersRow>
	);
};

export const Filters = styled.div`
	position: sticky;
	z-index: 15;
	top: 4rem;
	display: grid;
	align-items: end;
	gap: 0.65rem;
	grid-template-columns:
		minmax(10rem, 0.85fr) minmax(12rem, 1.2fr) minmax(16rem, 1.7fr)
		minmax(10rem, 0.8fr) auto;
	margin-top: 1.25rem;
	background: ${theme.colors.background};
	padding: 0.55rem 0;

	@media (max-width: 72rem) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 40rem) {
		grid-template-columns: repeat(5, minmax(12rem, 1fr));
		overflow-x: auto;
		padding-bottom: 0.75rem;
		scrollbar-width: none;

		&::-webkit-scrollbar {
			display: none;
		}
	}
`;

export const ResultsBadge = styled.div`
	display: inline-flex;
	min-height: 2.35rem;
	align-items: baseline;
	justify-content: center;
	gap: 0.42rem;
	border: 0.0625rem solid rgb(218 142 91 / 0.22);
	border-radius: 62.4375rem;
	background: rgb(242 239 237 / 0.72);
	padding: 0.48rem 0.85rem;
	white-space: nowrap;

	@media (max-width: 72rem) {
		justify-self: start;
	}
`;

export const ResultsNumber = styled.span`
	color: ${theme.colors.orangeDark};
	font-family: ${theme.fonts.serif};
	font-size: 1.18rem;
	font-weight: 600;
	line-height: 1;
`;

export const ResultsText = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.86rem;
	line-height: 1;
`;

export const DropdownField = styled.div`
	position: relative;
	display: flex;
	min-width: 0;
	flex-direction: column;
	gap: 0.25rem;
`;

export const FilterLabel = styled.label`
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.76rem;
	line-height: 1.2;
`;

export const DropdownButton = styled.button`
	display: flex;
	width: 100%;
	min-height: 2.35rem;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	border: 0.0625rem solid rgb(211 202 196 / 0.7);
	border-radius: 0.75rem;
	background: rgb(242 239 237 / 0.58);
	padding: 0 0.7rem;
	color: ${theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	font-size: 0.9rem;
	text-align: left;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		background: ${theme.colors.white};
		outline: none;
	}
`;

export const DropdownValue = styled.span`
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

export const ChevronIcon = styled(KeyboardArrowDownIcon)<{ $isOpen: boolean }>`
	&& {
		width: 1.05rem;
		height: 1.05rem;
		flex: 0 0 auto;
		color: ${theme.colors.orangeDark};
		transform: rotate(${({ $isOpen }) => ($isOpen ? "180deg" : "0deg")});
		transition: transform 160ms ease;
	}
`;

export const DropdownMenu = styled.div<{ $isOpen: boolean }>`
	position: absolute;
	z-index: 12;
	top: calc(100% + 0.4rem);
	left: 0;
	width: min(18rem, calc(100vw - 2rem));
	border: 0.0625rem solid rgb(238 179 141 / 0.65);
	border-radius: 0.75rem;
	background: #e8e2de;
	box-shadow: 0 1rem 2.5rem rgb(4 18 26 / 0.18);
	opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
	padding: 0.4rem;
	pointer-events: ${({ $isOpen }) => ($isOpen ? "auto" : "none")};
	transform: translateY(${({ $isOpen }) => ($isOpen ? "0" : "-0.35rem")});
	transition:
		opacity 160ms ease,
		transform 180ms ease;
`;

export const DropdownMenuItem = styled.button<{ $isSelected: boolean }>`
	display: flex;
	width: 100%;
	align-items: center;
	border: 0;
	border-radius: 0.6rem;
	background: ${({ $isSelected }) =>
		$isSelected ? "rgb(218 142 91 / 0.16)" : "transparent"};
	padding: 0.55rem 0.65rem;
	color: ${({ $isSelected }) => ($isSelected ? "#d4641c" : "#233d4d")};
	cursor: pointer;
	font: inherit;
	font-size: 0.9rem;
	font-weight: 600;
	text-align: left;

	&:hover,
	&:focus-visible {
		background: rgb(218 142 91 / 0.12);
		color: #d4641c;
		outline: none;
	}
`;

export const FilterMenu = styled(DropdownMenu)`
	width: min(28rem, calc(100vw - 2rem));
`;

export const SearchDropdownField = styled.div<{ $isOpen: boolean }>`
	display: flex;
	width: 100%;
	min-height: 2.35rem;
	align-items: center;
	gap: 0.5rem;
	border: 0.0625rem solid
		${({ $isOpen }) =>
			$isOpen ? theme.colors.orangeLight : "rgb(211 202 196 / 0.7)"};
	border-radius: 0.75rem;
	background: ${({ $isOpen }) =>
		$isOpen ? theme.colors.white : "rgb(242 239 237 / 0.58)"};
	padding: 0 0.7rem;
	color: ${theme.colors.foreground};
	cursor: text;
	transition:
		background 160ms ease,
		border-color 160ms ease;

	&:hover,
	&:focus-within {
		border-color: ${theme.colors.orangeLight};
		background: ${theme.colors.white};
	}
`;

export const InlineSearchInput = styled.input`
	min-width: 0;
	flex: 1;
	border: 0;
	background: transparent;
	padding: 0;
	color: ${theme.colors.foreground};
	font: inherit;
	font-size: 0.9rem;
	outline: none;

	&::placeholder {
		color: ${theme.colors.foreground};
		opacity: 1;
	}
`;

export const GenreSearchInput = styled.input`
	width: 100%;
	min-height: 2.1rem;
	border: 0.0625rem solid rgb(211 202 196 / 0.7);
	border-radius: 0.625rem;
	background: rgb(255 255 255 / 0.66);
	padding: 0 0.65rem;
	color: ${theme.colors.foreground};
	font: inherit;
	font-size: 0.86rem;
	outline: none;

	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		background: ${theme.colors.white};
	}
`;

export const FilterChips = styled.div`
	display: flex;
	max-height: 11rem;
	flex-wrap: wrap;
	gap: 0.38rem;
	overflow-y: auto;
	padding-right: 0.2rem;
`;

export const FilterChip = styled.button<{ $isSelected: boolean }>`
	border: 0.0625rem solid
		${({ $isSelected }) =>
			$isSelected ? "rgb(218 142 91 / 0.6)" : "rgb(211 202 196 / 0.72)"};
	border-radius: 62.4375rem;
	background: ${({ $isSelected }) =>
		$isSelected ? "rgb(218 142 91 / 0.18)" : "rgb(255 255 255 / 0.58)"};
	padding: 0.34rem 0.66rem;
	color: ${({ $isSelected }) => ($isSelected ? "#d4641c" : "#233d4d")};
	cursor: pointer;
	font: inherit;
	font-size: 0.82rem;
	font-weight: 700;
	line-height: 1;

	&:hover,
	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		background: rgb(218 142 91 / 0.14);
		color: #d4641c;
		outline: none;
	}
`;

export const FilterEmpty = styled.span`
	padding: 0.35rem 0.2rem;
	color: ${theme.colors.softForeground};
	font-size: 0.85rem;
`;

export const ClearFilterButton = styled.button`
	border: 0;
	background: transparent;
	padding: 0.55rem 0.2rem 0.1rem;
	color: #d4641c;
	cursor: pointer;
	font: inherit;
	font-size: 0.84rem;
	font-weight: 700;
`;

export const LoadMoreFilterButton = styled.button`
	width: 100%;
	border: 0.0625rem solid rgb(218 142 91 / 0.28);
	border-radius: 62.4375rem;
	background: rgb(218 142 91 / 0.1);
	margin-top: 0.5rem;
	padding: 0.5rem 0.75rem;
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font: inherit;
	font-size: 0.84rem;
	font-weight: 700;

	&:hover,
	&:focus-visible {
		background: rgb(218 142 91 / 0.16);
		outline: none;
	}

	&:disabled {
		cursor: default;
		opacity: 0.6;
	}
`;

export const SelectedFiltersRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	grid-column: 1 / -1;
	gap: 0.4rem;
	align-items: center;
	margin-top: -0.15rem;
`;

export const SelectedFilterChip = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	border: 0.0625rem solid rgb(218 142 91 / 0.32);
	border-radius: 62.4375rem;
	background: rgb(218 142 91 / 0.12);
	padding: 0.32rem 0.42rem 0.32rem 0.68rem;
	color: ${theme.colors.orangeDark};
	font-size: 0.82rem;
	font-weight: 700;
	line-height: 1;
`;

export const RemoveFilterButton = styled.button`
	display: inline-flex;
	width: 1rem;
	height: 1rem;
	align-items: center;
	justify-content: center;
	border: 0;
	border-radius: 50%;
	background: rgb(212 100 28 / 0.16);
	color: ${theme.colors.orangeDark};
	cursor: pointer;
	font: inherit;
	font-size: 0.9rem;
	line-height: 1;
	padding: 0;

	&:hover,
	&:focus-visible {
		background: rgb(212 100 28 / 0.24);
		outline: none;
	}
`;

export const ClearSelectedFiltersButton = styled.button`
	border: 0;
	background: transparent;
	padding: 0.25rem 0.2rem;
	color: ${theme.colors.softForeground};
	cursor: pointer;
	font: inherit;
	font-size: 0.82rem;
	font-weight: 700;

	&:hover,
	&:focus-visible {
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;

export const ModeField = styled.div`
	display: flex;
	min-width: 0;
	flex-direction: column;
	gap: 0.25rem;
`;

export const ModeSwitch = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	min-height: 2.35rem;
	border: 0.0625rem solid rgb(211 202 196 / 0.7);
	border-radius: 0.75rem;
	background: rgb(242 239 237 / 0.58);
	padding: 0.2rem;
`;

export const ModeButton = styled.button<{ $isActive: boolean }>`
	border: 0;
	border-radius: 0.55rem;
	background: ${({ $isActive }) =>
		$isActive ? theme.colors.orangeLight : theme.colors.transparent};
	color: ${({ $isActive }) =>
		$isActive ? theme.colors.invertedText : theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	font-size: 0.84rem;
	font-weight: 700;

	&:hover,
	&:focus-visible {
		color: ${({ $isActive }) =>
			$isActive ? theme.colors.invertedText : theme.colors.orangeDark};
		outline: none;
	}
`;
