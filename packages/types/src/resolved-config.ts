// AI AGENTS PLEASE IGNORE THIS FILE, THIS IS FOR UNDERSTANDING OF RESOLVED CONFIG

export interface ConsentiConfig { // ConsentiConfig
    verbose?: boolean;
    rootEl?: string | HTMLElement;
    darkMode?: boolean;
    autoInit?: boolean;
    hidePoweredBy?: boolean;

    /** Core configuration options for the widget wrapper, storage, and styling */
    core?: { // CoreConfig
        tenantId?: string;
        locale?: string;
        dir?: 'ltr' | 'rtl' | 'auto'; // 'auto' derives from locale via Intl.Locale(...).getTextInfo().direction (RTL-prefix-list fallback)
        disableCssTemplate?: boolean;
        cookieSigningKey?: string;
        allowReceipt?: boolean;
        cookieDomains?: string;
        storage?: 'cookie' | 'localStorage';
        userId?: string; // prefer getUserId()/setUserId() or the consenti:listener:identify event after init
        usePrebuiltProfiles?: 'all' | ('opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' |
            'opt-in-china' | 'opt-in-brazil' | 'general-privacy-consent' | 'notice-only'
        )[]; // (NonEmptyArray<ComplianceGroupId>)
        cacheResolvedProfiles?: boolean;
        console?: Array<'info' | 'log' | 'warning' | 'error'>;
        theme?: { // ThemeConfig — field names mirror their --consenti-* CSS variable literally
            colorBg?: string;
            colorText?: string;
            colorTextMuted?: string;
            colorPrimary?: string;
            colorPrimaryText?: string;
            colorSecondary?: string;
            colorSecondaryText?: string;
            colorBorder?: string;
            colorSecondaryBorder?: string;
            colorOverlay?: string;
            colorAccent?: string;
            colorAccentText?: string;
            fontFamily?: string;
            fontFamilyMono?: string;
            fontSizeBase?: string;
            fontSizeHeading?: string;
            fontSizeMultiplier?: string;
            fontWeightHeading?: string;
            lineHeight?: string;
            spacingXs?: string;
            spacingSm?: string;
            spacingMd?: string;
            spacingLg?: string;
            borderRadius?: string;
            borderRadiusBtn?: string;
            shadow?: string;
            toggleBgOn?: string;
            toggleBgPartial?: string;
            toggleBgOff?: string;
            toggleKnob?: string;
            toggleWidth?: string;
            toggleHeight?: string;
            zBanner?: string;
            zOverlay?: string;
            zModal?: string;
        };
    };

    /** Widget-side compliance checks (jurisdiction mapping, age gate, and TCF) */
    compliance?: { // ComplianceWidgetConfig
        type?: 'auto' | 'opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' |
        'opt-in-china' | 'opt-in-brazil' | 'general-privacy-consent' | 'notice-only' |
        (string & {}) | Symbol; // ComplianceType
        geoDataProvider?: 'default' | (() => Promise<{
            country: string | null;
            region: string | null;
            confidence: number;
        }>); // WidgetCountryResolverFn
        // Only meaningful in standalone mode (no api.enabled) — ignored (with a warning) when api.enabled: true.
        complianceMap?: 'default' | string /* URL */ | {
            version: string;
            countries: Record<string, {
                complianceGroup: 'opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' |
                'opt-in-china' | 'opt-in-brazil' | 'general-privacy-consent' | 'notice-only';
                default?: 'opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' | 'opt-in-china' |
                'opt-in-brazil' | 'general-privacy-consent' | 'notice-only'; // defaults to complianceGroup
                description?: string;
                overriddenRegions?: Record<string, {
                    complianceGroup: 'opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' | 'opt-in-china' |
                    'opt-in-brazil' | 'general-privacy-consent' | 'notice-only';
                    description?: string;
                }>;
            }>;
        }; // ComplianceMapData
        ageGate?: { // AgeGateWidgetConfig
            enabled: boolean;
            minimumAge: number;
            requireParentalConsent?: boolean;
        };
        tcf?: { // TcfWidgetConfig
            enabled: boolean;
            cmpId: number;
            cmpVersion: number;
        };
    };

    /** Remote Consenti API settings */
    api?: { // ApiConfig
        enabled?: boolean;
        baseUrl?: string;
        authToken?: string;
        tenantId?: string;
        complianceGroup?: 'opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' | 'opt-in-china' |
        'opt-in-brazil' | 'general-privacy-consent' | 'notice-only'; // ComplianceGroupId
        trustDomain?: boolean;
    };

    /** Client-side utilities configuration, such as GTM integration */
    utils?: { // from UtilsConfig //!! TODO: move this to plugin part and keep 'GtmPlugin' as default shipped plugin, no utils needed so remove this key as well
        gtm?: { // GtmConfig
            containerId?: string;
            events?: string[];
            dataLayer?: string;
            urlPassthrough?: boolean;
            adsDataRedaction?: boolean;
            verbose?: boolean;
        };
    };

    /** List of frontend widget plugins */
    plugins?: Array<{
        name: string;
        initialize(widget: {
            hasConsent(): boolean;
            getConsent(): Record<string, 'granted' | 'denied' | 'objected'> | null;
            getConsent(type: 'default' | 'google-gtm' | 'category' | 'adobe' | 'meta' | 'microsoft-clarity' | 'twilio-segment'): Record<string, string> | null;
            getConsent(type?: 'default' | 'google-gtm' | 'category' | 'adobe' | 'meta' | 'microsoft-clarity' | 'twilio-segment'): Record<string, 'granted' | 'denied' | 'objected'> | Record<string, string> | null;
            getConsentDate(): Date | false;
            getGTMConsent(): Record<string, string> | null;
            isCookieGranted(cookieId: string, requestValue?: boolean): boolean | 'granted' | 'denied' | 'objected';
            isCategoryGranted(categoryId: string, requestValue?: boolean): boolean | Record<string, 'granted' | 'denied' | 'objected'>[];
            grantAll(onlyMandatory?: boolean): Promise<void>;
            denyAll(includingMandatory?: boolean): Promise<void>;
            on(
                event: 'bannerInitialized' | 'consenti:bannerInitialized' | 'bannerVisibility' | 'consenti:bannerVisibility' | 'modalVisibility' | 'consenti:modalVisibility' | 'consentBeingSubmitted' | 'consenti:consentBeingSubmitted' | 'consentSubmitted' | 'consenti:consentSubmitted' | 'parentalConsentRequired' | 'consenti:parentalConsentRequired',
                handler: (data:
                    | { profileId: string; complianceGroup?: 'auto' | 'opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' | 'opt-in-china' | 'opt-in-brazil' | 'general-privacy-consent' | 'notice-only' | (string & {}) | Symbol; hasExistingConsent: boolean; gpcDetected: boolean; willShow: boolean } // BannerInitializedDetail
                    | { visible: boolean; variant: 'main' | 'gpc'; action: boolean } // BannerVisibilityDetail
                    | { visible: boolean; action: boolean } // ModalVisibilityDetail
                    | { consentId: string; visitorId: string; profileId: string; consentJson: Record<string, 'granted' | 'denied' | 'objected'>; consentAction: 'accept_all' | 'reject_all' | 'custom' | 'update'; gpcDetected: boolean; pageUrl: string; timestamp: number; fromBroadcast?: boolean } // ConsentBeingSubmitted
                    | { consentId: string; visitorId: string; profileId: string; consentJson: Record<string, 'granted' | 'denied' | 'objected'>; consentAction: 'accept_all' | 'reject_all' | 'custom' | 'update'; gpcDetected: boolean; pageUrl: string; timestamp: number; fromBroadcast?: boolean; apiResponse: { id: string; tenantId: string; visitorId: string; profileId: string; locale: string; consentJson: Record<string, 'granted' | 'denied' | 'objected'>; gpcDetected: boolean; source: 'banner' | 'api' | 'import'; ageVerified?: boolean; parentalConsentToken?: string; tcfString?: string; signature?: string; createdAt: string; updatedAt: string } } // ConsentSubmittedDetail
                    | { parentalConsentToken: string; profileId: string; visitorId: string; timestamp: number } // ParentalConsentRequiredDetail
                ) => void
            ): void;
            off(
                event: 'bannerInitialized' | 'consenti:bannerInitialized' | 'bannerVisibility' | 'consenti:bannerVisibility' | 'modalVisibility' | 'consenti:modalVisibility' | 'consentBeingSubmitted' | 'consenti:consentBeingSubmitted' | 'consentSubmitted' | 'consenti:consentSubmitted' | 'parentalConsentRequired' | 'consenti:parentalConsentRequired',
                handler: (data:
                    | { profileId: string; complianceGroup?: 'auto' | 'opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' | 'opt-in-china' | 'opt-in-brazil' | 'general-privacy-consent' | 'notice-only' | (string & {}) | Symbol; hasExistingConsent: boolean; gpcDetected: boolean; willShow: boolean } // BannerInitializedDetail
                    | { visible: boolean; variant: 'main' | 'gpc'; action: boolean } // BannerVisibilityDetail
                    | { visible: boolean; action: boolean } // ModalVisibilityDetail
                    | { consentId: string; visitorId: string; profileId: string; consentJson: Record<string, 'granted' | 'denied' | 'objected'>; consentAction: 'accept_all' | 'reject_all' | 'custom' | 'update'; gpcDetected: boolean; pageUrl: string; timestamp: number; fromBroadcast?: boolean } // ConsentBeingSubmitted
                    | { consentId: string; visitorId: string; profileId: string; consentJson: Record<string, 'granted' | 'denied' | 'objected'>; consentAction: 'accept_all' | 'reject_all' | 'custom' | 'update'; gpcDetected: boolean; pageUrl: string; timestamp: number; fromBroadcast?: boolean; apiResponse: { id: string; tenantId: string; visitorId: string; profileId: string; locale: string; consentJson: Record<string, 'granted' | 'denied' | 'objected'>; gpcDetected: boolean; source: 'banner' | 'api' | 'import'; ageVerified?: boolean; parentalConsentToken?: string; tcfString?: string; signature?: string; createdAt: string; updatedAt: string } } // ConsentSubmittedDetail
                    | { parentalConsentToken: string; profileId: string; visitorId: string; timestamp: number } // ParentalConsentRequiredDetail
                ) => void
            ): void;
            version(): { package: string; profileVersion: string | null; consentVersion: string | null };
            bannerVisibility(): 'main' | 'gpc' | false;
            modalVisibility(): 'preference' | false;
            getProfile(): any; // ResolvedProfile (fully detailed inline elsewhere)
            showBanner(gpc?: boolean): void;
            hideBanner(): void;
            showModal(triggerEl?: HTMLElement): void;
            hideModal(): void;
            submitConsent(consent: Partial<Record<string, 'granted' | 'denied' | 'objected'>>): Promise<{ id: string; tenantId: string; visitorId: string; profileId: string; locale: string; consentJson: Record<string, 'granted' | 'denied' | 'objected'>; gpcDetected: boolean; source: 'banner' | 'api' | 'import'; ageVerified?: boolean; parentalConsentToken?: string; tcfString?: string; signature?: string; createdAt: string; updatedAt: string } | void>;
        }): void | Promise<void>;
        destroy(): void;
        onConsentSubmit?(consent: Record<string, 'granted' | 'denied' | 'objected'>): void | Promise<void>;
        onBannerShow?(): void | Promise<void>;
        onBannerHide?(): void | Promise<void>;
        onModalShow?(): void | Promise<void>;
        onModalHide?(): void | Promise<void>;
    }>; // ConsentiPlugin[]

    /** Local configuration values to apply over the fetched server profile */
    profileOverride?: DeepPartial<{ // DeepPartial<ResolvedProfile>
        id: string;
        version?: number;
        defaultLocale: string;
        locales?: string[];
        cookies: Record<string, { // CookieMap
            purpose?: 'necessary' | 'functional' | 'preferences' | 'analytics' | 'marketing';
            listenGpc?: boolean;
            preGrant?: boolean;
            tcfVendorId?: number;
            tcfPurposes?: number[];
            tcfSpecialFeatures?: number[];
            cpraCategory?: 'sale' | 'sharing' | 'sensitive';
        }>;
        expiryDays?: number;
        allowReceipt?: boolean;
        mainBanner: { // MainBanner
            position: 'top' | 'bottom' | 'middle' | 'left-bottom' | 'right-bottom';
            overlayOpacity?: number;
            showClose?: boolean;
            showLocaleSwitcher?: boolean;
            heading?: string;
            headingTag?: string;
            htmlText: string;
            buttons: Record<string, {
                text: string;
                style: 'primary' | 'secondary' | 'text' | 'accent';
                action: 'submit' | 'manage' | 'close' | 'custom' | 'link';
                cookies?: string[] | '*' | '!';
                url?: string;
            }>;
            stackButtonsOnBreakpoint?: number;
            trapFocus?: boolean;
        };
        gpcBanner?: { // GpcBanner
            position: 'top' | 'bottom' | 'middle' | 'left-bottom' | 'right-bottom';
            overlayOpacity?: number;
            showClose?: boolean;
            showLocaleSwitcher?: boolean;
            heading?: string;
            headingTag?: string;
            htmlText: string;
            buttons: Record<string, {
                text: string;
                style: 'primary' | 'secondary' | 'text' | 'accent';
                action: 'submit' | 'manage' | 'close' | 'custom' | 'link';
                cookies?: string[] | '*' | '!';
                url?: string;
            }>;
            stackButtonsOnBreakpoint?: number;
            trapFocus?: boolean;
        };
        preferenceModal: { // PreferenceModal
            heading: string;
            headingTag?: string;
            htmlText: string;
            buttons: Record<string, {
                text: string;
                style: 'primary' | 'secondary' | 'text' | 'accent';
                action: 'submit' | 'manage' | 'close' | 'custom' | 'link';
                cookies?: string[] | '*' | '!';
                url?: string;
            }>;
            stackButtonsOnBreakpoint?: number;
            trapFocus?: boolean;
            position?: 'left' | 'right' | 'center';
            subheading?: string;
            categories: Record<string, {
                heading: string;
                headingTag?: string;
                htmlText: string;
                legalBasis: 'mandatory' | 'consent' | 'legitimate_interest';
                legitimateInterestDescription?: string;
                cookies: string[];
            }>;
            persistent?: boolean;
            mobileFullScreenBreakpoint?: number;
            receiptLabel?: string;
            receiptDescription?: string;
        };
        cookieSigningKey?: string;
        dpdpa?: { // DpdpaConfig
            dataFiduciary: string;
            grievanceEmail: string;
            purposeDescription?: string;
        };
        darkMode?: boolean;
        gpcMode?: 'ignore' | 'honor' | 'strict'; // GpcMode
        complianceGroup?: 'opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' |
        'opt-in-china' | 'opt-in-brazil' | 'general-privacy-consent' | 'notice-only'; // ComplianceGroupId
        complianceConfig?: Record<string, string>;
        hidePoweredBy?: boolean;
        showFooterMetadata?: boolean;
        enhanceAccessibility?: boolean;
    }>;
}

export interface ConsentiServerConfig {
    basePath?: string;

    /** Settings for mounting the admin dashboard interface */
    dashboard?: boolean | { // DashboardConfig
        enabled?: boolean;
        path?: string;
    };

    /** Storage adapter and connection settings */
    storage?: { // StorageConfig
        driver: 'sqlite' | 'better-sqlite3' | 'node-sqlite3-wasm' | 'node:sqlite' |
        'mongodb' | 'mysql' | 'postgresql' | 'json';
        path?: string;
        uri?: string;
        database?: string;
        host?: string;
        port?: number;
        user?: string;
        password?: string;
        poolMax?: number;
        statementTimeoutMs?: number;
        idleInTransactionTimeoutMs?: number;
    };

    /** Authentication mode (JWT, OIDC, SAML) and credentials */
    auth?: { // AuthConfig
        mode: 'local' | 'jwt' | 'custom' | 'oidc' | 'saml';
        masterSecret?: string;
        validateUser?: (req: unknown) => Promise<{
            id: string;
            tenantId: string;
            name: string;
            email: string;
            passwordHash: string;
            isActive: boolean;
            totpEnabled?: boolean;
            totpSecret?: string;
            allowedTenants?: string[];
            createdAt: string;
            updatedAt: string;
        } | null>;
        adminEmail?: string;
        adminPassword?: string;
        oidc?: {
            issuer: string;
            clientId: string;
            clientSecret: string;
            redirectUri: string;
            claimsMapping?: {
                roles?: string;
                email?: string;
            };
        };
        saml?: {
            issuer: string;
            entryPoint: string;
            cert: string;
            callbackUrl: string;
        };
    };

    /** Rate limiter options for endpoints */
    rateLimit?: { // RateLimitConfig
        enabled?: boolean;
        windowMs?: number;
        maxRequests?: number;
    };

    /** Backend-side geographic resolution and fallback groups */
    compliance?: { // ComplianceGroupId
        type?: 'opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' | 'opt-in-china' |
        'opt-in-brazil' | 'general-privacy-consent' | 'notice-only' | 'auto'; // ComplianceGroupId
        geoDataProvider?: 'default' | 'maxmind' | 'geoip' | 'hosted-geoip-lite' | ((ctx: {
            ip: string;
            language: string;
            timezone: string;
        }) => Promise<{
            country: string | null;
            region: string | null;
            locale: string | null;
        }>); // CountryResolverFn
        complianceMap?: 'default' | string /* URL, refreshed per Cache-Control/Expires, 24h fallback */ | {
            version: string;
            countries: Record<string, {
                complianceGroup: 'opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' | 'opt-in-china' |
                'opt-in-brazil' | 'general-privacy-consent' | 'notice-only';
                default?: 'opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' | 'opt-in-china' |
                'opt-in-brazil' | 'general-privacy-consent' | 'notice-only'; // defaults to complianceGroup
                description?: string;
                overriddenRegions?: Record<string, {
                    complianceGroup: 'opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' | 'opt-in-china' |
                    'opt-in-brazil' | 'general-privacy-consent' | 'notice-only';
                    description?: string;
                }>;
            }>;
        };
        ageGate?: { // AgeGateConfig
            enabled: boolean;
            minimumAge: number;
            requireParentalConsent?: boolean;
        };
    };

    /** Monorepo multi-tenant enablement flag */
    multiTenant?: { // MultiTenantConfig
        enabled: boolean;
    };

    /** Registered backend plugins hook listeners */
    plugins?: Array<{
        name: string;
        initialize?(context: {
            storage: {
                connect(): Promise<void>;
                disconnect(): Promise<void>;
                migrate(): Promise<void>;
                createProfile(data: {
                    tenantId: string;
                    name: string;
                    defaultLocale: string;
                    profileJson: {
                        id: string;
                        cookies?: Record<string, {
                            purpose?: 'necessary' | 'functional' | 'preferences' | 'analytics' | 'marketing';
                            listenGpc?: boolean;
                            preGrant?: boolean;
                            tcfVendorId?: number;
                            tcfPurposes?: number[];
                            tcfSpecialFeatures?: number[];
                            cpraCategory?: 'sale' | 'sharing' | 'sensitive';
                        }>;
                        defaultLocale: string;
                        expiryDays?: number;
                        mainBanner: {
                            position: 'top' | 'bottom' | 'middle' | 'left-bottom' | 'right-bottom';
                            overlayOpacity?: number;
                            showClose?: boolean;
                            showLocaleSwitcher?: boolean;
                            heading?: string;
                            headingTag?: string;
                            htmlText: string;
                            buttons: Record<string, {
                                text: string;
                                style: 'primary' | 'secondary' | 'text' | 'accent';
                                action: 'submit' | 'manage' | 'close' | 'custom' | 'link';
                                cookies?: string[] | '*' | '!';
                                url?: string;
                            }>;
                            stackButtonsOnBreakpoint?: number;
                            trapFocus?: boolean;
                        };
                        gpcBanner?: {
                            position: 'top' | 'bottom' | 'middle' | 'left-bottom' | 'right-bottom';
                            overlayOpacity?: number;
                            showClose?: boolean;
                            showLocaleSwitcher?: boolean;
                            heading?: string;
                            headingTag?: string;
                            htmlText: string;
                            buttons: Record<string, {
                                text: string;
                                style: 'primary' | 'secondary' | 'text' | 'accent';
                                action: 'submit' | 'manage' | 'close' | 'custom' | 'link';
                                cookies?: string[] | '*' | '!';
                                url?: string;
                            }>;
                            stackButtonsOnBreakpoint?: number;
                            trapFocus?: boolean;
                        };
                        preferenceModal: {
                            heading: string;
                            headingTag?: string;
                            htmlText: string;
                            buttons: Record<string, {
                                text: string;
                                style: 'primary' | 'secondary' | 'text' | 'accent';
                                action: 'submit' | 'manage' | 'close' | 'custom' | 'link';
                                cookies?: string[] | '*' | '!';
                                url?: string;
                            }>;
                            stackButtonsOnBreakpoint?: number;
                            trapFocus?: boolean;
                            position?: 'left' | 'right' | 'center';
                            subheading?: string;
                            categories: Record<string, {
                                heading: string;
                                headingTag?: string;
                                htmlText: string;
                                legalBasis: 'mandatory' | 'consent' | 'legitimate_interest';
                                legitimateInterestDescription?: string;
                                cookies: string[];
                            }>;
                            persistent?: boolean;
                            mobileFullScreenBreakpoint?: number;
                            receiptLabel?: string;
                            receiptDescription?: string;
                        };
                        darkMode?: boolean;
                        allowedOrigins?: string[];
                        dpdpa?: {
                            dataFiduciary: string;
                            grievanceEmail: string;
                            purposeDescription?: string;
                        };
                        regulation?: 'gdpr' | 'ccpa' | 'cpra' | 'dpdpa' | 'uk-gdpr' | 'lgpd' | 'pipeda' |
                        'popia' | 'pdpa-th' | 'appi' | 'kvkk';
                        regulations?: string[];
                        consentTemplateId?: string;
                        uiTemplateId?: string;
                        complianceGroup?: 'opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' | 'opt-in-china' |
                        'opt-in-brazil' | 'general-privacy-consent' | 'notice-only';
                        customComplianceGroup?: string;
                        cookiesOverride?: Record<string, Partial<{
                            purpose?: 'necessary' | 'functional' | 'preferences' | 'analytics' | 'marketing';
                            listenGpc?: boolean;
                            preGrant?: boolean;
                            tcfVendorId?: number;
                            tcfPurposes?: number[];
                            tcfSpecialFeatures?: number[];
                            cpraCategory?: 'sale' | 'sharing' | 'sensitive';
                        }>>;
                        categoriesOverride?: Record<string, Partial<{
                            heading: string;
                            headingTag?: string;
                            htmlText: string;
                            legalBasis: 'mandatory' | 'consent' | 'legitimate_interest';
                            legitimateInterestDescription?: string;
                            cookies: string[];
                        }>>;
                        uiOverride?: Record<string, unknown>;
                        deepMerge?: boolean;
                        gpcMode?: 'ignore' | 'honor' | 'strict';
                        isActive?: boolean;
                        hidePoweredBy?: boolean;
                        allowReceipt?: boolean;
                        complianceConfig?: Record<string, string>;
                        showFooterMetadata?: boolean;
                        enhanceAccessibility?: boolean;
                        locales: string[];
                    };
                    localeContent?: Record<string, { //!! TODO: This is not required to be saved in DB
                        mainBanner: {
                            position: 'top' | 'bottom' | 'middle' | 'left-bottom' | 'right-bottom';
                            overlayOpacity?: number;
                            showClose?: boolean;
                            showLocaleSwitcher?: boolean;
                            heading?: string;
                            headingTag?: string;
                            htmlText: string;
                            buttons: Record<string, {
                                text: string;
                                style: 'primary' | 'secondary' | 'text' | 'accent';
                                action: 'submit' | 'manage' | 'close' | 'custom' | 'link';
                                cookies?: string[] | '*' | '!';
                                url?: string;
                            }>;
                            stackButtonsOnBreakpoint?: number;
                            trapFocus?: boolean;
                        };
                        gpcBanner?: {
                            position: 'top' | 'bottom' | 'middle' | 'left-bottom' | 'right-bottom';
                            overlayOpacity?: number;
                            showClose?: boolean;
                            showLocaleSwitcher?: boolean;
                            heading?: string;
                            headingTag?: string;
                            htmlText: string;
                            buttons: Record<string, {
                                text: string;
                                style: 'primary' | 'secondary' | 'text' | 'accent';
                                action: 'submit' | 'manage' | 'close' | 'custom' | 'link';
                                cookies?: string[] | '*' | '!';
                                url?: string;
                            }>;
                            stackButtonsOnBreakpoint?: number;
                            trapFocus?: boolean;
                        };
                        preferenceModal: {
                            heading: string;
                            headingTag?: string;
                            htmlText: string;
                            buttons: Record<string, {
                                text: string;
                                style: 'primary' | 'secondary' | 'text' | 'accent';
                                action: 'submit' | 'manage' | 'close' | 'custom' | 'link';
                                cookies?: string[] | '*' | '!';
                                url?: string;
                            }>;
                            stackButtonsOnBreakpoint?: number;
                            trapFocus?: boolean;
                            position?: 'left' | 'right' | 'center';
                            subheading?: string;
                            categories: Record<string, {
                                heading: string;
                                headingTag?: string;
                                htmlText: string;
                                legalBasis: 'mandatory' | 'consent' | 'legitimate_interest';
                                legitimateInterestDescription?: string;
                                cookies: string[];
                            }>;
                            persistent?: boolean;
                            mobileFullScreenBreakpoint?: number;
                            receiptLabel?: string;
                            receiptDescription?: string;
                        };
                    }>;
                }): Promise<{
                    id: string;
                    tenantId: string;
                    name: string;
                    defaultLocale: string;
                    version: number;
                    profileJson: any;
                    createdAt: string;
                    updatedAt: string;
                }>;
                updateProfile(id: string, data: {
                    name?: string;
                    defaultLocale?: string;
                    profileJson?: any;
                    version?: number;
                    localeContent?: Record<string, any>;
                }): Promise<{
                    id: string;
                    tenantId: string;
                    name: string;
                    defaultLocale: string;
                    version: number;
                    profileJson: any;
                    createdAt: string;
                    updatedAt: string;
                }>;
                deleteProfile(id: string): Promise<void>;
                getProfile(id: string): Promise<{
                    id: string;
                    tenantId: string;
                    name: string;
                    defaultLocale: string;
                    version: number;
                    profileJson: any;
                    createdAt: string;
                    updatedAt: string;
                } | null>;
                getProfiles(tenantId: string): Promise<Array<{
                    id: string;
                    tenantId: string;
                    name: string;
                    defaultLocale: string;
                    version: number;
                    profileJson: any;
                    createdAt: string;
                    updatedAt: string;
                }>>;
                findActiveProfileByComplianceGroup(tenantId: string, complianceGroup: string): Promise<{
                    id: string;
                    tenantId: string;
                    name: string;
                    defaultLocale: string;
                    version: number;
                    profileJson: any;
                    createdAt: string;
                    updatedAt: string;
                } | null>;
                listProfilesSummary(tenantId: string): Promise<Array<{
                    id: string;
                    name: string;
                    defaultLocale: string;
                    complianceGroup: 'opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' | 'opt-in-china' |
                    'opt-in-brazil' | 'general-privacy-consent' | 'notice-only' | null;
                    customComplianceGroup: string | null;
                    isActive: boolean;
                    consentTemplateName: string | null;
                    uiTemplateName: string | null;
                    createdAt: string;
                    updatedAt: string;
                }>>;
                findProfilesUsingConsentTemplate(templateId: string): Promise<Array<{
                    id: string;
                    name: string;
                    defaultLocale: string;
                    complianceGroup: 'opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' | 'opt-in-china' |
                    'opt-in-brazil' | 'general-privacy-consent' | 'notice-only' | null;
                    customComplianceGroup: string | null;
                    isActive: boolean;
                    consentTemplateName: string | null;
                    uiTemplateName: string | null;
                    createdAt: string;
                    updatedAt: string;
                }>>;
                findProfilesUsingUITemplate(templateId: string): Promise<Array<{
                    id: string;
                    name: string;
                    defaultLocale: string;
                    complianceGroup: 'opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' | 'opt-in-china' |
                    'opt-in-brazil' | 'general-privacy-consent' | 'notice-only' | null;
                    customComplianceGroup: string | null;
                    isActive: boolean;
                    consentTemplateName: string | null;
                    uiTemplateName: string | null;
                    createdAt: string;
                    updatedAt: string;
                }>>;
                getOptInStats(tenantId: string, filters: {
                    profileId?: string;
                    complianceGroup?: string;
                    from?: string;
                    to?: string;
                    locale?: string;
                }): Promise<{
                    total: number;
                    granted: number;
                    denied: number;
                    managed: number;
                    grantedPct: number;
                    deniedPct: number;
                    managedPct: number;
                    byLocale: Record<string, { total: number; granted: number; denied: number; managed: number }>;
                    byDate: Array<{ date: string; total: number; granted: number; denied: number; managed: number }>;
                }>;
                createConsent(data: {
                    tenantId: string;
                    visitorId: string;
                    profileId: string;
                    locale: string;
                    consentJson: Record<string, 'granted' | 'denied' | 'objected'>;
                    gpcDetected: boolean;
                    source: 'banner' | 'api' | 'import';
                    ageVerified?: boolean;
                    parentalConsentToken?: string;
                    tcfString?: string;
                    signature?: string;
                }): Promise<{
                    id: string;
                    tenantId: string;
                    visitorId: string;
                    profileId: string;
                    locale: string;
                    consentJson: Record<string, 'granted' | 'denied' | 'objected'>;
                    gpcDetected: boolean;
                    source: 'banner' | 'api' | 'import';
                    ageVerified?: boolean;
                    parentalConsentToken?: string;
                    tcfString?: string;
                    signature?: string;
                    createdAt: string;
                    updatedAt: string;
                }>;
                updateConsent(visitorId: string, data: {
                    consentJson: Record<string, 'granted' | 'denied' | 'objected'>;
                    locale?: string;
                    gpcDetected?: boolean;
                    signature?: string;
                }): Promise<{
                    id: string;
                    tenantId: string;
                    visitorId: string;
                    profileId: string;
                    locale: string;
                    consentJson: Record<string, 'granted' | 'denied' | 'objected'>;
                    gpcDetected: boolean;
                    source: 'banner' | 'api' | 'import';
                    ageVerified?: boolean;
                    parentalConsentToken?: string;
                    tcfString?: string;
                    signature?: string;
                    createdAt: string;
                    updatedAt: string;
                }>;
                deleteConsent(visitorId: string): Promise<void>;
                getConsent(visitorId: string): Promise<{
                    id: string;
                    tenantId: string;
                    visitorId: string;
                    profileId: string;
                    locale: string;
                    consentJson: Record<string, 'granted' | 'denied' | 'objected'>;
                    gpcDetected: boolean;
                    source: 'banner' | 'api' | 'import';
                    ageVerified?: boolean;
                    parentalConsentToken?: string;
                    tcfString?: string;
                    signature?: string;
                    createdAt: string;
                    updatedAt: string;
                } | null>;
                getConsents(filters: {
                    tenantId: string;
                    profileId?: string;
                    from?: string;
                    to?: string;
                    page?: number;
                    limit?: number;
                    q?: string;
                }): Promise<{
                    items: Array<{
                        id: string;
                        tenantId: string;
                        visitorId: string;
                        profileId: string;
                        locale: string;
                        gpcDetected: boolean;
                        source: 'banner' | 'api' | 'import';
                        ageVerified?: boolean;
                        createdAt: string;
                        updatedAt: string;
                    }>;
                    total: number;
                    page: number;
                    limit: number;
                }>;
                streamConsents(filters: {
                    tenantId: string;
                    profileId?: string;
                    from?: string;
                    to?: string;
                    page?: number;
                    limit?: number;
                    q?: string;
                }): AsyncIterable<{
                    id: string;
                    tenantId: string;
                    visitorId: string;
                    profileId: string;
                    locale: string;
                    consentJson: Record<string, 'granted' | 'denied' | 'objected'>;
                    gpcDetected: boolean;
                    source: 'banner' | 'api' | 'import';
                    ageVerified?: boolean;
                    parentalConsentToken?: string;
                    tcfString?: string;
                    signature?: string;
                    createdAt: string;
                    updatedAt: string;
                }>;
                createVisitor(data: {
                    tenantId: string;
                    visitorId: string;
                    country?: string;
                    region?: string;
                    city?: string;
                    ipHash?: string;
                    userAgentHash?: string;
                }): Promise<{
                    id: string;
                    tenantId: string;
                    visitorId: string;
                    country?: string;
                    region?: string;
                    city?: string;
                    ipHash?: string;
                    userAgentHash?: string;
                    firstSeen: string;
                    lastSeen: string;
                }>;
                updateVisitor(visitorId: string, data: {
                    country?: string;
                    region?: string;
                    city?: string;
                    lastSeen?: string;
                }): Promise<{
                    id: string;
                    tenantId: string;
                    visitorId: string;
                    country?: string;
                    region?: string;
                    city?: string;
                    ipHash?: string;
                    userAgentHash?: string;
                    firstSeen: string;
                    lastSeen: string;
                }>;
                deleteVisitor(visitorId: string): Promise<void>;
                getVisitor(visitorId: string): Promise<{
                    id: string;
                    tenantId: string;
                    visitorId: string;
                    country?: string;
                    region?: string;
                    city?: string;
                    ipHash?: string;
                    userAgentHash?: string;
                    firstSeen: string;
                    lastSeen: string;
                } | null>;
                getVisitors(filters: {
                    tenantId: string;
                    from?: string;
                    to?: string;
                    page?: number;
                    limit?: number;
                    q?: string;
                }): Promise<{
                    items: Array<{
                        id: string;
                        tenantId: string;
                        visitorId: string;
                        country?: string;
                        region?: string;
                        city?: string;
                        ipHash?: string;
                        userAgentHash?: string;
                        firstSeen: string;
                        lastSeen: string;
                    }>;
                    total: number;
                    page: number;
                    limit: number;
                }>;
                getConsentHistory(visitorId: string): Promise<Array<{
                    id: string;
                    tenantId: string;
                    consentRecordId: string;
                    visitorId: string;
                    oldJson: Record<string, 'granted' | 'denied' | 'objected'> | null;
                    newJson: Record<string, 'granted' | 'denied' | 'objected'>;
                    action: 'created' | 'updated' | 'withdrawn';
                    createdAt: string;
                }>>;
                streamAuditLogs(filters: {
                    tenantId: string;
                    action?: string;
                    resourceType?: string;
                    from?: string;
                    to?: string;
                    page?: number;
                    limit?: number;
                    q?: string;
                }): AsyncIterable<{
                    id: string;
                    tenantId: string;
                    userId?: string;
                    action: string;
                    resourceType: string;
                    resourceId?: string;
                    oldData?: unknown;
                    newData?: unknown;
                    createdAt: string;
                }>;
                createNoticeShown(data: {
                    tenantId: string;
                    visitorId: string;
                    profileId: string;
                    locale: string;
                }): Promise<{
                    id: string;
                    tenantId: string;
                    visitorId: string;
                    profileId: string;
                    locale: string;
                    createdAt: string;
                }>;
                getNoticeShownForVisitor(visitorId: string): Promise<Array<{
                    id: string;
                    tenantId: string;
                    visitorId: string;
                    profileId: string;
                    locale: string;
                    createdAt: string;
                }>>;
                getOverviewStats(tenantId: string): Promise<{
                    totalConsents: number;
                    acceptedPct: number;
                    rejectedPct: number;
                    totalVisitors: number;
                    gpcDetectedCount: number;
                }>;
                getCategoryStats(tenantId: string): Promise<Record<string, { granted: number; denied: number; objected: number }>>;
                getTimeline(tenantId: string, days?: number): Promise<Array<{ date: string; count: number }>>;
                getCountries(tenantId: string): Promise<Array<{ country: string; count: number }>>;
                getGpcStats(tenantId: string): Promise<{ detected: number; total: number; rate: number }>;
                getTenants(): Promise<Array<{ id: string; name: string; slug: string; createdAt: string; updatedAt: string }>>;
                createTenant(data: { name: string; slug: string }): Promise<{ id: string; name: string; slug: string; createdAt: string; updatedAt: string }>;
                updateTenant(id: string, data: { name?: string; slug?: string }): Promise<{ id: string; name: string; slug: string; createdAt: string; updatedAt: string }>;
                deleteTenant(id: string): Promise<void>;
                getSettings(tenantId: string): Promise<{ allowedOrigins?: string[]; adminAllowedOrigins?: string[]; setupCompleted?: boolean }>;
                updateSettings(tenantId: string, data: Partial<{ allowedOrigins?: string[]; adminAllowedOrigins?: string[]; setupCompleted?: boolean }>): Promise<{ allowedOrigins?: string[]; adminAllowedOrigins?: string[]; setupCompleted?: boolean }>;
                createApiKey(data: { tenantId: string; name: string; keyHash: string; createdBy?: string; expireBy?: string }): Promise<{ id: string; tenantId: string; keyHash: string; name: string; isActive: boolean; createdBy?: string; expireBy?: string; createdAt: string; updatedAt?: string }>;
                getApiKeyByHash(keyHash: string): Promise<{ id: string; tenantId: string; keyHash: string; name: string; isActive: boolean; createdBy?: string; expireBy?: string; createdAt: string; updatedAt?: string } | null>;
                revokeApiKey(id: string): Promise<void>;
                reactivateApiKey(id: string): Promise<void>;
                deleteApiKey(id: string): Promise<void>;
                getApiKeys(tenantId: string): Promise<Array<{ id: string; tenantId: string; keyHash: string; name: string; isActive: boolean; createdBy?: string; expireBy?: string; createdAt: string; updatedAt?: string }>>;
                purgeExpiredConsents(olderThanDays: number): Promise<number>;
                purgeExpiredAuditLogs(olderThanDays: number): Promise<number>;
            };
            config: ConsentiServerConfig;
        }): Promise<void>; // from ConsentiServerPlugin
        destroy?(): Promise<void>; // from ConsentiServerPlugin
        beforeConsentSave?(data: {
            tenantId: string;
            visitorId: string;
            profileId: string;
            locale: string;
            consentJson: Record<string, 'granted' | 'denied' | 'objected'>;
            gpcDetected: boolean;
            source: 'banner' | 'api' | 'import';
            ageVerified?: boolean;
            parentalConsentToken?: string;
            tcfString?: string;
            signature?: string;
        }): Promise<{
            tenantId: string;
            visitorId: string;
            profileId: string;
            locale: string;
            consentJson: Record<string, 'granted' | 'denied' | 'objected'>;
            gpcDetected: boolean;
            source: 'banner' | 'api' | 'import';
            ageVerified?: boolean;
            parentalConsentToken?: string;
            tcfString?: string;
            signature?: string;
        }>; // from ConsentiServerPlugin
        afterConsentSave?(record: {
            id: string;
            tenantId: string;
            visitorId: string;
            profileId: string;
            locale: string;
            consentJson: Record<string, 'granted' | 'denied' | 'objected'>;
            gpcDetected: boolean;
            source: 'banner' | 'api' | 'import';
            ageVerified?: boolean;
            parentalConsentToken?: string;
            tcfString?: string;
            signature?: string;
            createdAt: string;
            updatedAt: string;
        }): Promise<void>; // from ConsentiServerPlugin
        beforeConsentUpdate?(data: {
            consentJson: Record<string, 'granted' | 'denied' | 'objected'>;
            locale?: string;
            gpcDetected?: boolean;
            signature?: string;
        }): Promise<{
            consentJson: Record<string, 'granted' | 'denied' | 'objected'>;
            locale?: string;
            gpcDetected?: boolean;
            signature?: string;
        }>; // from ConsentiServerPlugin
        afterConsentUpdate?(record: {
            id: string;
            tenantId: string;
            visitorId: string;
            profileId: string;
            locale: string;
            consentJson: Record<string, 'granted' | 'denied' | 'objected'>;
            gpcDetected: boolean;
            source: 'banner' | 'api' | 'import';
            ageVerified?: boolean;
            parentalConsentToken?: string;
            tcfString?: string;
            signature?: string;
            createdAt: string;
            updatedAt: string;
        }): Promise<void>; // from ConsentiServerPlugin
        beforeProfileFetch?(id: string): Promise<string>; // from ConsentiServerPlugin
        afterProfileFetch?(profile: {
            id: string;
            tenantId: string;
            name: string;
            defaultLocale: string;
            version: number;
            profileJson: {
                id: string;
                cookies?: Record<string, {
                    purpose?: 'necessary' | 'functional' | 'preferences' | 'analytics' | 'marketing';
                    listenGpc?: boolean;
                    preGrant?: boolean;
                    tcfVendorId?: number;
                    tcfPurposes?: number[];
                    tcfSpecialFeatures?: number[];
                    cpraCategory?: 'sale' | 'sharing' | 'sensitive';
                }>;
                defaultLocale: string;
                expiryDays?: number;
                mainBanner: {
                    position: 'top' | 'bottom' | 'middle' | 'left-bottom' | 'right-bottom';
                    overlayOpacity?: number;
                    showClose?: boolean;
                    showLocaleSwitcher?: boolean;
                    heading?: string;
                    headingTag?: string;
                    htmlText: string;
                    buttons: Record<string, {
                        text: string;
                        style: 'primary' | 'secondary' | 'text' | 'accent';
                        action: 'submit' | 'manage' | 'close' | 'custom' | 'link';
                        cookies?: string[] | '*' | '!';
                        url?: string;
                    }>;
                    stackButtonsOnBreakpoint?: number;
                    trapFocus?: boolean;
                };
                gpcBanner?: {
                    position: 'top' | 'bottom' | 'middle' | 'left-bottom' | 'right-bottom';
                    overlayOpacity?: number;
                    showClose?: boolean;
                    showLocaleSwitcher?: boolean;
                    heading?: string;
                    headingTag?: string;
                    htmlText: string;
                    buttons: Record<string, {
                        text: string;
                        style: 'primary' | 'secondary' | 'text' | 'accent';
                        action: 'submit' | 'manage' | 'close' | 'custom' | 'link';
                        cookies?: string[] | '*' | '!';
                        url?: string;
                    }>;
                    stackButtonsOnBreakpoint?: number;
                    trapFocus?: boolean;
                };
                preferenceModal: {
                    heading: string;
                    headingTag?: string;
                    htmlText: string;
                    buttons: Record<string, {
                        text: string;
                        style: 'primary' | 'secondary' | 'text' | 'accent';
                        action: 'submit' | 'manage' | 'close' | 'custom' | 'link';
                        cookies?: string[] | '*' | '!';
                        url?: string;
                    }>;
                    stackButtonsOnBreakpoint?: number;
                    trapFocus?: boolean;
                    position?: 'left' | 'right' | 'center';
                    subheading?: string;
                    categories: Record<string, {
                        heading: string;
                        headingTag?: string;
                        htmlText: string;
                        legalBasis: 'mandatory' | 'consent' | 'legitimate_interest';
                        legitimateInterestDescription?: string;
                        cookies: string[];
                    }>;
                    persistent?: boolean;
                    mobileFullScreenBreakpoint?: number;
                    receiptLabel?: string;
                    receiptDescription?: string;
                };
                darkMode?: boolean;
                allowedOrigins?: string[];
                dpdpa?: {
                    dataFiduciary: string;
                    grievanceEmail: string;
                    purposeDescription?: string;
                };
                regulation?: 'gdpr' | 'ccpa' | 'cpra' | 'dpdpa' | 'uk-gdpr' | 'lgpd' | 'pipeda' | 'popia' | 'pdpa-th' | 'appi' | 'kvkk';
                regulations?: string[];
                consentTemplateId?: string;
                uiTemplateId?: string;
                complianceGroup?: 'opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' | 'opt-in-china' | 'opt-in-brazil' | 'general-privacy-consent' | 'notice-only';
                customComplianceGroup?: string;
                cookiesOverride?: Record<string, Partial<{
                    purpose?: 'necessary' | 'functional' | 'preferences' | 'analytics' | 'marketing';
                    listenGpc?: boolean;
                    preGrant?: boolean;
                    tcfVendorId?: number;
                    tcfPurposes?: number[];
                    tcfSpecialFeatures?: number[];
                    cpraCategory?: 'sale' | 'sharing' | 'sensitive';
                }>>;
                categoriesOverride?: Record<string, Partial<{
                    heading: string;
                    headingTag?: string;
                    htmlText: string;
                    legalBasis: 'mandatory' | 'consent' | 'legitimate_interest';
                    legitimateInterestDescription?: string;
                    cookies: string[];
                }>>;
                uiOverride?: Record<string, unknown>;
                deepMerge?: boolean;
                gpcMode?: 'ignore' | 'honor' | 'strict';
                isActive?: boolean;
                hidePoweredBy?: boolean;
                allowReceipt?: boolean;
                complianceConfig?: Record<string, string>;
                showFooterMetadata?: boolean;
                enhanceAccessibility?: boolean;
                locales: string[];
            };
            createdAt: string;
            updatedAt: string;
        }): Promise<{
            id: string;
            tenantId: string;
            name: string;
            defaultLocale: string;
            version: number;
            profileJson: any;
            createdAt: string;
            updatedAt: string;
        }>; // from ConsentiServerPlugin
        beforeUserCreate?(data: {
            tenantId: string;
            name: string;
            email: string;
            passwordHash: string;
            allowedTenants?: string[];
        }): Promise<{
            tenantId: string;
            name: string;
            email: string;
            passwordHash: string;
            allowedTenants?: string[];
        }>; // from ConsentiServerPlugin
        afterUserCreate?(user: {
            id: string;
            tenantId: string;
            name: string;
            email: string;
            passwordHash: string;
            isActive: boolean;
            totpEnabled?: boolean;
            totpSecret?: string;
            allowedTenants?: string[];
            createdAt: string;
            updatedAt: string;
        }): Promise<void>; // from ConsentiServerPlugin
    }>; // from ConsentiServerConfig (ConsentiServerPlugin[])

    /** Server-side Transparency and Consent Framework options */
    tcf?: {
        enabled: boolean;
        cmpId: number;
        cmpVersion: number;
    }; // from ConsentiServerConfig (TcfConfig)

    /** Server data retention rules for consent records and audit logs */
    dataRetention?: {
        purgeAfterDays: number;
        auditLogPurgeAfterDays?: number;
    }; // from ConsentiServerConfig (DataRetentionConfig)

    maxBodySize?: number; // from ConsentiServerConfig
    trustedProxies?: string[]; // from ConsentiServerConfig

    /** Visual assets for dashboard custom branding */
    branding?: {
        appName?: string;
        appLogoPath?: string;
        hidePoweredBy?: boolean;
    }; // from ConsentiServerConfig (BrandingConfig)

    /** CDN/S3 distribution setup for generated profile assets */
    s3Api?: {
        enabled: boolean;
        region: string;
        bucketName: string;
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken?: string;
    }; // from ConsentiServerConfig (S3ApiConfig)

    dataSigningHash?: string; // from ConsentiServerConfig
    handleCache?: (paths: string[], profileId: string, isPurge: boolean) => void; // from ConsentiServerConfig
}

export type DeepPartial<T> = T extends Function
    ? T
    : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> | null }
    : T;
