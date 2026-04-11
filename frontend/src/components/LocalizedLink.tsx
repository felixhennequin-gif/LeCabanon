import { Link, useParams, type LinkProps } from 'react-router-dom';

type Props = Omit<LinkProps, 'to'> & { to: string };

export function LocalizedLink({ to, ...props }: Props) {
  const { lang = 'fr' } = useParams<{ lang: string }>();
  const localizedTo = to.startsWith(`/${lang}/`) || to === `/${lang}`
    ? to
    : to.startsWith('/')
      ? `/${lang}${to}`
      : to;
  return <Link to={localizedTo} {...props} />;
}
