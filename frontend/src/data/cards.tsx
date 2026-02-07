export type RewardCategory =
  | "food"
  | "groceries"
  | "travel"
  | "entertainment"
  | "gas"
  | "misc";

export type CardTag =
  | "travel"
  | "food"
  | "cashback"
  | "builder"
  | "student"
  | "business"
  | "premium";

export interface CreditCard {
  id: string;
  name: string;
  issuer: "Chase" | "Amex" | "Capital One";
  imageUrl: string;
  annualFee: number;
  requiresGoodCredit: boolean;
  hardPull: boolean;

  rewardProfile: Partial<Record<RewardCategory, number>>;

  perks: string[];
  cons: string[];

  tags: CardTag[];
}

export const CHASE_CARDS: CreditCard[] = [
    {
      id: "chase-sapphire-preferred",
      name: "Chase Sapphire Preferred",
      issuer: "Chase",
      imageUrl: "/cards/chase-sapphire-preferred.png",
      annualFee: 95,
      requiresGoodCredit: true,
      hardPull: true,
      rewardProfile: {
        travel: 2,
        food: 3,
        misc: 1
      },
      perks: [
        "Flexible Ultimate Rewards points",
        "Strong travel transfer partners",
        "Primary rental car insurance"
      ],
      cons: ["Annual fee", "No premium travel perks"],
      tags: ["travel", "food"]
    },
  
    {
      id: "chase-sapphire-reserve",
      name: "Chase Sapphire Reserve",
      issuer: "Chase",
      imageUrl: "/cards/chase-sapphire-reserve.png",
      annualFee: 550,
      requiresGoodCredit: true,
      hardPull: true,
      rewardProfile: {
        travel: 3,
        food: 3,
        misc: 1
      },
      perks: [
        "Premium travel protections",
        "Airport lounge access",
        "High point redemption value"
      ],
      cons: ["Very high annual fee"],
      tags: ["travel", "premium"]
    },
  
    {
      id: "chase-freedom-unlimited",
      name: "Chase Freedom Unlimited",
      issuer: "Chase",
      imageUrl: "/cards/chase-freedom-unlimited.png",
      annualFee: 0,
      requiresGoodCredit: false,
      hardPull: true,
      rewardProfile: {
        food: 3,
        travel: 5,
        misc: 1.5
      },
      perks: ["No annual fee", "Great everyday catch-all card"],
      cons: ["No travel insurance on its own"],
      tags: ["cashback", "builder"]
    },
  
    {
      id: "chase-freedom-rise",
      name: "Chase Freedom Rise",
      issuer: "Chase",
      imageUrl: "/cards/chase-freedom-rise.png",
      annualFee: 0,
      requiresGoodCredit: false,
      hardPull: true,
      rewardProfile: {
        misc: 1.5
      },
      perks: ["Designed for new credit users", "Simple flat rewards"],
      cons: ["Low reward ceiling"],
      tags: ["builder", "student"]
    },
  
    {
      id: "ink-business-preferred",
      name: "Ink Business Preferred",
      issuer: "Chase",
      imageUrl: "/cards/ink-business-preferred.png",
      annualFee: 95,
      requiresGoodCredit: true,
      hardPull: true,
      rewardProfile: {
        travel: 3,
        misc: 1
      },
      perks: [
        "High signup bonus",
        "Business expense optimization"
      ],
      cons: ["Business-only eligibility"],
      tags: ["business", "travel"]
    }
  ];

  export const AMEX_CARDS: CreditCard[] = [
    {
      id: "amex-blue-cash-everyday",
      name: "Blue Cash Everyday",
      issuer: "Amex",
      imageUrl: "/cards/amex-blue-cash-everyday.png",
      annualFee: 0,
      requiresGoodCredit: false,
      hardPull: true,
      rewardProfile: {
        groceries: 3,
        gas: 3,
        misc: 1
      },
      perks: ["Strong everyday cashback", "No annual fee"],
      cons: ["Foreign transaction fees"],
      tags: ["cashback", "builder"]
    },
  
    {
      id: "amex-blue-cash-preferred",
      name: "Blue Cash Preferred",
      issuer: "Amex",
      imageUrl: "/cards/amex-blue-cash-preferred.png",
      annualFee: 95,
      requiresGoodCredit: true,
      hardPull: true,
      rewardProfile: {
        groceries: 6,
        gas: 3,
        misc: 1
      },
      perks: ["Extremely high grocery cashback"],
      cons: ["Annual fee"],
      tags: ["food", "cashback"]
    },
  
    {
      id: "amex-gold",
      name: "Amex Gold",
      issuer: "Amex",
      imageUrl: "/cards/amex-gold.png",
      annualFee: 250,
      requiresGoodCredit: true,
      hardPull: true,
      rewardProfile: {
        food: 4,
        groceries: 4,
        travel: 3
      },
      perks: ["Top-tier food rewards", "Dining credits"],
      cons: ["High annual fee", "Credits require effort"],
      tags: ["food", "travel"]
    },
  
    {
      id: "amex-platinum",
      name: "Amex Platinum",
      issuer: "Amex",
      imageUrl: "/cards/amex-platinum.png",
      annualFee: 695,
      requiresGoodCredit: true,
      hardPull: true,
      rewardProfile: {
        travel: 5
      },
      perks: [
        "Best-in-class travel perks",
        "Airport lounges",
        "Premium credits"
      ],
      cons: ["Very high annual fee", "Not an everyday spender card"],
      tags: ["premium", "travel"]
    },
  
    {
      id: "amex-green",
      name: "Amex Green",
      issuer: "Amex",
      imageUrl: "/cards/amex-green.png",
      annualFee: 150,
      requiresGoodCredit: true,
      hardPull: true,
      rewardProfile: {
        travel: 3,
        food: 3
      },
      perks: ["Flexible travel rewards"],
      cons: ["Overshadowed by Gold"],
      tags: ["travel"]
    },
  
    {
      id: "amex-blue-business-plus",
      name: "Blue Business Plus",
      issuer: "Amex",
      imageUrl: "/cards/amex-blue-business-plus.png",
      annualFee: 0,
      requiresGoodCredit: true,
      hardPull: true,
      rewardProfile: {
        misc: 2
      },
      perks: ["Flat 2x points", "No annual fee"],
      cons: ["Business-only"],
      tags: ["business"]
    }
  ];
  export const CAPONE_CARDS: CreditCard[] = [
    {
      id: "capone-venture-x",
      name: "Venture X",
      issuer: "Capital One",
      imageUrl: "/cards/venture-x.png",
      annualFee: 395,
      requiresGoodCredit: true,
      hardPull: true,
      rewardProfile: {
        travel: 5,
        misc: 2
      },
      perks: ["Excellent value premium card", "Lounge access"],
      cons: ["Annual fee"],
      tags: ["travel", "premium"]
    },
  
    {
      id: "capone-venture",
      name: "Venture",
      issuer: "Capital One",
      imageUrl: "/cards/venture.png",
      annualFee: 95,
      requiresGoodCredit: true,
      hardPull: true,
      rewardProfile: {
        misc: 2
      },
      perks: ["Simple flat rewards", "Travel flexibility"],
      cons: ["Lower upside than premium cards"],
      tags: ["travel"]
    },
  
    {
      id: "capone-savor",
      name: "Savor Cash Rewards",
      issuer: "Capital One",
      imageUrl: "/cards/savor.png",
      annualFee: 95,
      requiresGoodCredit: true,
      hardPull: true,
      rewardProfile: {
        food: 4,
        entertainment: 4,
        misc: 1
      },
      perks: ["Top food + entertainment cashback"],
      cons: ["Annual fee"],
      tags: ["food"]
    },
  
    {
      id: "capone-quicksilver",
      name: "Quicksilver Cash Rewards",
      issuer: "Capital One",
      imageUrl: "/cards/quicksilver.png",
      annualFee: 0,
      requiresGoodCredit: false,
      hardPull: true,
      rewardProfile: {
        misc: 1.5
      },
      perks: ["Simple flat cashback"],
      cons: ["No category bonuses"],
      tags: ["cashback", "builder"]
    },
  
    {
      id: "capone-savor-student",
      name: "Savor Student Cash Rewards",
      issuer: "Capital One",
      imageUrl: "/cards/savor-student.png",
      annualFee: 0,
      requiresGoodCredit: false,
      hardPull: true,
      rewardProfile: {
        food: 3,
        entertainment: 3,
        misc: 1
      },
      perks: ["Student-friendly", "Strong food rewards"],
      cons: ["Lower credit limits"],
      tags: ["student", "food"]
    }
  ];

  export const CARD_CATALOG: CreditCard[] = [
    ...CHASE_CARDS,
    ...AMEX_CARDS,
    ...CAPONE_CARDS
  ];