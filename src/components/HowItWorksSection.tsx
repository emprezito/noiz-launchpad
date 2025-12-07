const steps = [
  {
    number: 1,
    title: "Upload Your Audio",
    description: "Record a voice memo, upload a sound effect, or generate AI voices. Any audio works.",
    gradient: "from-primary to-secondary",
  },
  {
    number: 2,
    title: "Create Token",
    description: "Set name and symbol. Pay 0.02 SOL. Your token launches with a bonding curve instantly.",
    gradient: "from-secondary to-accent",
  },
  {
    number: 3,
    title: "Share & Profit",
    description: "Share on Twitter, Discord, TikTok. As people buy, price goes up. Early holders win big.",
    gradient: "from-accent to-primary",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 gradient-hero">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16 text-foreground font-display">
            How It Works
          </h2>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="flex flex-col md:flex-row items-center gap-6 md:gap-8 bg-card rounded-2xl p-6 md:p-8 shadow-noiz-lg hover:shadow-noiz-xl transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className={`flex-shrink-0 w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-noiz-md`}>
                  {step.number}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-2 text-foreground font-display">{step.title}</h3>
                  <p className="text-muted-foreground text-lg">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
