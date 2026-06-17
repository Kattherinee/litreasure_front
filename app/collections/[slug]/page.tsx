import CollectionPage from "@/components/pages/CollectionPage";

interface IPageProps {
	params: Promise<{
		slug: string;
	}>;
}

export default async function CollectionRoute({ params }: IPageProps) {
	const { slug } = await params;

	return <CollectionPage id={slug} />;
}
