import styled from "styled-components";

import { theme } from "@/shared/theme";

interface IAuthorAvatarProps {
	name?: string;
	photoUrl?: string;
	size?: string;
	fontSize?: string;
	className?: string;
}

export const getAuthorInitials = (value?: string) => {
	if (!value) return "A";

	return value
		.split(/[\s._-]+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");
};

const AuthorAvatar = ({
	className,
	fontSize = "1.35rem",
	name,
	photoUrl,
	size = "5rem",
}: IAuthorAvatarProps) => (
	<Avatar
		$fontSize={fontSize}
		$photoUrl={photoUrl}
		$size={size}
		aria-hidden="true"
		className={className}
	>
		{photoUrl ? null : getAuthorInitials(name)}
	</Avatar>
);

export default AuthorAvatar;

const Avatar = styled.span<{
	$fontSize: string;
	$photoUrl?: string;
	$size: string;
}>`
	display: inline-flex;
	width: ${({ $size }) => $size};
	height: ${({ $size }) => $size};
	flex: 0 0 ${({ $size }) => $size};
	align-items: center;
	justify-content: center;
	border: 0.0625rem solid rgb(242 239 237 / 0.36);
	border-radius: 50%;
	background: ${({ $photoUrl }) =>
		$photoUrl
			? `url("${$photoUrl}") center / cover no-repeat`
			: theme.colors.surface};
	color: ${theme.colors.orangeDark};
	font-family: ${theme.fonts.serif};
	font-size: ${({ $fontSize }) => $fontSize};
	font-weight: 600;
	line-height: 1;
`;
