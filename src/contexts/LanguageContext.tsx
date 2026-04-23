import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "en" | "fi";

const translations = {
  en: {
    // Nav / Index
    signIn: "Sign In",
    getStarted: "Get Started",
    heroChip: "Digital menus for modern restaurants",
    heroTitle: "Your menu, one scan away",
    heroDesc: "Create beautiful digital menus with NFC and QR codes. Show allergens, calories, and dietary info. Update in real time.",
    startFree: "Start for free",
    featureQr: "QR & NFC Ready",
    featureQrDesc: "Customers scan to view your menu instantly on their phone.",
    featureMobile: "Mobile First",
    featureMobileDesc: "Beautiful, fast menus designed for every screen size.",
    featureRealtime: "Real-Time Updates",
    featureRealtimeDesc: "Change prices, items, or availability — reflected instantly.",
    footerText: "Digital menus made simple.",

    // Auth
    signInDesc: "Sign in to manage your menu",
    createAccount: "Create your restaurant account",
    verifyDesc: "Enter the verification code sent to your email",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    firstName: "First name",
    lastName: "Last name",
    restaurantName: "Restaurant name",
    yourPosition: "Your position at the restaurant",
    enterPosition: "Enter your position",
    signingIn: "Signing in...",
    creatingAccount: "Creating account...",
    verifying: "Verifying...",
    verifyEmail: "Verify Email",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    signUp: "Sign up",
    didntReceive: "Didn't receive the code?",
    goBack: "Go back",
    verificationSent: "Verification code sent!",
    checkEmail: "Check your email for the 6-digit code.",
    passwordsDontMatch: "Passwords don't match",
    passwordsMatchDesc: "Please make sure both passwords are identical.",
    weakPassword: "Weak password",
    weakPasswordDesc: "Must be 8+ characters with uppercase, lowercase, number, and special character.",
    verificationFailed: "Verification failed",
    error: "Error",

    // Dashboard
    viewMenu: "View menu →",
    setupTitle: "Set up your restaurant",
    setupDesc: "Give your restaurant a name to get started with your digital menu.",
    menuAvailableAt: "Your menu will be available at:",
    creating: "Creating...",
    createRestaurant: "Create Restaurant",
    restaurantBranding: "Restaurant Branding",
    logo: "Logo",
    coverPhoto: "Cover Photo",
    uploadCover: "Upload cover photo",
    categories: "Categories",
    newCategory: "New category",
    menuItems: "Menu Items",
    addItem: "Add Item",
    editItem: "Edit Item",
    addMenuItem: "Add Menu Item",
    noItemsYet: "No menu items yet. Add your first item!",
    uncategorized: "Uncategorized",
    loadingMenu: "Loading menu...",

    // Menu Item Form
    name: "Name",
    description: "Description",
    price: "Price",
    category: "Category",
    selectCategory: "Select category",
    calories: "Calories",
    proteinG: "Protein (g)",
    photo: "Photo",
    allergens: "Allergens",
    dietaryTags: "Dietary Tags",
    available: "Available",
    saving: "Saving...",
    update: "Update",
    cancel: "Cancel",

    // Customer menu
    menuNotFound: "Menu not found",
    restaurantNotExist: "This restaurant doesn't exist.",
    noMatchFilters: "No items match your filters.",
    noMenuItems: "No menu items yet.",
    discoverMore: "Explore other menus on Tapli",
    filters: "Filters",
    clear: "Clear",
    excludeAllergens: "Exclude allergens",
    dietaryPreference: "Dietary preference",
    caloriesRange: "Calories",
    kcal: "kcal",
    protein: "protein",

    // Food style chips
    highProtein: "High Protein",
    highCarb: "High Carb",
    highFatKeto: "High Fat / Keto",
    lowCalorie: "Low Calorie",
    highEnergy: "High Energy",
    plantBased: "Plant Based",

    // Roles
    owner: "Owner",
    generalManager: "General Manager",
    headChef: "Head Chef",
    sousChef: "Sous Chef",
    floorManager: "Floor Manager",
    marketingManager: "Marketing Manager",
    operationsManager: "Operations Manager",
    other: "Other",
  },
  fi: {
    // Nav / Index
    signIn: "Kirjaudu",
    getStarted: "Aloita",
    heroChip: "Digitaaliset ruokalistat moderneille ravintoloille",
    heroTitle: "Ruokalistasi, yhden skannauksen päässä",
    heroDesc: "Luo kauniita digitaalisia ruokalistoja NFC- ja QR-koodeilla. Näytä allergeenit, kalorit ja ruokavaliotiedot. Päivitä reaaliajassa.",
    startFree: "Aloita ilmaiseksi",
    featureQr: "QR & NFC -valmis",
    featureQrDesc: "Asiakkaat skannaavat nähdäkseen ruokalistasi heti puhelimellaan.",
    featureMobile: "Mobiili ensin",
    featureMobileDesc: "Kauniit, nopeat ruokalistat jokaiselle näytölle.",
    featureRealtime: "Reaaliaikaiset päivitykset",
    featureRealtimeDesc: "Muuta hintoja, tuotteita tai saatavuutta — näkyy heti.",
    footerText: "Digitaaliset ruokalistat yksinkertaisesti.",

    // Auth
    signInDesc: "Kirjaudu hallitaksesi ruokalistaasi",
    createAccount: "Luo ravintolasi tili",
    verifyDesc: "Syötä sähköpostiisi lähetetty vahvistuskoodi",
    email: "Sähköposti",
    password: "Salasana",
    confirmPassword: "Vahvista salasana",
    firstName: "Etunimi",
    lastName: "Sukunimi",
    restaurantName: "Ravintolan nimi",
    yourPosition: "Asemasi ravintolassa",
    enterPosition: "Syötä asemasi",
    signingIn: "Kirjaudutaan...",
    creatingAccount: "Luodaan tiliä...",
    verifying: "Vahvistetaan...",
    verifyEmail: "Vahvista sähköposti",
    noAccount: "Eikö sinulla ole tiliä?",
    haveAccount: "Onko sinulla jo tili?",
    signUp: "Rekisteröidy",
    didntReceive: "Etkö saanut koodia?",
    goBack: "Palaa takaisin",
    verificationSent: "Vahvistuskoodi lähetetty!",
    checkEmail: "Tarkista sähköpostisi 6-numeroinen koodi.",
    passwordsDontMatch: "Salasanat eivät täsmää",
    passwordsMatchDesc: "Varmista, että molemmat salasanat ovat samat.",
    weakPassword: "Heikko salasana",
    weakPasswordDesc: "Vähintään 8 merkkiä: iso kirjain, pieni kirjain, numero ja erikoismerkki.",
    verificationFailed: "Vahvistus epäonnistui",
    error: "Virhe",

    // Dashboard
    viewMenu: "Näytä ruokalista →",
    setupTitle: "Määritä ravintolasi",
    setupDesc: "Anna ravintolallesi nimi aloittaaksesi digitaalisen ruokalistan.",
    menuAvailableAt: "Ruokalistasi on saatavilla osoitteessa:",
    creating: "Luodaan...",
    createRestaurant: "Luo ravintola",
    restaurantBranding: "Ravintolan brändi",
    logo: "Logo",
    coverPhoto: "Kansikuva",
    uploadCover: "Lataa kansikuva",
    categories: "Kategoriat",
    newCategory: "Uusi kategoria",
    menuItems: "Ruokalistan tuotteet",
    addItem: "Lisää tuote",
    editItem: "Muokkaa tuotetta",
    addMenuItem: "Lisää ruokalistan tuote",
    noItemsYet: "Ei tuotteita vielä. Lisää ensimmäinen!",
    uncategorized: "Luokittelematon",
    loadingMenu: "Ladataan ruokalistaa...",

    // Menu Item Form
    name: "Nimi",
    description: "Kuvaus",
    price: "Hinta",
    category: "Kategoria",
    selectCategory: "Valitse kategoria",
    calories: "Kalorit",
    proteinG: "Proteiini (g)",
    photo: "Kuva",
    allergens: "Allergeenit",
    dietaryTags: "Ruokavaliot",
    available: "Saatavilla",
    saving: "Tallennetaan...",
    update: "Päivitä",
    cancel: "Peruuta",

    // Customer menu
    menuNotFound: "Ruokalistaa ei löydy",
    restaurantNotExist: "Tätä ravintolaa ei ole olemassa.",
    noMatchFilters: "Yksikään tuote ei vastaa suodattimiasi.",
    noMenuItems: "Ei ruokalistan tuotteita vielä.",
    discoverMore: "Tutustu muihin Tapli-ravintoloihin",
    filters: "Suodattimet",
    clear: "Tyhjennä",
    excludeAllergens: "Sulje pois allergeenit",
    dietaryPreference: "Ruokavalio",
    caloriesRange: "Kalorit",
    kcal: "kcal",
    protein: "proteiini",

    // Food style chips
    highProtein: "Runsas proteiini",
    highCarb: "Runsas hiilihydraatti",
    highFatKeto: "Runsas rasva / Keto",
    lowCalorie: "Vähäkalorinen",
    highEnergy: "Runsas energia",
    plantBased: "Kasvisruoka",

    // Roles
    owner: "Omistaja",
    generalManager: "Ravintolapäällikkö",
    headChef: "Keittiömestari",
    sousChef: "Vuorokokki",
    floorManager: "Salinjohtaja",
    marketingManager: "Markkinointipäällikkö",
    operationsManager: "Toimintapäällikkö",
    other: "Muu",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("tapli-lang") as Language) || "en";
    }
    return "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("tapli-lang", lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}