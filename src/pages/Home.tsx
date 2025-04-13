import { useState } from "react";
import { Navbar } from "@/components/sections/navbar";
import { Hero } from "@/components/sections/hero";
import { Stats } from "@/components/sections/stats";
import { Features } from "@/components/sections/features";
import { HowItWorks } from "@/components/sections/how-it-works";
import { FAQ } from "@/components/sections/faq";
import { Newsletter } from "@/components/sections/newsletter";
import { CTA } from "@/components/sections/cta";
import { Footer } from "@/components/sections/footer";
import { WalletModal } from "@/components/wallet-modal";
import { Particles } from "@/components/ui/particles";

export default function Home() {
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const handleConnectWallet = () => {
    setWalletModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full overflow-hidden relative">
      <Particles />
      <Navbar onConnectWallet={handleConnectWallet} />
      <main>
        <Hero onConnectWallet={handleConnectWallet} />
        <HowItWorks />
        <Features />
        <Stats />
        <FAQ />
        <Newsletter />
        <CTA onConnectWallet={handleConnectWallet} />
      </main>
      <Footer />
      <WalletModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
    </div>
  );
}
