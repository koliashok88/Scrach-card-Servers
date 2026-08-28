# SS Mobile – Interactive WhatsApp Scratch Card Server

हे package तुमच्या SS Mobile Billing App साठी ग्राहकाच्या WhatsApp मधून उघडणारे **real interactive Scratch Card** server देते.

## काय मिळते
- Unique Scratch Card URL: `/scratch/<id>`
- Reward server-side save होते; URL मध्ये reward plain text ठेवलेला नाही.
- ग्राहक बोटाने Scratch केल्यावरच reward reveal होते.
- Reveal timestamp server वर save होतो.
- Card ID, tier, reward, bill number आणि customer name save करता येतात.
- Billing App मध्ये `Scratch Server URL` local setting म्हणून वापरता येते.

## Run locally
Node.js 18+ आवश्यक.

```bash
npm start
```

नंतर `http://localhost:3000` उघडा.

## Online deploy
Render / Railway / VPS / कोणत्याही Node.js hosting वर हा folder deploy करा.

Environment variables:
- `PORT` — hosting ने दिलेला port (बहुतेक hosting आपोआप देतात)
- `PUBLIC_BASE_URL` — उदा. `https://scratch.yourdomain.com`
- `ADMIN_API_KEY` — optional; API सुरक्षित ठेवण्यासाठी random secret

`PUBLIC_BASE_URL` सेट केल्यावर WhatsApp मध्ये पाठवली जाणारी link अशी बनेल:
`https://scratch.yourdomain.com/scratch/....`

## Billing App मध्ये server URL
App मध्ये `setScratchServerUrl()` उपलब्ध आहे. App च्या Settings मध्ये हा button जोडायचा असल्यास:
`setScratchServerUrl()` call करा आणि online server URL भरा.

उदा. `https://scratch.yourdomain.com`

## महत्त्वाचे
- HTTPS अनिवार्य आहे, विशेषतः WhatsApp ग्राहक link साठी.
- `data/cards.json` persistent disk वर ठेवणे आवश्यक आहे. Render सारख्या services मध्ये persistent disk नसल्यास restart नंतर cards हरवू शकतात.
- Public deployment करण्यापूर्वी `ADMIN_API_KEY` सेट करा आणि Billing App मध्ये API key पाठवण्यासाठी production integration करा. सध्याच्या client-side POST साठी server `ADMIN_API_KEY` रिकामा ठेवणे आवश्यक आहे.
- जर production मध्ये API key वापरायचा असेल तर पुढच्या आवृत्तीत authenticated proxy/backend integration करणे अधिक सुरक्षित आहे.
