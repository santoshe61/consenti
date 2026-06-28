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

rm -rf consenti-docs-deploy.tar.gz

# COPYFILE_DISABLE prevents macOS from embedding Apple extended attributes
# (._* files, com.apple.* xattrs) that cause warnings on Linux extraction
COPYFILE_DISABLE=1 tar -czf consenti-docs-deploy.tar.gz -C "$DEPLOY" .