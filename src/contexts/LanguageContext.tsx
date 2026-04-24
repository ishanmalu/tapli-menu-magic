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
    errorLoadingMenu: "Error loading menu",
    uploadError: "Upload error",

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

    // Pricing & Upgrade
    pricing: "Pricing",
    pricingTitle: "Simple, transparent pricing",
    pricingSubtitle: "Choose the plan that fits your restaurant. Switch or cancel anytime.",
    freeTrialNote: "All plans include a 14-day free trial. No credit card required.",
    planMonthly: "Monthly",
    planQuarterly: "Quarterly",
    planAnnual: "Annual",
    perMonth: "/month",
    billedMonthly: "Billed monthly",
    billedQuarterly: "Billed €87 every 3 months",
    billedAnnually: "Billed €300 per year",
    save17: "Save 17%",
    save29: "Save 29%",
    mostPopular: "Most Popular",
    startFreeTrial: "Start Free Trial",
    subscribeNow: "Subscribe Now",
    upgradeTitle: "Upgrade your plan",
    upgradeSubtitle: "Pick a plan to keep using Tapli without interruption.",
    // Monthly features
    feat1Menu: "1 menu",
    feat50Items: "Up to 50 menu items",
    featQrNfc: "QR & NFC support",
    featAllergenInfo: "Allergen & dietary info",
    featPhotoUploads: "Photo uploads",
    featBilingual: "Finnish & English support",
    featRealtimeUpdates: "Real-time updates",
    featCustomColours: "Custom menu colours",
    // Quarterly extra features
    feat3Menus: "Up to 3 menus",
    featUnlimitedItems: "Unlimited menu items",
    featItemBadges: "Menu item badges (New, Chef's Pick)",
    featAnalytics: "Analytics & view counts",
    featPdfExport: "PDF menu export",
    featPrioritySupport: "Priority support",
    // Annual extra features
    featExtraLanguages: "Extra languages (Swedish, Estonian, Russian)",
    featUnlimitedMenus: "Unlimited menus",
    featTimedMenus: "Time-based menus (lunch/dinner)",
    featCustomQr: "Custom QR code with restaurant logo",
    featOnboarding: "Onboarding call",
    featAccountManager: "Dedicated account manager",

    // 404 page
    pageNotFound: "Page not found",
    pageNotFoundDesc: "Oops! The page you're looking for doesn't exist.",
    returnHome: "Return to Home",

    // Accessibility alt text
    logoAlt: "Restaurant logo",
    coverAlt: "Restaurant cover photo",

    // Category name translations (English DB names → display name)
    catOffers: "Offers",
    catAppetizers: "Appetizers",
    catSaladSoup: "Salad & Soup",
    catPastaRisotto: "Pasta & Risotto",
    catPizzaLasagne: "Pizza & Lasagne",
    catForKids: "For Kids",
    catVegan: "Vegan",
    catDesserts: "Desserts",
    catDrinks: "Drinks",
    catAlcohol: "Alcohol",

    // Menu item form section headers
    freeFrom: "Free From",
    dietaryAndLifestyle: "Dietary & Lifestyle",

    // Free From allergen tags (item is free from this allergen)
    tagGlutenFree: "Gluten-free",
    tagDairyFree: "Dairy-free",
    tagEggFree: "Egg-free",
    tagFishFree: "Fish-free",
    tagPeanutFree: "Peanut-free",
    tagNutFree: "Nut-free",
    tagSoyFree: "Soy-free",
    tagShellfishFree: "Shellfish-free",
    tagSesameFree: "Sesame-free",
    tagCeleryFree: "Celery-free",
    tagMustardFree: "Mustard-free",
    tagSulphiteFree: "Sulphite-free",
    tagLupinFree: "Lupin-free",
    tagMolluscrFree: "Mollusc-free",

    // Dietary & lifestyle tags
    tagVegan: "Vegan",
    tagVegetarian: "Vegetarian",
    tagLactoseFree: "Lactose-free",
    tagPlantBased: "Plant-based",
    tagLowCarb: "Low-carb",
    tagKeto: "Keto",
    tagHighProtein: "High-protein",
    tagNoAddedSugar: "No added sugar",
    tagLowCalorie: "Low-calorie",
    tagHalal: "Halal",
    tagKosher: "Kosher",
    tagNoPork: "No pork",
    tagNoAlcohol: "No alcohol",
    tagNoBeef: "No beef",
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
    errorLoadingMenu: "Virhe ruokalistan lataamisessa",
    uploadError: "Latausvirhe",

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
    highProtein: "Proteiinipitoinen",
    highCarb: "Hiilihydraattipitoinen",
    highFatKeto: "Rasvapitoinen / Keto",
    lowCalorie: "Vähäkalorinen",
    highEnergy: "Energiapitoinen",
    plantBased: "Kasvispohjainen",

    // Roles
    owner: "Omistaja",
    generalManager: "Ravintolapäällikkö",
    headChef: "Keittiömestari",
    sousChef: "Vuorokokki",
    floorManager: "Salinjohtaja",
    marketingManager: "Markkinointipäällikkö",
    operationsManager: "Toimintapäällikkö",
    other: "Muu",

    // Pricing & Upgrade
    pricing: "Hinnoittelu",
    pricingTitle: "Yksinkertainen, läpinäkyvä hinnoittelu",
    pricingSubtitle: "Valitse ravintolaasi sopiva paketti. Vaihda tai peruuta milloin tahansa.",
    freeTrialNote: "Kaikki paketit sisältävät 14 päivän ilmaisen kokeilujakson. Luottokorttia ei tarvita.",
    planMonthly: "Kuukausittain",
    planQuarterly: "Neljännesvuosittain",
    planAnnual: "Vuosittain",
    perMonth: "/kk",
    billedMonthly: "Laskutetaan kuukausittain",
    billedQuarterly: "Laskutetaan 87 € joka 3. kuukausi",
    billedAnnually: "Laskutetaan 300 € vuodessa",
    save17: "Säästä 17 %",
    save29: "Säästä 29 %",
    mostPopular: "Suosituin",
    startFreeTrial: "Aloita ilmainen kokeilu",
    subscribeNow: "Tilaa nyt",
    upgradeTitle: "Päivitä pakettisi",
    upgradeSubtitle: "Valitse paketti jatkaaksesi Taplin käyttöä keskeytyksettä.",
    // Monthly features
    feat1Menu: "1 ruokalista",
    feat50Items: "Enintään 50 tuotetta",
    featQrNfc: "QR- ja NFC-tuki",
    featAllergenInfo: "Allergeeni- ja ruokavaliotiedot",
    featPhotoUploads: "Kuvien lataus",
    featBilingual: "Suomi- ja englanninkielinen tuki",
    featRealtimeUpdates: "Reaaliaikaiset päivitykset",
    featCustomColours: "Mukautetut ruokalistan värit",
    // Quarterly extra features
    feat3Menus: "Enintään 3 ruokalistaa",
    featUnlimitedItems: "Rajattomasti tuotteita",
    featItemBadges: "Tuotebadget (Uusi, Kokin suosikki)",
    featAnalytics: "Analytiikka ja katselukerrat",
    featPdfExport: "PDF-ruokalistan vienti",
    featPrioritySupport: "Prioriteettituki",
    // Annual extra features
    featExtraLanguages: "Lisäkielet (ruotsi, viro, venäjä)",
    featUnlimitedMenus: "Rajattomasti ruokalistoja",
    featTimedMenus: "Aikaperusteiset ruokalistat (lounas/illallinen)",
    featCustomQr: "Mukautettu QR-koodi ravintolan logolla",
    featOnboarding: "Käyttöönottosoitto",
    featAccountManager: "Oma asiakasvastaava",

    // 404 page
    pageNotFound: "Sivua ei löydy",
    pageNotFoundDesc: "Hups! Etsimääsi sivua ei ole olemassa.",
    returnHome: "Palaa etusivulle",

    // Accessibility alt text
    logoAlt: "Ravintolan logo",
    coverAlt: "Ravintolan kansikuva",

    // Category name translations (English DB names → Finnish display name)
    catOffers: "Tarjoukset",
    catAppetizers: "Alkupalat",
    catSaladSoup: "Salaatti & Keitto",
    catPastaRisotto: "Pasta & Risotto",
    catPizzaLasagne: "Pizza & Lasagne",
    catForKids: "Lapsille",
    catVegan: "Vegaani",
    catDesserts: "Jälkiruoat",
    catDrinks: "Juomat",
    catAlcohol: "Alkoholi",

    // Menu item form section headers
    freeFrom: "Ei sisällä",
    dietaryAndLifestyle: "Ruokavalio ja elämäntapa",

    // Free From allergen tags — "vapaa ainesosista" style Finnish
    tagGlutenFree: "Gluteeniton",
    tagDairyFree: "Maidoton",
    tagEggFree: "Kananmunaton",
    tagFishFree: "Kalaton",
    tagPeanutFree: "Maapähkinätön",
    tagNutFree: "Pähkinätön",
    tagSoyFree: "Soijaton",
    tagShellfishFree: "Äyriäistön",
    tagSesameFree: "Seesaminsiemenetön",
    tagCeleryFree: "Selleritön",
    tagMustardFree: "Sinappiton",
    tagSulphiteFree: "Sulfiititon",
    tagLupinFree: "Lupiiniton",
    tagMolluscrFree: "Nilviäistön",

    // Dietary & lifestyle tags
    tagVegan: "Vegaaninen",
    tagVegetarian: "Kasvisruoka",
    tagLactoseFree: "Laktoositon",
    tagPlantBased: "Kasvipohjainen",
    tagLowCarb: "Vähähiilihydraattinen",
    tagKeto: "Keto",
    tagHighProtein: "Runsasproteiininen",
    tagNoAddedSugar: "Ei lisättyä sokeria",
    tagLowCalorie: "Vähäkalorinen",
    tagHalal: "Halal",
    tagKosher: "Kosher",
    tagNoPork: "Ei sianlihaa",
    tagNoAlcohol: "Ei alkoholia",
    tagNoBeef: "Ei naudanlihaa",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

// Maps English DB category names to their translation key
const CATEGORY_KEY_MAP: Record<string, TranslationKey> = {
  "Offers": "catOffers",
  "Appetizers": "catAppetizers",
  "Salad & Soup": "catSaladSoup",
  "Pasta & Risotto": "catPastaRisotto",
  "Pizza & Lasagne": "catPizzaLasagne",
  "For Kids": "catForKids",
  "Vegan": "catVegan",
  "Desserts": "catDesserts",
  "Drinks": "catDrinks",
  "Alcohol": "catAlcohol",
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  tCategory: (name: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
  tCategory: (name) => name,
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

  // Translates a category name stored in the DB (always Finnish) to the current language
  const tCategory = (name: string): string => {
    const key = CATEGORY_KEY_MAP[name];
    return key ? t(key) : name;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tCategory }}>
      {children}
    </LanguageContext.Provider>
  );
}