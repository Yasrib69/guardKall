// Verification questions organized by organization type
// These questions are designed to trip up scammers while being reasonable for real employees

// Real-world organizational data sourced for "Telli-Style" web lookup verification
export const ORG_INTEL: Record<string, any> = {
    bank: {
        official_name: "Chase Bank",
        official_callbacks: ["1-800-935-9935", "1-888-745-0091", "1-800-955-9060"],
        protocols: [
            "Will never ask for your full SSN verbally",
            "Will never ask you to move money to 'protect' it",
            "Will never ask for a one-time passcode (OTP) over the phone"
        ]
    },
    government: {
        official_name: "IRS (Internal Revenue Service)",
        official_callbacks: ["1-800-829-1040", "1-800-830-5084"],
        protocols: [
            "Always initiates contact via regular mail, never first-time phone calls",
            "Never demands payment via gift cards, wire transfer, or crypto",
            "Does not threaten immediate arrest by local police"
        ]
    },
    tech_support: {
        official_name: "Amazon / Microsoft Support",
        official_callbacks: ["1-888-280-4331"],
        protocols: [
            "Does not call unexpectedly about 'suspicious activity' on your account",
            "Will never ask for remote access to your computer to 'fix' a virus",
            "Customer must usually initiate contact for a callback"
        ]
    }
};

export const VERIFICATION_QUESTIONS: Record<string, string[]> = {
    bank: [
        "If you're from Chase, why aren't you calling from 1-800-935-9935?",
        "My app says the fraud department extension is 4 digits. What is your direct 4-digit ID?",
        "Will you be sending me a secure message in my Chase mobile inbox to verify this call?",
        "What department do you work in - fraud prevention, accounts, or loans?",
        "I'd like to verify this call by calling the number on the back of my card. What is the extension I should ask for?",
    ],

    government: [
        "The IRS website says they always send a letter first. Can you give me the notice number of the letter you sent?",
        "What's your government employee badge number?",
        "Which IRS office location are you calling from - Memphis, Ogden, or Brookhaven?",
        "If I call the main 1-800-829-1040 line, will they be able to find your badge number?",
        "Why is the IRS calling me instead of sending a deputy or an official notice?",
    ],

    tech_support: [
        "Amazon's policy is to notify via the app first. Why isn't there a notification on my account?",
        "What's the support ticket or case number for this 'security issue'?",
        "If I hang up and request a callback through the Amazon app, will I get you specifically?",
        "Which specific device did you detect the issue on - my iPhone, my PC, or my Tablet?",
        "What company are you calling from exactly? Is it Amazon, or a third-party partner?",
    ],

    police: [
        "Which precinct or station are you calling from?",
        "What's your badge number, officer?",
        "What's the case or report number?",
        "Who is the duty sergeant I could verify this with?",
        "Can I call back the station's main number to confirm?",
    ],

    utility: [
        "Which utility company are you calling from - gas, electric, or water?",
        "What's my account number on your records?",
        "What's your employee ID?",
        "What's the official callback number for your company?",
        "When is my next bill due date?",
    ],

    unknown: [
        "I'm sorry, what company did you say you're calling from?",
        "What's your name and employee ID?",
        "What's the callback number for your office?",
        "Can you spell your full name for me?",
        "What is the reason for this call?",
    ],
};

// Red flag responses that indicate likely scammer behavior
export const RED_FLAG_PATTERNS = [
    "refuses to give ID",
    "refuses callback",
    "gets angry when asked for verification",
    "pressures urgency",
    "threatens consequences",
    "demands immediate action",
    "wants gift cards",
    "wants wire transfer",
    "wants bitcoin or crypto",
    "asks for password",
    "asks for SSN",
    "asks for OTP or verification code",
];

// Scoring weights for response analysis
export const SCORING_WEIGHTS = {
    REFUSES_ID: -30,
    REFUSES_CALLBACK: -40,
    VAGUE_DEPARTMENT: -10,
    GIVES_SPECIFIC_ID: +20,
    AGREES_TO_CALLBACK: +30,
    PRESSURES_URGENCY: -25,
    THREATENS: -35,
    ASKS_FOR_PAYMENT: -40,
    ASKS_FOR_SENSITIVE_INFO: -50,
};

// Get questions for a specific org type
export function getQuestionsForOrg(orgType: string): string[] {
    return VERIFICATION_QUESTIONS[orgType] || VERIFICATION_QUESTIONS.unknown;
}

// Get a random subset of questions (to keep calls shorter)
export function getRandomQuestions(orgType: string, count: number = 3): string[] {
    const questions = getQuestionsForOrg(orgType);
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
