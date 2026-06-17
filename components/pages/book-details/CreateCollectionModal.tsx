"use client";

import CloseIcon from "@mui/icons-material/Close";
import { useMemo, useState } from "react";
import styled from "styled-components";

import {
	type ICollectionPreview,
	useMyCollectionsQuery,
} from "@/shared/api/collections";
import { theme } from "@/shared/theme";

import { CreateCollectionModalContent } from "./CreateCollectionModalContent";

interface ICreateCollectionModalProps {
	collection?: ICollectionPreview;
	onClose: () => void;
	onSaved?: () => void;
}

export const CreateCollectionModal = ({
	collection,
	onClose,
	onSaved,
}: ICreateCollectionModalProps) => {
	const { data } = useMyCollectionsQuery({ limit: 50 });
	const [message, setMessage] = useState("");
	const collections = useMemo(() => data?.items ?? [], [data?.items]);
	const title = collection ? "Edit collection" : "Create new collection";

	return (
		<ModalOverlay role="presentation" onMouseDown={onClose}>
			<Dialog
				aria-modal="true"
				role="dialog"
				aria-labelledby="create-collection-title"
				onMouseDown={(event) => event.stopPropagation()}
			>
				<Title id="create-collection-title">{title}</Title>
				<CloseButton type="button" aria-label="Close modal" onClick={onClose}>
					<CloseIcon aria-hidden="true" />
				</CloseButton>
				<CreateCollectionModalContent
					collections={collections}
					editingCollection={collection}
					onBack={onClose}
					onMessage={setMessage}
					onSaved={onSaved}
				/>
				{message ? <Message role="status">{message}</Message> : null}
			</Dialog>
		</ModalOverlay>
	);
};

const ModalOverlay = styled.div`
	position: fixed;
	z-index: 1400;
	inset: 0;
	display: grid;
	place-items: center;
	background: rgb(4 18 26 / 0.48);
	padding: 1rem;
`;

const Dialog = styled.section`
	position: relative;
	width: min(100%, 42rem);
	max-height: min(94dvh, 42rem);
	overflow: hidden;
	border-radius: 0.75rem;
	background: #f2efed;
	padding: 1.25rem 1.5rem 1.5rem;
	box-shadow: 0 1.25rem 3.5rem rgb(4 18 26 / 0.18);
`;

const Title = styled.h2`
	margin: 0 3rem 1.75rem;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.55rem;
	font-weight: 600;
	line-height: 1.2;
	text-align: center;
`;

const CloseButton = styled.button`
	position: absolute;
	top: 1.35rem;
	right: 1.55rem;
	display: inline-flex;
	width: 1.6rem;
	height: 1.6rem;
	align-items: center;
	justify-content: center;
	border: 0;
	border-radius: 50%;
	background: #bab7b4;
	color: #f2efed;
	cursor: pointer;

	& svg {
		width: 1rem;
		height: 1rem;
	}

	&:hover,
	&:focus-visible {
		background: ${theme.colors.orangeLight};
		outline: none;
	}
`;

const Message = styled.p`
	margin: 0.9rem 0 0;
	color: ${theme.colors.softForeground};
	font-family: ${theme.fonts.sans};
	font-size: 0.9rem;
	line-height: 1.35;
`;
