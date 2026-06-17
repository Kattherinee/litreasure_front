import CatalogPage from "@/components/pages/CatalogPage";

interface IPageProps {
	params: Promise<{
		slug: string;
	}>;
}

export default async function CatalogRoute({ params }: IPageProps) {
	const { slug } = await params;

	return <CatalogPage slug={slug} />;
}
