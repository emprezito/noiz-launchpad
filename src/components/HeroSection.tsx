import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="gradient-hero pt-32 pb-20 min-h-screen flex items-center">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-card rounded-full px-6 py-2 shadow-noiz-md mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-noiz-green rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold text-foreground">
              🎉 Now Live on Testnet
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight font-display animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <span className="gradient-text">
              Turn Audio Memes
            </span>
            <br />
            <span className="text-foreground">Into Tradeable Assets</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            The first audio meme launchpad on Solana. Create, trade, and earn from viral sounds with bonding curve mechanics.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link to="/create">
              <Button variant="hero" size="xl">
                🚀 Create Your Token
              </Button>
            </Link>
            <Link to="/tokens">
              <Button variant="heroOutline" size="xl">
                🔍 Explore Tokens
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl p-8 shadow-noiz-lg animate-fade-in hover:shadow-noiz-xl transition-shadow" style={{ animationDelay: "0.4s" }}>
              <div className="text-4xl font-black text-noiz-purple mb-2 font-display">0.02 SOL</div>
              <div className="text-muted-foreground font-semibold">Creation Fee</div>
            </div>
            <div className="bg-card rounded-2xl p-8 shadow-noiz-lg animate-fade-in hover:shadow-noiz-xl transition-shadow" style={{ animationDelay: "0.5s" }}>
              <div className="text-4xl font-black text-noiz-pink mb-2 font-display">1%</div>
              <div className="text-muted-foreground font-semibold">Trading Fee</div>
            </div>
            <div className="bg-card rounded-2xl p-8 shadow-noiz-lg animate-fade-in hover:shadow-noiz-xl transition-shadow" style={{ animationDelay: "0.6s" }}>
              <div className="text-4xl font-black text-noiz-blue mb-2 font-display">Instant</div>
              <div className="text-muted-foreground font-semibold">Liquidity</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
