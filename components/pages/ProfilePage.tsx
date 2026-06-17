"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import { ProfileAvatarModal } from "@/components/pages/ProfileAvatarModal";
import { checkUsernameAvailability } from "@/shared/api/auth";
import {
	useDeleteUserAccountMutation,
	useUpdateUserPasswordMutation,
	useUpdateUserProfileMutation,
} from "@/shared/api/users";
import { getAvatarAssetUrl } from "@/shared/api/avatarsRepository";
import { useAuthStore } from "@/shared/store/auth-store";
import { theme } from "@/shared/theme";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";

const ProfilePage = () => {
	const router = useRouter();
	const session = useAuthStore((state) => state.session);
	const updateUser = useAuthStore((state) => state.updateUser);
	const logout = useAuthStore((state) => state.logout);
	const updateProfileMutation = useUpdateUserProfileMutation();
	const updatePasswordMutation = useUpdateUserPasswordMutation();
	const deleteAccountMutation = useDeleteUserAccountMutation();
	const user = session?.user;
	const [name, setName] = useState(user?.name ?? "");
	const [username, setUsername] = useState(user?.username ?? "");
	const [email, setEmail] = useState(user?.email ?? "");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [profileMessage, setProfileMessage] = useState("");
	const [passwordMessage, setPasswordMessage] = useState("");
	const [deleteMessage, setDeleteMessage] = useState("");
	const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const displayName =
		user?.name || user?.username || user?.email || "Litreasure";
	const avatarUrl = getAvatarAssetUrl(user?.avatarUrl);
	const initials = useMemo(() => getInitials(displayName), [displayName]);

	useEffect(() => {
		if (!session || !user?.id) {
			router.replace("/?auth=required");
		}
	}, [router, session, user?.id]);

	if (!session || !user?.id) {
		return null;
	}

	if (!session || !user?.id) {
		return (
			<Page>
				<Content>
					<Title>Profile</Title>
					<EmptyState>Sign in to edit your profile.</EmptyState>
				</Content>
			</Page>
		);
	}

	const userId = user.id;

	const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setProfileMessage("");

		const nextName = name.trim();
		const nextUsername = username.trim();
		const nextEmail = email.trim();

		if (nextUsername.length < 3) {
			setProfileMessage("Username must be at least 3 characters long.");
			return;
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
			setProfileMessage("Enter a valid email address.");
			return;
		}

		try {
			if (nextUsername !== user.username) {
				const available = await checkUsernameAvailability(nextUsername);
				if (!available) {
					setProfileMessage("This username is already taken.");
					return;
				}
			}

			await updateProfileMutation.mutateAsync({
				payload: {
					email: nextEmail,
					name: nextName || undefined,
					username: nextUsername,
				},
				userId,
			});
			updateUser({
				email: nextEmail,
				name: nextName || undefined,
				username: nextUsername,
			});
			setProfileMessage("Profile saved.");
		} catch (error) {
			setProfileMessage(
				error instanceof Error ? error.message : "Failed to save profile.",
			);
		}
	};

	const savePassword = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setPasswordMessage("");

		if (newPassword.length < 6) {
			setPasswordMessage("New password must be at least 6 characters long.");
			return;
		}

		if (newPassword !== confirmPassword) {
			setPasswordMessage("Passwords do not match.");
			return;
		}

		try {
			await updatePasswordMutation.mutateAsync({
				payload: { newPassword },
				userId,
			});
			setNewPassword("");
			setConfirmPassword("");
			setPasswordMessage("Password updated.");
		} catch (error) {
			setPasswordMessage(
				error instanceof Error ? error.message : "Failed to update password.",
			);
		}
	};

	const deleteAccount = async () => {
		setDeleteMessage("");

		try {
			await deleteAccountMutation.mutateAsync(userId);
			logout();
			router.push("/");
		} catch (error) {
			setDeleteMessage(
				error instanceof Error ? error.message : "Failed to delete account.",
			);
		}
	};

	return (
		<Page>
			<Content>
				<Hero>
					<AvatarButton
						type="button"
						onClick={() => setIsAvatarModalOpen(true)}
					>
						<Avatar $avatarUrl={avatarUrl}>
							{avatarUrl ? null : initials}
						</Avatar>
						<AvatarHint>Change avatar</AvatarHint>
					</AvatarButton>
					<HeroText>
						<Title>Profile</Title>
						<Lead>
							Manage your name, username, email, and account security.
						</Lead>
					</HeroText>
				</Hero>

				<Grid>
					<Card as="form" onSubmit={saveProfile}>
						<CardTitle>Basic info</CardTitle>
						<Field>
							<Label>Name</Label>
							<Input
								id="profile-name"
								autoComplete="name"
								value={name}
								onChange={(event) => setName(event.target.value)}
							/>
						</Field>
						<Field>
							<Label>Username</Label>
							<Input
								id="profile-username"
								autoComplete="username"
								value={username}
								onChange={(event) => setUsername(event.target.value)}
							/>
						</Field>
						<Field>
							<Label>Email</Label>
							<Input
								id="profile-email"
								autoComplete="email"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
							/>
						</Field>
						<FormFooter>
							{profileMessage ? <Message>{profileMessage}</Message> : <span />}
							<Button
								buttonType="contained"
								disabled={updateProfileMutation.isPending}
								type="submit"
							>
								{updateProfileMutation.isPending ? "Saving..." : "Save"}
							</Button>
						</FormFooter>
					</Card>

					<Card as="form" onSubmit={savePassword}>
						<CardTitle>Password</CardTitle>
						<Field>
							<Label>New password</Label>
							<Input
								id="profile-new-password"
								autoComplete="new-password"
								type="password"
								value={newPassword}
								onChange={(event) => setNewPassword(event.target.value)}
							/>
						</Field>
						<Field>
							<Label>Confirm password</Label>
							<Input
								id="profile-confirm-password"
								autoComplete="new-password"
								type="password"
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
							/>
						</Field>
						<FormFooter>
							{passwordMessage ? (
								<Message>{passwordMessage}</Message>
							) : (
								<span />
							)}
							<Button
								buttonType="contained"
								disabled={updatePasswordMutation.isPending}
								type="submit"
							>
								{updatePasswordMutation.isPending
									? "Updating..."
									: "Change password"}
							</Button>
						</FormFooter>
					</Card>
				</Grid>

				<DangerCard>
					<div>
						<CardTitle>Delete account</CardTitle>
						<DangerText>
							This action cannot be undone. Your profile data will be deleted.
						</DangerText>
						{deleteMessage ? <Message>{deleteMessage}</Message> : null}
					</div>
					<DangerButton
						type="button"
						buttonType="outlined"
						onClick={() => setIsDeleteConfirmOpen(true)}
					>
						Delete account
					</DangerButton>
				</DangerCard>
			</Content>

			{isAvatarModalOpen ? (
				<ProfileAvatarModal
					session={session}
					onClose={() => setIsAvatarModalOpen(false)}
				/>
			) : null}

			{isDeleteConfirmOpen ? (
				<ConfirmModal
					confirmLabel="Delete"
					confirmLoadingLabel="Deleting..."
					isLoading={deleteAccountMutation.isPending}
					title="Delete account?"
					onCancel={() => setIsDeleteConfirmOpen(false)}
					onConfirm={deleteAccount}
				>
					Your profile will be deleted permanently. Continue?
				</ConfirmModal>
			) : null}
		</Page>
	);
};

export default ProfilePage;

const getInitials = (value?: string) => {
	if (!value) return "L";
	return value
		.split(/[\s._-]+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");
};

const Page = styled.div`
	min-height: calc(100dvh - 4rem);
	background: ${theme.colors.background};
	padding: 4rem 0;
`;

const Content = styled.div`
	width: min(calc(100% - (${theme.layout.contentGutter} * 2)), ${theme.layout.contentMaxWidth});
	margin: 0 auto;
`;

const Hero = styled.section`
	display: flex;
	align-items: center;
	gap: 3rem;
	margin-bottom: 2rem;

	@media (max-width: 38rem) {
		align-items: flex-start;
		flex-direction: column;
	}
`;

const AvatarButton = styled.button`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.6rem;
	border: 0;
	background: transparent;
	padding: 0;
	cursor: pointer;
`;

const Avatar = styled.span<{ $avatarUrl?: string }>`
	display: inline-flex;
	width: 7.5rem;
	height: 7.5rem;
	align-items: center;
	justify-content: center;
	border: 0.35rem solid rgb(218 142 91 / 0.18);
	border-radius: 50%;
	background: ${({ $avatarUrl }) =>
		$avatarUrl
			? `url("${$avatarUrl}") center / cover no-repeat`
			: theme.alpha.blueWash};
	color: ${theme.colors.bluePrimary};
	font-family: ${theme.fonts.sans};
	font-size: 2rem;
	font-weight: 700;
`;

const AvatarHint = styled.span`
	color: ${theme.colors.orangeDark};
	font-size: 0.85rem;
	font-weight: 700;
`;

const HeroText = styled.div`
	min-width: 0;
`;

const Title = styled.h1`
	margin: 0;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 2.5rem;
	line-height: 0.95;
`;

const Lead = styled.p`
	max-width: 42rem;
	margin: 1rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 1.05rem;
	line-height: 1.5;
`;

const EmptyState = styled.p`
	margin: 1rem 0 0;
	color: ${theme.colors.softForeground};
	font-size: 1rem;
`;

const Grid = styled.div`
	display: grid;
	gap: 1.25rem;
	grid-template-columns: repeat(2, minmax(0, 1fr));

	@media (max-width: 52rem) {
		grid-template-columns: 1fr;
	}
`;

const Card = styled.section`
	border: 0.0625rem solid rgb(211 202 196 / 0.72);
	border-radius: 1rem;
	background: rgb(255 255 255 / 0.58);
	padding: 1.25rem;
	display: flex;
	flex-direction: column;
	justify-content: center;
`;

const CardTitle = styled.h2`
	margin: 0 0 1rem;
	color: ${theme.colors.foreground};
	font-family: ${theme.fonts.serif};
	font-size: 1.45rem;
	line-height: 1.2;
`;

const Field = styled.label`
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	margin-bottom: 0.85rem;
`;

const Label = styled.span`
	color: ${theme.colors.softForeground};
	font-size: 0.85rem;
`;

const Input = styled.input`
	width: 100%;
	border: 0.0625rem solid rgb(211 202 196 / 0.9);
	border-radius: 0.75rem;
	background: ${theme.colors.surface};
	padding: 0.8rem 0.9rem;
	color: ${theme.colors.foreground};
	font: inherit;

	&:focus {
		border-color: ${theme.colors.orangeLight};
		outline: none;
	}
`;

const FormFooter = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	margin-top: 1rem;
`;

const Message = styled.p`
	margin: 0;
	color: ${theme.colors.orangeDark};
	font-size: 0.88rem;
	line-height: 1.35;
`;

const DangerCard = styled(Card)`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	margin-top: 1.25rem;

	@media (max-width: 40rem) {
		align-items: flex-start;
		flex-direction: column;
	}
`;

const DangerText = styled.p`
	margin: 0;
	color: ${theme.colors.softForeground};
	font-size: 0.95rem;
	line-height: 1.45;
`;

const DangerButton = styled(Button)`
	&& {
		border-color: ${theme.colors.orangeDark};
		color: ${theme.colors.orangeDark};
		white-space: nowrap;
	}
`;
