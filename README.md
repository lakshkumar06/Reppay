# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```


#Reppay


🚀 About Reppay

Reppay is a user-first remittance platform built on Solana, designed to make cross-border stablecoin transfers simple, secure, and wallet-optional for new users. Using email-based identity instead of wallet addresses, Reppay empowers users to send, receive, and hold stablecoins like USDC with ease — even if the recipient doesn’t yet have a wallet.



📈 Key Features





💡 Email-Based Transfers: No wallet address required — users send funds via email identity.



🔒 Sponsor-Escrow-Beneficiary Model: Funds are securely held in escrow until claimed.



⏳ Partial Claims Support: Beneficiaries can claim part of the funds, the rest stays safe in escrow.



🧠 Wallet Awareness Prompt: If a beneficiary has no wallet, the system notifies the sponsor and prompts wallet creation.



⚡ Stablecoin-Only Remittance: Zero crypto volatility risk for senders and receivers.



🔥 EOA + Smart Contract Support: Handles both Externally Owned Accounts and smart contract wallets.



📡 Network Failure Safety: In the event of network downtime, funds remain untouched and trackable.



🌍 Global Financial Access: Supports unbanked or fintech-limited regions with seamless onboarding.



🏋 Explain Your Features

Reppay makes remittance stress-free for both tech-savvy and non-crypto users. By using emails as identifiers and leveraging smart contracts, the system ensures funds are securely sent even if the recipient lacks a wallet. The funds are locked in escrow until the beneficiary claims them — providing both safety and flexibility. This removes traditional crypto barriers like volatility, addresses, and technical complexity.



📦 Tech Stack

Frontend:





Built with React.js and TypeScript for a modern, responsive, and intuitive user experience.

Backend:





Powered by Node.js, handling API requests, email authentication, and transaction flow logic.

Smart Contract:





Developed in Rust using the Anchor Framework on Solana, ensuring secure, efficient contract execution.

Database:





Firebase Firestore — storing user metadata, transaction logs, and wallet linkage information.

APIs & Integrations:





Phantom and MetaMask Wallets — for secure wallet connections.



Email Authentication Service — for identity verification and wallet address replacement.



🛠 How It Works

1️⃣ Sponsor enters the beneficiary’s email and sends the funds via a smart contract.
2️⃣ If the beneficiary already has a linked wallet, funds are transferred immediately.
3️⃣ If no wallet is detected, the system prompts both sponsor and beneficiary, allowing the beneficiary to create and link a wallet at their convenience.
4️⃣ Funds remain safe in escrow until claimed, with full visibility for both parties.
5️⃣ Beneficiaries can claim funds partially or fully, based on their needs.



📌 Technicals





Rust & Anchor Framework: Solana smart contracts (called Programs) written with security-first design.



Email Authentication: Simplifies identity management and avoids wallet address sharing.



EOA and Smart Contract Wallets: Supports both externally owned accounts and program-managed accounts.



Escrow Logic: Protects the funds until the beneficiary verifies ownership and decides to claim.



React + Node.js Backend: Handles seamless frontend interaction and backend processing.



✅ Why Your Submission?

Reppay directly supports the core mission of blockchain: global financial inclusion, borderless payments, and reduced friction. It simplifies remittances for real-world users by eliminating wallet dependency and introducing email-based transfers with stablecoins.

Our solution tackles problems that traditional remittance services can’t fix — especially in regions lacking fintech infrastructure, like parts of Africa, Southeast Asia, and Latin America.

Thanks to the stability of USDC on Solana and our escrow model, funds are immune to volatility until claimed. This creates a safe, simple, and transparent flow of money between two parties — no wallet needed until the user is ready. The design enables remittance without the usual pain points: lost addresses, market volatility, and misused funds.

This system can help push global crypto adoption forward by reducing the learning curve and making stablecoin transfers a truly inclusive experience.



📅 Project Future





🌍 Multi-Chain Expansion: Ethereum, Polygon, and other L2 support for universal compatibility.



💸 On-Ramp / Off-Ramp Integration: Allow fiat-to-crypto direct conversion and vice versa.



📲 Mobile App: A streamlined mobile-first experience for even wider reach in underbanked regions.



🤖 AI-Powered Risk Detection: Monitor suspicious patterns to protect both sponsors and beneficiaries.



🤝 Team & Contributions

🧑‍💻 Gargi Pathak — Lead Developer
🎨 Laksh Kumar — UI/UX Designer
📊 Shanthan Sudhini — Data Analyst




