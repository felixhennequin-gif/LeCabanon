import { Helmet } from "react-helmet-async";

interface Props {
  title: string;
  description: string;
  ogType?: string;
}

export function SEO({ title, description, ogType = "website" }: Props) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
    </Helmet>
  );
}
