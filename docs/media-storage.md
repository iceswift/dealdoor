# Media Storage

All image uploads go through `media-storage.service.ts`. The database continues to store a public image URL, so existing shop, deal, and menu views do not need to know where an image lives.

## Local development

The default is `STORAGE_DRIVER=local`. One WebP file is stored per upload, with no responsive variants. Cover and deal images are limited to HD (`1280x720`); logo and menu images are limited to `512x512`. Processing preserves the original aspect ratio, does not enlarge small images, and does not crop the stored file.

## Production with R2

Set `STORAGE_DRIVER=r2` and provide these values in `.env.production`:

```dotenv
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=dealdoor-prod
R2_PUBLIC_BASE_URL=https://media.example.com
```

The service writes `uploads/<type>s/<uuid>.webp` to the bucket and stores the public URL in the database. Existing local URLs remain valid until they are explicitly migrated, so switching drivers does not break old records.

## Docker local storage

The local Docker compose file mounts `./public/uploads` into `/app/dist/client/uploads`, the static directory served by the production Astro adapter. This keeps uploaded files persistent and publicly reachable while R2 is not enabled.

## Security

`POST /api/upload` now requires a logged-in merchant with a dashboard shop. File type and size are checked before Sharp processes the image. Storage keys are generated server-side and constrained to the `uploads/` namespace.
