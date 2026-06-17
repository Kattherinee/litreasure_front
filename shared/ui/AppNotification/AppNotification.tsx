"use client";

import Snackbar from "@mui/material/Snackbar";
import styled from "styled-components";

import { theme } from "@/shared/theme";

interface IAppNotificationProps {
	message: string;
	open: boolean;
	severity?: "error" | "success";
	onClose: () => void;
	autoHideDuration?: number;
}

export const AppNotification = ({
	autoHideDuration = 2600,
	message,
	open,
	severity = "success",
	onClose,
}: IAppNotificationProps) => (
	<Snackbar
		anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
		autoHideDuration={autoHideDuration}
		open={open}
		onClose={onClose}
	>
		<ToastCard $severity={severity} role="status">
			{message}
		</ToastCard>
	</Snackbar>
);

const ToastCard = styled.div<{ $severity: "error" | "success" }>`
	min-width: 15rem;
	max-width: 24rem;
	border: 0.0625rem solid
		${({ $severity }) =>
			$severity === "error"
				? "rgb(160 52 52 / 0.35)"
				: "rgb(218 142 91 / 0.4)"};
	border-radius: 0.75rem;
	background: ${({ $severity }) =>
		$severity === "error" ? "rgb(255 237 237 / 0.96)" : "rgb(242 239 237 / 0.96)"};
	padding: 0.62rem 0.78rem;
	color: ${({ $severity }) =>
		$severity === "error" ? "#8e2f2f" : theme.colors.foreground};
	font-family: ${theme.fonts.sans};
	font-size: 0.9rem;
	line-height: 1.35;
	box-shadow: 0 0.8rem 1.6rem rgb(4 18 26 / 0.16);
`;
