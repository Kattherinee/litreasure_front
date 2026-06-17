"use client";

import CloseIcon from "@mui/icons-material/Close";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";

import { theme } from "@/shared/theme";
import { Button } from "@/shared/ui/Button";

interface IFormModalProps {
	cancelLabel?: string;
	children: ReactNode;
	isSaveDisabled?: boolean;
	isSaving?: boolean;
	leftAction?: ReactNode;
	onClose: () => void;
	onSave: () => void;
	saveLabel?: string;
	savingLabel?: string;
	title: string;
}

export const FormModal = ({
	cancelLabel = "Cancel",
	children,
	isSaveDisabled = false,
	isSaving = false,
	leftAction,
	onClose,
	onSave,
	saveLabel = "Save",
	savingLabel = "Saving...",
	title,
}: IFormModalProps) => {
	const modal = (
	<Overlay role="presentation" onMouseDown={onClose}>
		<Dialog
			aria-labelledby="form-modal-title"
			aria-modal="true"
			role="dialog"
			onMouseDown={(event) => event.stopPropagation()}
		>
			<Header>
				<Title id="form-modal-title">{title}</Title>
				<CloseButton aria-label="Close" type="button" onClick={onClose}>
					<CloseIcon aria-hidden="true" />
				</CloseButton>
			</Header>

			<Content>{children}</Content>

			<Actions>
				<LeftActions>{leftAction}</LeftActions>
				<RightActions>
					<CancelButton
						buttonType="outlined"
						disabled={isSaving}
						type="button"
						onClick={onClose}
					>
						{cancelLabel}
					</CancelButton>
					<SaveButton
						buttonType="containedInverted"
						disabled={isSaving || isSaveDisabled}
						type="button"
						onClick={onSave}
					>
						{isSaving ? savingLabel : saveLabel}
					</SaveButton>
				</RightActions>
			</Actions>
		</Dialog>
	</Overlay>
	);

	if (typeof document === "undefined") {
		return null;
	}

	return createPortal(modal, document.body);
};

const Overlay = styled.div`
	position: fixed;
	z-index: 2400;
	inset: 0;
	display: grid;
	place-items: center;
	background: rgb(4 18 26 / 0.52);
	padding: 1rem;
`;

const Dialog = styled.section`
	display: flex;
	width: min(100%, 44rem);
	max-height: min(100%, calc(100dvh - 4rem));
	flex-direction: column;
	overflow: hidden;
	border: 0.0625rem solid rgb(238 179 141 / 0.62);
	border-radius: 1.1rem;
	background: ${theme.colors.background};
	padding: 1.25rem;
	box-shadow: 0 1.25rem 3rem rgb(4 18 26 / 0.18);
`;

const Header = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 1rem;
`;

const Title = styled.h2`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.65rem;
	font-weight: 600;
	line-height: 1.15;
`;

const CloseButton = styled.button`
	border: 0;
	background: transparent;
	color: ${theme.colors.softForeground};
	cursor: pointer;
	font: inherit;
	font-size: 1.6rem;
	line-height: 1;

	&:hover,
	&:focus-visible {
		color: ${theme.colors.orangeDark};
		outline: none;
	}
`;

const Content = styled.div`
	min-height: 0;
	overflow-x: hidden;
	overflow-y: auto;
	padding-right: 0.45rem;
	scrollbar-color: rgb(185 174 167 / 0.68) transparent;
	scrollbar-width: thin;

	&::-webkit-scrollbar {
		width: 0.38rem;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
		margin: 0.4rem 0;
	}

	&::-webkit-scrollbar-thumb {
		border-radius: 999px;
		background: rgb(185 174 167 / 0.68);
	}
`;

const Actions = styled.div`
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	align-items: center;
	gap: 0.65rem;
	margin-top: 1rem;
`;

const LeftActions = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 0.65rem;
`;

const RightActions = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 0.65rem;
	margin-left: auto;
`;

const modalActionButtonStyles = `
	min-height: 2.375rem;
	padding: 0.5rem 1rem;
`;

const CancelButton = styled(Button)`
	${modalActionButtonStyles}
`;

const SaveButton = styled(Button)`
	${modalActionButtonStyles}
`;
