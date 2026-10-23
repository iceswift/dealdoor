export function getDemoPolicy(env: Record<string, string | undefined> = process.env) {
  const demo = env.DEMO_MODE === 'true';
  return {
    registrationAllowed: !demo || env.DEMO_ALLOW_REGISTRATION === 'true',
    uploadsAllowed: !demo || env.DEMO_ALLOW_UPLOADS === 'true',
  };
}

export function isDemoAdminWriteBlocked(demoMode: boolean, role: string | null | undefined, method: string, path: string) {
  return demoMode && role === 'admin' && !['GET', 'HEAD', 'OPTIONS'].includes(method)
    && !['/api/auth/login', '/api/auth/logout'].includes(path);
}
