import AuthorPage from "@/components/pages/AuthorPage";

interface IPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function AuthorRoute({ params }: IPageProps) {
	const { id } = await params;

	return <AuthorPage id={id} />;
}
