/** Maps roster display names → files under public/assets/marketing/client-logos/. */
export const CLIENT_LOGO_SRC_BY_NAME: Readonly<Record<string, string>> = {
  "Ambuja Neotia": "/assets/marketing/client-logos/AmbujaNeotia.png",
  "Annapurna Finance": "/assets/marketing/client-logos/AnnapurnaMicroFinance.jpg",
  "Bureau of Indian Standards": "/assets/marketing/client-logos/BIS.jpg",
  BIS: "/assets/marketing/client-logos/BIS.jpg",
  BSPHCL: "/assets/marketing/client-logos/BSPHCL.jpg",
  "Canara Bank": "/assets/marketing/client-logos/CanaraBank.jpg",
  "Corporation Bank": "/assets/marketing/client-logos/CorporationBank.jpg",
  "CRI Pumps": "/assets/marketing/client-logos/CRIPumps.jpg",
  "Customs and Central Excise": "/assets/marketing/client-logos/CustomsandCentralExcise.jpg",
  "D. Goenka School": "/assets/marketing/client-logos/GDGoenka.jpg",
  "Essel Utilities": "/assets/marketing/client-logos/EsselUtilities.jpg",
  "FHI 360": "/assets/marketing/client-logos/FHI360.png",
  "Franklin Templeton": "/assets/marketing/client-logos/FranklinTempleton.jpg",
  "Franklin Templeton Investments": "/assets/marketing/client-logos/FranklinTempleton.jpg",
  "Government of Bihar": "/assets/marketing/client-logos/BiharGovernment.jpg",
  "Bihar Government": "/assets/marketing/client-logos/BiharGovernment.jpg",
  HDFC: "/assets/marketing/client-logos/HDFCLogo.jpg",
  "HDFC Bank": "/assets/marketing/client-logos/HDFCLogo.jpg",
  Hyundai: "/assets/marketing/client-logos/HyundaiLogo.jpg",
  "IDBI Bank": "/assets/marketing/client-logos/IDBIBankLogo.png",
  "Income Tax Department": "/assets/marketing/client-logos/IncomeTaxdepartment.png",
  IndianOil: "/assets/marketing/client-logos/GOILogo.jpg",
  "Indian Oil": "/assets/marketing/client-logos/GOILogo.jpg",
  JSW: "/assets/marketing/client-logos/JSW.png",
  "L&T": "/assets/marketing/client-logos/LandT.png",
  "Larsen & Toubro": "/assets/marketing/client-logos/LandT.png",
  "Maruti Suzuki": "/assets/marketing/client-logos/MarutiSuzuki.png",
  MECON: "/assets/marketing/client-logos/MECON.jpg",
  "Paradeep Phosphates": "/assets/marketing/client-logos/ParadeepPhospates.jpg",
  SAIL: "/assets/marketing/client-logos/SAIL.png",
  Shriram: "/assets/marketing/client-logos/ShriramTransportFianance.png",
  "SITI Networks": "/assets/marketing/client-logos/SITICable.png",
  Sonalika: "/assets/marketing/client-logos/Sonalika.jpg",
  "Sonalika International": "/assets/marketing/client-logos/Sonalika.jpg",
  "Survey of India": "/assets/marketing/client-logos/SurveyofIndia.jpg",
  "Syndicate Bank": "/assets/marketing/client-logos/SyndicateBank.png",
  "Tata Motors": "/assets/marketing/client-logos/TataMotors.jpg",
  Titan: "/assets/marketing/client-logos/Titan.png",
  "Ujjivan Small Finance Bank": "/assets/marketing/client-logos/UjjivanBank.jpg",
  Usha: "/assets/marketing/client-logos/USHA.png",
  "Usha International": "/assets/marketing/client-logos/USHA.png",
  "United Bank of India": "/assets/marketing/client-logos/UnitedBankofIndia.png",
};

export function resolveClientLogoSrc(name: string, explicitSrc?: string): string | undefined {
  if (explicitSrc) {return explicitSrc;}
  const direct = CLIENT_LOGO_SRC_BY_NAME[name];
  if (direct) {return direct;}
  // Case-insensitive fallback
  const lower = name.trim().toLowerCase();
  for (const [key, src] of Object.entries(CLIENT_LOGO_SRC_BY_NAME)) {
    if (key.toLowerCase() === lower) {return src;}
  }
  return undefined;
}
