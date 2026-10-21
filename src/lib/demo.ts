export function isDemoAdminWriteBlocked(demoMode: boolean, role: string | null | undefined, method: string, path: string) {
  return demoMode && role === 'admin' && !['GET', 'HEAD', 'OPTIONS'].includes(method)
    && !['/api/auth/login', '/api/auth/logout'].includes(path);
}
