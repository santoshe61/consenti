cd ../../
npm install

# Build the ui library (docs depends on it)
npm run build --workspace=apps/ui

# Build the API library + dashboard SPA → apps/api/dist/
npm run build --workspace=apps/api

# Build the docs Next.js app → apps/docs/.next/standalone/
npm run build --workspace=apps/docs

cd apps/docs
# Next.js standalone does not copy public/ or .next/static/ automatically. 
# Need to copy them manually
DEPLOY=.next/standalone

# Static assets served by the Next.js server
cp -r public      "$DEPLOY/apps/docs/public"
cp -r .next/static "$DEPLOY/apps/docs/.next/static"

# @consenti/api resolves its dashboard via import.meta.url → dist/dashboard/.
# Next.js standalone copies dist/index.js but not the dashboard/ sibling directory,
# so we copy it manually next to the traced index.js.
cp -r ../../apps/api/dist/dashboard "$DEPLOY/node_modules/@consenti/api/dist/dashboard"

rm -rf consenti-docs-deploy.tar.gz

# COPYFILE_DISABLE prevents macOS from embedding Apple extended attributes
# (._* files, com.apple.* xattrs) that cause warnings on Linux extraction
COPYFILE_DISABLE=1 tar -czf consenti-docs-deploy.tar.gz -C "$DEPLOY" .