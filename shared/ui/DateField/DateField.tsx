import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { ButtonBase, IconButton, Popover } from "@mui/material";
import { useMemo, useState } from "react";
import styled from "styled-components";

import { theme } from "@/shared/theme";

export interface IDateFieldProps {
	label: string;
	max?: string;
	min?: string;
	value: string;
	onChange: (value: string) => void;
}

const monthFormatter = new Intl.DateTimeFormat("en-US", {
	month: "long",
	year: "numeric",
});

const displayFormatter = new Intl.DateTimeFormat("en-US", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
});

const toDateInputValue = (date: Date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
};

const getLocalDate = (value: string) => new Date(`${value}T00:00:00`);

const getCalendarDays = (viewDate: Date) => {
	const firstDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
	const startOffset = (firstDate.getDay() + 6) % 7;
	const startDate = new Date(firstDate);
	startDate.setDate(firstDate.getDate() - startOffset);

	return Array.from({ length: 42 }, (_, index) => {
		const date = new Date(startDate);
		date.setDate(startDate.getDate() + index);

		return date;
	});
};

const isBeforeDate = (date: Date, min?: string) =>
	Boolean(min && date < getLocalDate(min));

const isAfterDate = (date: Date, max?: string) =>
	Boolean(max && date > getLocalDate(max));

const DateField = ({ label, max, min, value, onChange }: IDateFieldProps) => {
	const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
	const [viewDate, setViewDate] = useState(() => getLocalDate(value));
	const isOpen = Boolean(anchorElement);
	const selectedDate = useMemo(() => getLocalDate(value), [value]);
	const calendarDays = useMemo(() => getCalendarDays(viewDate), [viewDate]);

	const shiftMonth = (direction: -1 | 1) => {
		setViewDate((current) => {
			const nextDate = new Date(current);
			nextDate.setMonth(current.getMonth() + direction);

			return nextDate;
		});
	};

	const handleSelect = (date: Date) => {
		if (isBeforeDate(date, min) || isAfterDate(date, max)) return;

		onChange(toDateInputValue(date));
		setAnchorElement(null);
	};

	return (
		<Field>
			<Label>{label}</Label>
			<FieldButton
				type="button"
				onClick={(event) => {
					setViewDate(selectedDate);
					setAnchorElement(event.currentTarget);
				}}
			>
				<span>{displayFormatter.format(selectedDate)}</span>
				<CalendarMonthIcon fontSize="small" />
			</FieldButton>
			<StyledPopover
				anchorEl={anchorElement}
				open={isOpen}
				anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
				transformOrigin={{ horizontal: "left", vertical: "top" }}
				onClose={() => setAnchorElement(null)}
			>
				<CalendarPanel>
					<CalendarHeader>
						<MonthTitle>{monthFormatter.format(viewDate)}</MonthTitle>
						<CalendarControls>
							<CalendarIconButton
								type="button"
								aria-label="Previous month"
								onClick={() => shiftMonth(-1)}
							>
								<KeyboardArrowLeftIcon />
							</CalendarIconButton>
							<CalendarIconButton
								type="button"
								aria-label="Next month"
								onClick={() => shiftMonth(1)}
							>
								<KeyboardArrowRightIcon />
							</CalendarIconButton>
						</CalendarControls>
					</CalendarHeader>
					<WeekGrid>
						{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
							<WeekDay key={day}>{day}</WeekDay>
						))}
						{calendarDays.map((date) => {
							const dateValue = toDateInputValue(date);
							const isCurrentMonth = date.getMonth() === viewDate.getMonth();
							const isSelected = dateValue === value;
							const isDisabled =
								isBeforeDate(date, min) || isAfterDate(date, max);

							return (
								<DayButton
									key={dateValue}
									type="button"
									disabled={isDisabled}
									$isCurrentMonth={isCurrentMonth}
									$isSelected={isSelected}
									onClick={() => handleSelect(date)}
								>
									{date.getDate()}
								</DayButton>
							);
						})}
					</WeekGrid>
				</CalendarPanel>
			</StyledPopover>
		</Field>
	);
};

export default DateField;

const Field = styled.div`
	display: grid;
	gap: 0.35rem;
`;

const Label = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.78rem;
	font-weight: 700;
`;

const FieldButton = styled(ButtonBase)`
	&& {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		width: 100%;
		min-height: 2.9rem;
		border: 0.0625rem solid rgb(211 202 196 / 0.82);
		border-radius: 0.9rem;
		background: rgb(242 239 237 / 0.74);
		padding: 0 0.75rem;
		color: ${theme.colors.foreground};
		font: inherit;
		font-size: 1rem;
		text-align: left;
		transition:
			background-color 150ms,
			border-color 150ms,
			box-shadow 150ms;

		&:hover,
		&.Mui-focusVisible {
			border-color: rgb(218 142 91 / 0.5);
			background: rgb(242 239 237 / 0.96);
			box-shadow: 0 0 0 0.16rem rgb(218 142 91 / 0.12);
		}

		svg {
			color: ${theme.colors.foreground};
		}
	}
`;

const StyledPopover = styled(Popover)`
	.MuiPaper-root {
		margin-top: 0.45rem;
		border: 0.0625rem solid rgb(211 202 196 / 0.82);
		border-radius: 1rem;
		background: ${theme.colors.surface};
		box-shadow: 0 1rem 2.5rem rgb(4 18 26 / 0.14);
	}
`;

const CalendarPanel = styled.div`
	width: min(19rem, calc(100vw - 2rem));
	padding: 1rem;
`;

const CalendarHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	margin-bottom: 0.8rem;
`;

const MonthTitle = styled.span`
	color: ${theme.colors.foreground};
	font-weight: 800;
	text-transform: capitalize;
`;

const CalendarControls = styled.div`
	display: flex;
	gap: 0.25rem;
`;

const CalendarIconButton = styled(IconButton)`
	&& {
		width: 2rem;
		height: 2rem;
		color: ${theme.colors.foreground};

		&:hover {
			background: rgb(218 142 91 / 0.14);
			color: ${theme.colors.orangeDark};
		}
	}
`;

const WeekGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(7, minmax(0, 1fr));
	gap: 0.28rem;
`;

const WeekDay = styled.span`
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.74rem;
	font-weight: 800;
	text-align: center;
`;

const DayButton = styled.button<{
	$isCurrentMonth: boolean;
	$isSelected: boolean;
}>`
	display: grid;
	place-items: center;
	width: 100%;
	aspect-ratio: 1;
	border: 0.0625rem solid
		${({ $isSelected }) =>
			$isSelected ? theme.colors.orangeLight : "transparent"};
	border-radius: 0.65rem;
	background: ${({ $isSelected }) =>
		$isSelected ? "rgb(218 142 91 / 0.2)" : "transparent"};
	color: ${({ $isCurrentMonth, $isSelected }) => {
		if ($isSelected) return theme.colors.orangeDark;
		if ($isCurrentMonth) return theme.colors.foreground;

		return theme.colors.muted;
	}};
	cursor: pointer;
	font: inherit;
	font-family: ${theme.fonts.sans};
	font-size: 0.88rem;
	font-weight: ${({ $isSelected }) => ($isSelected ? 800 : 600)};
	transition:
		background-color 150ms,
		border-color 150ms,
		color 150ms;

	&:hover:not(:disabled),
	&:focus-visible:not(:disabled) {
		border-color: rgb(218 142 91 / 0.48);
		background: rgb(218 142 91 / 0.12);
		color: ${theme.colors.orangeDark};
		outline: none;
	}

	&:disabled {
		color: rgb(186 183 180 / 0.62);
		cursor: not-allowed;
		text-decoration: line-through;
	}
`;
