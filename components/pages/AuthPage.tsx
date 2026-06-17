"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import AuthModal, { type IAuthModalMode } from "@/components/pages/AuthModal";
import HomePage from "@/components/pages/HomePage";

interface IAuthPageProps {
	mode: IAuthModalMode;
}

const AuthPage = ({ mode }: IAuthPageProps) => {
	const router = useRouter();
	const [modalMode, setModalMode] = useState<IAuthModalMode>(mode);

	return (
		<>
			<HomePage />
			<AuthModal
				mode={modalMode}
				onClose={() => router.push("/")}
				onModeChange={setModalMode}
			/>
		</>
	);
};

export default AuthPage;
