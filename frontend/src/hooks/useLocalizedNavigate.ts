import { useNavigate, useParams } from 'react-router-dom';
import { useCallback } from 'react';

export function useLocalizedNavigate() {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang: string }>();

  return useCallback(
    (path: string | number, options?: { replace?: boolean }) => {
      if (typeof path === 'number') {
        navigate(path);
        return;
      }
      const localizedPath = path.startsWith('/') ? `/${lang}${path}` : path;
      navigate(localizedPath, options);
    },
    [navigate, lang],
  );
}
