import CheckIcon from "@mui/icons-material/Check";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useState } from "react";
import styled from "styled-components";

import type { IUserBookStatus } from "@/shared/api/user-books";
import { theme } from "@/shared/theme";

interface IBookLibraryActionProps {
	currentStatus?: IUserBookStatus | null;
	disabled?: boolean;
	size?: "default" | "small";
	onSaveStatus: (status: IUserBookStatus) => Promise<void> | void;
}

const statusLabels: Record<IUserBookStatus, string> = {
	dropped: "Dropped",
	finished: "Finished",
	paused: "Paused",
	planned: "Planned",
	reading: "Reading",
	rereading: "Rereading",
};

const bookStatuses: Array<{ id: IUserBookStatus; label: string }> = [
	{ id: "planned", label: statusLabels.planned },
	{ id: "reading", label: statusLabels.reading },
	{ id: "finished", label: statusLabels.finished },
	{ id: "paused", label: statusLabels.paused },
	{ id: "rereading", label: statusLabels.rereading },
	{ id: "dropped", label: statusLabels.dropped },
];

const BookLibraryAction = ({
	currentStatus,
	disabled = false,
	size = "default",
	onSaveStatus,
}: IBookLibraryActionProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const isTracked = Boolean(currentStatus);
	const currentLabel = currentStatus
		? statusLabels[currentStatus]
		: "Add to library";

	const saveStatus = async (status: IUserBookStatus) => {
		setIsOpen(false);
		await onSaveStatus(status);
	};

	return (
		<LibraryAction
			$isOpen={isOpen}
			$size={size}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) {
					setIsOpen(false);
				}
			}}
		>
			<LibraryMainButton
				$isTracked={isTracked}
				$size={size}
				aria-expanded={isTracked ? isOpen : undefined}
				aria-haspopup={isTracked ? "menu" : undefined}
				disabled={disabled}
				type="button"
				onClick={() => {
					if (isTracked) {
						setIsOpen((current) => !current);
						return;
					}

					void saveStatus("planned");
				}}
			>
				<span>{currentLabel}</span>
				{isTracked ? <KeyboardArrowDownIcon aria-hidden="true" /> : null}
			</LibraryMainButton>
			{isTracked ? null : (
				<LibraryMenuButton
					$isTracked={isTracked}
					$size={size}
					aria-expanded={isOpen}
					aria-label="Change book status"
					disabled={disabled}
					type="button"
					onClick={() => setIsOpen((current) => !current)}
				>
					<KeyboardArrowDownIcon aria-hidden="true" />
				</LibraryMenuButton>
			)}
			{isOpen ? (
				<StatusMenu $size={size} role="menu">
					{bookStatuses.map((status) => (
						<StatusMenuItem
							key={status.id}
							$isActive={currentStatus === status.id}
							role="menuitem"
							type="button"
							onClick={() => void saveStatus(status.id)}
						>
							<span>{status.label}</span>
							{currentStatus === status.id ? <CheckIcon aria-hidden="true" /> : null}
						</StatusMenuItem>
					))}
				</StatusMenu>
			) : null}
		</LibraryAction>
	);
};

export default BookLibraryAction;

const LibraryAction = styled.div<{
	$isOpen: boolean;
	$size: "default" | "small";
}>`
	position: relative;
	z-index: ${({ $isOpen }) => ($isOpen ? 40 : 1)};
	display: inline-flex;
	align-items: stretch;
	justify-self: end;
	margin-right: ${({ $size }) => ($size === "small" ? "0.35rem" : "0")};

	@media (max-width: 34rem) {
		display: none;
	}
`;

const LibraryButtonBase = styled.button<{
	$isTracked: boolean;
	$size: "default" | "small";
}>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: ${({ $size }) => ($size === "small" ? "2.1rem" : "2.65rem")};
	border: 0;
	background: ${({ $isTracked }) =>
		$isTracked ? theme.colors.surface : theme.colors.orangeLight};
	color: ${({ $isTracked }) =>
		$isTracked ? theme.colors.darkerOrangeLight : theme.colors.invertedText};
	cursor: pointer;
	font-family: ${theme.fonts.serif};
	font-size: ${({ $size }) => ($size === "small" ? "0.88rem" : "1.1rem")};
	font-weight: 700;
	line-height: 1.2;
	transition:
		background 180ms ease,
		color 180ms ease,
		transform 180ms ease;

	&:hover,
	&:focus-visible {
		background: ${({ $isTracked }) =>
			$isTracked ? theme.colors.orangeLight : theme.colors.surface};
		color: ${({ $isTracked }) =>
			$isTracked ? theme.colors.invertedText : theme.colors.darkerOrangeLight};
		outline: none;
	}

	&:disabled {
		cursor: wait;
		opacity: 0.72;
	}
`;

const LibraryMainButton = styled(LibraryButtonBase)`
	min-width: ${({ $isTracked, $size }) => {
		if ($size === "small") return $isTracked ? "5.9rem" : "7.15rem";
		return $isTracked ? "7.8rem" : "10.5rem";
	}};
	gap: 0.32rem;
	border-radius: ${({ $isTracked }) =>
		$isTracked ? "62.4375rem" : "62.4375rem 0 0 62.4375rem"};
	padding: ${({ $isTracked, $size }) => {
		if ($size === "small") {
			return $isTracked
				? "0.4rem 0.8rem"
				: "0.4rem 0.5rem 0.4rem 0.75rem";
		}

		return $isTracked ? "0.58rem 1.25rem" : "0.58rem 0.9rem 0.58rem 1.2rem";
	}};

	& svg {
		width: ${({ $size }) => ($size === "small" ? "1.05rem" : "1.35rem")};
		height: ${({ $size }) => ($size === "small" ? "1.05rem" : "1.35rem")};
		transition: transform 160ms ease;
	}

	&[aria-expanded="true"] svg {
		transform: rotate(180deg);
	}
`;

const LibraryMenuButton = styled(LibraryButtonBase)`
	width: ${({ $size }) => ($size === "small" ? "2.05rem" : "2.55rem")};
	border-left: 0.0625rem solid rgb(242 239 237 / 0.46);
	border-radius: 0 62.4375rem 62.4375rem 0;
	padding: 0;

	& svg {
		width: ${({ $size }) => ($size === "small" ? "1.15rem" : "1.45rem")};
		height: ${({ $size }) => ($size === "small" ? "1.15rem" : "1.45rem")};
		transition: transform 160ms ease;
	}

	&[aria-expanded="true"] svg {
		transform: rotate(180deg);
	}
`;

const StatusMenu = styled.div<{ $size: "default" | "small" }>`
	position: absolute;
	top: calc(100% + 0.45rem);
	right: 0;
	z-index: 20;
	display: grid;
	width: ${({ $size }) => ($size === "small" ? "11.8rem" : "13.5rem")};
	overflow: hidden;
	border: 0.0625rem solid ${theme.colors.orangeLight};
	border-radius: 0.9rem;
	background: ${theme.colors.surface};
	box-shadow: 0 1rem 2rem rgb(4 18 26 / 0.16);
	padding: 0.35rem;
	text-align: left;
`;

const StatusMenuItem = styled.button<{ $isActive: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	border: 0;
	border-radius: 0.65rem;
	background: ${({ $isActive }) =>
		$isActive ? "rgb(218 142 91 / 0.16)" : "transparent"};
	padding: 0.6rem 0.7rem;
	color: ${({ $isActive }) =>
		$isActive ? theme.colors.orangeDark : theme.colors.foreground};
	cursor: pointer;
	font: inherit;
	font-size: 0.9rem;
	font-weight: ${({ $isActive }) => ($isActive ? 700 : 500)};

	& svg {
		width: 1rem;
		height: 1rem;
		color: ${theme.colors.orangeDark};
	}

	&:hover,
	&:focus-visible {
		background: ${({ $isActive }) =>
			$isActive ? "rgb(218 142 91 / 0.22)" : "rgb(238 179 141 / 0.16)"};
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;
