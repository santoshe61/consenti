import type { SamlConfig } from '@consenti/types'

function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function buildSamlMetadataXml(config: SamlConfig): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
  entityID="saml:sp:consenti">
  <SPSSODescriptor
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"
    AuthnRequestsSigned="false"
    WantAssertionsSigned="true">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="${escXml(config.callbackUrl)}"
      index="0"
      isDefault="true"/>
  </SPSSODescriptor>
</EntityDescriptor>`
}

export interface SamlUserInfo {
  email: string
  roles: string[]
}

// Validates a SAML response using the `samlify` peer dependency.
// Install: npm install samlify
export async function validateSamlResponse(
  samlResponse: string,
  config: SamlConfig,
): Promise<SamlUserInfo | null> {
  let samlify: {
    ServiceProvider: (cfg: Record<string, unknown>) => {
      parseLoginResponse: (
        idp: unknown,
        type: string,
        req: { body: Record<string, string> },
      ) => Promise<{ extract: { nameID: string; attributes: Record<string, unknown> } }>
    }
    IdentityProvider: (cfg: Record<string, unknown>) => unknown
  }

  try {
    // @ts-expect-error -- samlify is an optional peer dependency; callers must install it
    samlify = (await import('samlify')) as unknown as typeof samlify
  } catch {
    console.warn('[Consenti] samlify is not installed. Install it to use SAML auth mode.')
    return null
  }

  try {
    const sp = samlify.ServiceProvider({
      entityID: 'saml:sp:consenti',
      assertionConsumerService: [
        {
          Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
          Location: config.callbackUrl,
        },
      ],
    })
    const idp = samlify.IdentityProvider({
      entityID: config.issuer,
      singleSignOnService: [
        {
          Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
          Location: config.entryPoint,
        },
      ],
      signingCert: config.cert,
    })
    const result = await sp.parseLoginResponse(idp, 'post', {
      body: { SAMLResponse: samlResponse },
    })
    const email = result.extract.nameID
    const rolesAttr = result.extract.attributes['roles']
    const roles = Array.isArray(rolesAttr)
      ? rolesAttr.filter((r): r is string => typeof r === 'string')
      : []
    return { email, roles }
  } catch (err) {
    console.warn('[Consenti] SAML response validation failed:', err)
    return null
  }
}
