"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import type { ChangeEvent, RefObject } from "react";
import styled from "styled-components";

import { theme } from "@/shared/theme";

interface IPaperNotePanelProps {
	canExpand: boolean;
	emptyText: string;
	hasNote: boolean;
	isActionPending: boolean;
	isExpanded: boolean;
	isInlineEditing: boolean;
	noteText: string;
	noteTextRef: RefObject<HTMLParagraphElement | null>;
	onCancelInlineEdit: () => void;
	onClear: () => void;
	onDraftChange: (value: string) => void;
	onEdit: () => void;
	onSaveInlineEdit: () => void;
	onToggleExpand: () => void;
	showClearAction: boolean;
	title?: string;
	value: string;
}

const PaperNotePanel = ({
	canExpand,
	emptyText,
	hasNote,
	isActionPending,
	isExpanded,
	isInlineEditing,
	noteText,
	noteTextRef,
	onCancelInlineEdit,
	onClear,
	onDraftChange,
	onEdit,
	onSaveInlineEdit,
	onToggleExpand,
	showClearAction,
	title = "My paper note",
	value,
}: IPaperNotePanelProps) => {
	return (
		<Panel>
			<Block>
				<Actions>
					<IconButton
						aria-label={hasNote ? "Edit paper note" : "Add paper note"}
						title={hasNote ? "Edit note" : "Add note"}
						type="button"
						onClick={onEdit}
					>
						<EditNoteOutlinedIcon aria-hidden="true" />
					</IconButton>
					{showClearAction ? (
						<IconButton
							aria-label="Clear paper note"
							title="Clear note"
							type="button"
							onClick={onClear}
						>
							<DeleteOutlinedIcon aria-hidden="true" />
						</IconButton>
					) : null}
				</Actions>
				<Title>{title}</Title>
				{isInlineEditing ? (
					<>
						<InlineField
							autoFocus
							placeholder="My paper note"
							value={value}
							onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
								onDraftChange(event.target.value)
							}
						/>
						<InlineActions>
							<InlineButton type="button" onClick={onCancelInlineEdit}>
								Cancel
							</InlineButton>
							<InlineButton
								$primary
								// disabled={isActionPending}
								type="button"
								onClick={onSaveInlineEdit}
							>
								Save
							</InlineButton>
						</InlineActions>
					</>
				) : hasNote ? (
					<NoteText ref={noteTextRef} $isExpanded={isExpanded}>
						{noteText}
					</NoteText>
				) : (
					<EmptyText>{emptyText}</EmptyText>
				)}
				{hasNote && canExpand ? (
					<ExpandButton type="button" onClick={onToggleExpand}>
						{isExpanded ? "Collapse" : "Show more"}
					</ExpandButton>
				) : null}
			</Block>
		</Panel>
	);
};

export default PaperNotePanel;

const Panel = styled.div`
	position: relative;
	width: 100%;
	z-index: 12;
`;

const Actions = styled.div`
	position: absolute;
	top: 0.45rem;
	right: 0.45rem;
	z-index: 3;
	display: inline-flex;
	gap: 0.35rem;
	opacity: 0.72;
	pointer-events: auto;
	transition: opacity 150ms ease;

	${Panel}:hover &,
	${Panel}:focus-within & {
		opacity: 1;
	}
`;

const IconButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.55rem;
	height: 1.55rem;
	border: 0;
	border-radius: 0.35rem;
	background: rgb(4 18 26 / 0.28);
	color: rgb(255 255 255 / 0.96);
	cursor: pointer;

	& svg {
		width: 1.08rem;
		height: 1.08rem;
	}

	&:hover,
	&:focus-visible {
		background: rgb(4 18 26 / 0.52);
		color: ${theme.colors.orangeLight};
		outline: none;
	}
`;

const Block = styled.div`
	position: relative;
	max-width: 100%;
	border: 0.0625rem solid rgb(242 239 237 / 0.4);
	border-radius: 0.65rem;
	background: rgb(20 34 46 / 0.34);
	backdrop-filter: blur(0.25rem);
	padding: 0.62rem 2.6rem 0.72rem 0.72rem;
	@media (max-width: ${theme.rubberSize.tablet}) {
		background: rgb(20 34 46 / 0.47);
	}
`;

const Title = styled.h3`
	margin: 0 0 0.55rem;
	color: ${theme.colors.orangeLight};
	font-family: ${theme.fonts.sans};
	font-size: 0.72rem;
	font-weight: 700;
	line-height: 1.25;
	text-transform: uppercase;
	@media (max-width: ${theme.rubberSize.tablet}) {
		font-size: 0.82rem;
	}
`;

const NoteText = styled.p<{ $isExpanded: boolean }>`
	display: -webkit-box;
	margin: 0;
	color: ${theme.colors.invertedText};
	font-family: ${theme.fonts.sans};
	font-size: 0.86rem;
	line-height: 1.42;
	white-space: pre-wrap;
	overflow-wrap: anywhere;
	word-break: break-word;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: ${({ $isExpanded }) => ($isExpanded ? "unset" : "2")};
	overflow: ${({ $isExpanded }) => ($isExpanded ? "visible" : "hidden")};
	@media (max-width: ${theme.rubberSize.tablet}) {
		font-size: 0.92rem;
	}
`;

const EmptyText = styled.p`
	margin: 0;
	color: rgb(242 239 237 / 0.82);
	font-family: ${theme.fonts.sans};
	font-size: 0.82rem;
	line-height: 1.42;
`;

const InlineField = styled.textarea`
	width: 100%;
	min-height: 6.4rem;
	resize: vertical;
	border: 0.0625rem solid rgb(218 142 91 / 0.44);
	border-radius: 0.55rem;
	background: rgb(10 20 30 / 0.38);
	padding: 0.48rem 0.56rem;
	color: ${theme.colors.invertedText};
	font-family: ${theme.fonts.sans};
	font-size: 0.85rem;
	line-height: 1.34;

	&:focus-visible {
		border-color: ${theme.colors.orangeLight};
		outline: none;
	}
`;

const InlineActions = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 0.4rem;
	margin-top: 0.45rem;
`;

const InlineButton = styled.button<{ $primary?: boolean }>`
	border: 0;
	border-radius: 62.4375rem;
	background: ${({ $primary }) =>
		$primary ? theme.colors.orangeLight : "rgb(242 239 237 / 0.36)"};
	padding: 0.38rem 0.7rem;
	color: ${({ $primary }) =>
		$primary ? theme.colors.invertedText : theme.colors.invertedText};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.74rem;
	font-weight: 700;
	line-height: 1;
`;

const ExpandButton = styled.button`
	border: 0;
	background: transparent;
	padding: 0;
	margin-top: 0.3rem;
	color: ${theme.colors.orangeLight};
	cursor: pointer;
	font-family: ${theme.fonts.sans};
	font-size: 0.76rem;
	font-weight: 600;
	line-height: 1.2;

	&:hover,
	&:focus-visible {
		text-decoration: underline;
		outline: none;
	}
`;
