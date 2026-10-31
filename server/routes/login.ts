import { isPasswordRequired, passwordMatches, authRequiredResponse } from '../auth';
import { json, PagesContext, readJson } from '../gemini';

// POST /api/login — periksa sandi yang diketik di layar masuk.
export const onRequestPost = async ({ request, env }: PagesContext): Promise<Response> => {
  if (!isPasswordRequired(env)) {
    return json({ success: true, passwordRequired: false });
  }
  const body = await readJson(request);
  const password = typeof body.password === 'string' ? body.password : '';
  if (password && (await passwordMatches(env, password))) {
    return json({ success: true, passwordRequired: true });
  }
  await new Promise((resolve) => setTimeout(resolve, 600));
  return authRequiredResponse();
};
