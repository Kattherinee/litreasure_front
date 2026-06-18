"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";

import { theme } from "@/shared/theme";
import { Button } from "@/shared/ui/Button";

interface IConfirmModalProps {
	cancelLabel?: string;
	children?: ReactNode;
	confirmLabel: string;
	confirmLoadingLabel?: string;
	isLoading?: boolean;
	onCancel: () => void;
	onConfirm: () => void;
	title: string;
	zIndex?: number;
}

export const ConfirmModal = ({
	cancelLabel = "Cancel",
	children,
	confirmLabel,
	confirmLoadingLabel,
	isLoading = false,
	onCancel,
	onConfirm,
	title,
	zIndex = 2600,
}: IConfirmModalProps) => {
	const modal = (
	<Overlay $zIndex={zIndex} role="presentation" onMouseDown={onCancel}>
		<Dialog
			aria-modal="true"
			role="dialog"
			aria-labelledby="confirm-modal-title"
			onMouseDown={(event) => event.stopPropagation()}
		>
			<Title id="confirm-modal-title">{title}</Title>
			{children ? <Text>{children}</Text> : null}
			<Actions>
				<Button type="button" buttonType="outlined" onClick={onCancel}>
					{cancelLabel}
				</Button>
				<Button
					type="button"
					buttonType="containedInverted"
					disabled={isLoading}
					onClick={onConfirm}
				>
					{isLoading && confirmLoadingLabel
						? confirmLoadingLabel
						: confirmLabel}
				</Button>
			</Actions>
		</Dialog>
	</Overlay>
	);

	if (typeof document === "undefined") {
		return null;
	}

	return createPortal(modal, document.body);
};

const Overlay = styled.div<{ $zIndex: number }>`
	position: fixed;
	z-index: ${({ $zIndex }) => $zIndex};
	inset: 0;
	display: grid;
	place-items: center;
	background: rgb(4 18 26 / 0.5);
	padding: 1rem;
`;

const Dialog = styled.section`
	width: min(100%, 26rem);
	max-height: calc(100dvh - 2rem);
	border: 0.0625rem solid rgb(238 179 141 / 0.62);
	border-radius: 1rem;
	background: ${theme.colors.background};
	overflow-y: auto;
	padding: 1.5rem;
	box-shadow: 0 1.25rem 3rem rgb(4 18 26 / 0.18);

	@media (max-width: 30rem) {
		padding: 1rem;
	}
`;

const Title = styled.h2`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.5rem;
	font-weight: 600;
	line-height: 1.2;
`;

const Text = styled.p`
	margin: 0.75rem 0 1.25rem;
	color: ${theme.colors.softForeground};
	font-size: 0.95rem;
	line-height: 1.45;
`;

const Actions = styled.div`
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 0.75rem;
`;
