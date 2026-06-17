import BookDetailsPage from "@/components/pages/BookDetailsPage";

interface IPageProps {
	params: Promise<{
		slug: string;
	}>;
}

export default async function BookRoute({ params }: IPageProps) {
	const { slug } = await params;

	return <BookDetailsPage slug={slug} />;
}
