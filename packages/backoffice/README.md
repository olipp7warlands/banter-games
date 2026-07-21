Superado por M5: el backoffice real vive dentro del shell, en `/admin`
(`packages/shell/src/pages/Admin*.tsx` + `packages/shell/src/components/AdminLayout.tsx`),
no como paquete/deploy separado — mismo build, misma sesión Supabase. Protegido por la tabla
`admins` + función `is_admin()` (`docs/DB_SCHEMA_M5.sql`), no por un rol nuevo aparte.
