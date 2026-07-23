```js
// cookie name
consenti_data

// cookie value
 {
  "s": 1, // Schema (profile) id
  "v": 123, // Schema (profile) version
  "i": "5hufbunf-4cd2-4e65-9201-2d0505780fc1", // unique consent id
  "u": "49c35803-4cd2-4e65-9201-2d0505780fc1", // logged in user id, blank for anonymous users
  "t": 1751692400,  // unix timestamp of the consent
  "g": 0, // was user browser sent GPC signal?
  "p": 0, // programmatic consent - 0 = no, by user click, 1 = by widget methods, 2 or more = by user script/extension
  "c": { // consents - g = granted, o = objected, d = denied
    "functional_necessity": "g",
    "ad_storage": "o",
    "ad_user_data": "d",
    "ad_personalization": "d",
    "analytics_storage": "g"
  }
}

 {
  "v": 1,
  "s": 123,
  "i": "5hufbunf-4cd2-4e65-9201-2d0505780fc1",
  "u": "49c35803-4cd2-4e65-9201-2d0505780fc1",
  "t": 1751692400, 
  "g": 0,
  "p": 0,
  "c": {
    "functional_necessity": "g",
    "ad_storage": "o",
    "ad_user_data": "d",
    "ad_personalization": "d",
    "analytics_storage": "g"
  }
}
1f8b0800000000000013858c490ac3200045eff2d7068cd10c5e2658a70ac194a88534e4ee45d242775d3df8c33bf084440b8254c93a100448887b71b7125dc3b5610db7bd682646db86192aa81846ea743d1548f0497762a4dd9f69aefe41b4fdc438a520f090a87c7ca8210fb812750e6b54cb1cadb62985bc43c283409939e57553de4262bd8292ec361b951524cc153dec96ea3fbc54157d8ba8963d079d7e1c1ee7f906e0056c7d00010000
// how cookie value will get stored, not in above json, but like
v:112;s:1;i:5hufbunf-4cd2-4e65-9201-2d0505780fc1;u:49c35803-4cd2-4e65-9201-2d0505780fc1;t:1751692400;g:0;p:0;c:functional_necessity=g,ad_storage=o,ad_user_data=d,ad_personalization=d,analytics_storage=g

{"v":1,"s":123,"i":"5hufbunf-4cd2-4e65-9201-2d0505780fc1","u":"49c35803-4cd2-4e65-9201-2d0505780fc1","t":1751692400,"g":0,"p":0,"c":{"functional_necessity":"g","ad_storage":"o","ad_user_data":"d","ad_personalization":"d","analytics_storage":"g"}}

// to parse it
Object.fromEntries(cookie.split(";").map(v => v.split(":")).map(v => (((v[0] === 'c') ? v[1] = Object.fromEntries(v[1].split(",").map(c => c.split("="))) : true) && v)))
```
---
purposes
---
- necessary = n
- functional = f
- preferences = p
- analytics = a
- marketing = m

---
values
---
- granted = g
- objected = o
- denied = d

---

# What are consent data


## Purpose for the cookie
User can create any number of cookeis

| Purpose         | Meaning                                                                                                     | Typical Values                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **necessary**   | Strictly required to deliver the service explicitly requested by the user or to ensure security/compliance. | **Granted only** (cannot be denied/objected because these are not optional) |
| **functional**  | Optional features that enhance functionality but are not essential.                                         | Granted / Denied / Objected                                                 |
| **preferences** | Remember user choices and personalize the experience for that user. think like "Remember me."               | Granted / Denied / Objected                                                 |
| **analytics**   | Measure usage, performance, and improve the product.                                                        | Granted / Denied / Objected                                                 |
| **marketing**   | Advertising, profiling, cross-site tracking, conversion measurement, retargeting, personalization for ads.  | Granted / Denied / Objected                                                 |

## States for the cookie
| State        | Meaning                                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Granted**  | User has actively permitted the processing.                                                                                              |
| **Denied**   | User has declined or withdrawn consent where consent is the legal basis.                                                                 |
| **Objected** | User has exercised a legal right to object to processing that is based on legitimate interests or another objection-capable legal basis. |


## Purpose Description & Examples
### 1. Necessary
Without these, the website cannot reasonably provide the requested service.
> If disabled: ❌ Website breaks.

Therefore: `necessary = Granted Always`. The user never "consents" to these; they're processed under another legal basis where applicable.

Examples:
- Login session
- Shopping cart
- CSRF protection
- Authentication
- Load balancing
- Fraud prevention
- Payment processing
- Consent cookie itself




### 2. Functional:
These make the experience better, but the site still works without them.
> If disabled: Website still works.

Examples:
- Live chat widget
- Embedded Google Maps
- YouTube player remembering settings
- Language auto-switching
- Dark mode sync across devices
- Accessibility enhancements requiring storage




### 3. Preferences
Remember what the user chose.
> Think: "Remember me."

Examples:
- Theme (dark/light)
- Language
- Currency
- Timezone
- Font size
- Dashboard layout


### 4. Marketing

Personalization for advertising or commercial purposes.

Example:

- User visited Shoes → Show shoe ads tomorrow
- Facebook Pixel
- Google Ads
- TikTok Pixel
- LinkedIn Insight
- Adobe Audience Manager


### 5. Analytics

Simple. Measure.

Examples:

- Google Analytics
- Adobe Analytics
- Microsoft Clarity
- Hotjar
- Mixpanel
- Amplitude
- PostHog


## Purpose to tool mapping

| Google Consent Mode       | Consenti Purpose         | Legal Basis                   | GPC | CPRA Category  |
| ------------------------- | ------------------------ | ----------------------------- | --- | -------------- |
| `analytics_storage`       | analytics                | consent | legitimate_interest | ✅   | undefined     |
| `ad_storage`              | marketing                | consent                       | ✅   | sharing       |
| `ad_user_data`            | marketing                | consent                       | ✅   | sale          |
| `ad_personalization`      | marketing                | consent                       | ✅   | sharing       |
| `functionality_storage`   | functional / preferences | consent | legitimate_interest | ❌   | undefined     |
| `personalization_storage` | preferences              | consent | legitimate_interest | ❌   | undefined     |
| `security_storage`        | necessary                | mandatory                     | ❌   | undefined     |

#### 🌐 Advanced Privacy Control Settings
- `ads_data_redaction`: `true` | `false` - Deletes ad identifiers from URLs when marketing consent is denied.
- `url_passthrough`: `true` | `false` - Appends tracking tokens to URLs when browser storage permissions are blocked.

---

| Adobe Product                     | Consenti Purpose        | Legal Basis                   | GPC               | CPRA Category |
| --------------------------------- | ----------------------- | ----------------------------- | ----------------- | ------------- |
| Adobe Analytics                   | analytics               | consent | legitimate_interest | ✅                | undefined     |
| Adobe Target                      | preferences / marketing | consent | legitimate_interest | ✅ (if marketing) | sharing       |
| Adobe Audience Manager            | marketing               | consent                       | ✅                | sale          |
| Adobe Journey Optimizer           | marketing               | consent                       | ✅                | sharing       |
| Adobe Experience Platform Web SDK | Mixed                   | configurable                  | configurable      | configurable  |
 

---

| Meta Feature        | Consenti Purpose | Legal Basis                   | GPC | CPRA Category   |
| ------------------- | ---------------- | ----------------------------- | --- | --------------- |
| Meta Pixel          | marketing        | consent                       | ✅   | sale / sharing |
| Conversions API     | marketing        | consent                       | ✅   | sale / sharing |
| Social Plugins      | functional       | consent | legitimate_interest | ❌   | undefined      |
| Login with Facebook | functional       | mandatory / consent           | ❌   | undefined      |

--- 

| Microsoft Clarity Feature | Consenti Purpose | Legal Basis                   | GPC | CPRA Category |
| ------------------------- | ---------------- | ----------------------------- | --- | ------------- |
| Session Recording         | analytics        | consent | legitimate_interest | ✅  | undefined     |
| Heatmaps                  | analytics        | consent | legitimate_interest | ✅  | undefined     |
| Performance Insights      | analytics        | consent | legitimate_interest | ✅  | undefined     |


---

| Segment API  | Consenti Purpose        | Legal Basis                   | GPC           | CPRA Category |
| ------------ | ----------------------- | ----------------------------- | ------------- | ------------- |
| `identify()` | preferences / analytics | consent | legitimate_interest | configurable  | configurable  |
| `page()`     | analytics               | consent | legitimate_interest | ✅            | undefined     |
| `track()`    | analytics               | consent | legitimate_interest | ✅            | undefined     |
| `group()`    | analytics               | consent | legitimate_interest | ✅            | undefined     |
| `alias()`    | analytics               | consent | legitimate_interest | ✅            | undefined     |


