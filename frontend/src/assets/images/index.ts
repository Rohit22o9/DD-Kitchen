import dailyDropLogo from './daily_drop_logo.png';
import dailyDropLogoWhite from './daily_drop_logo_white.png';

// Appliance images (preserved for Certified Facilities & Commercial Appliances section)
import applianceHero from './hero_kitchen.jpg';
import appliancePrep from './prep_station.jpg';
import applianceRange from './cooking_range.jpg';
import applianceStorage from './cold_storage.jpg';

// Actual Daily Drop Commercial Kitchen Photos
import actualHero from '../kitchen_actual/IMG_0798.jpg';
import actualCookline from '../kitchen_actual/IMG_0792.jpg';
import actualPrep from '../kitchen_actual/IMG_0793.jpg';
import actualFacility from '../kitchen_actual/IMG_0794.jpg';
import actualPrepAngle from '../kitchen_actual/IMG_0797.jpg';
import actualRange from '../kitchen_actual/IMG_0799.jpg';
import actualWash from '../kitchen_actual/IMG_0805.jpg';
import actualStorage from '../kitchen_actual/IMG_0806.jpg';

export const Images = {
  logo: dailyDropLogo,
  logoWhite: dailyDropLogoWhite,

  // Appliances images kept as-is for Certified Facilities section
  hero: applianceHero,
  prepStation: appliancePrep,
  cookingRange: applianceRange,
  coldStorage: applianceStorage,

  // Actual kitchen photos for Hero, OurKitchen, and WhyChoose sections
  actual: {
    hero: actualHero,
    cookline: actualCookline,
    prep: actualPrep,
    facility: actualFacility,
    prepAngle: actualPrepAngle,
    range: actualRange,
    wash: actualWash,
    storage: actualStorage,
    slideshow: [
      actualHero,
      actualCookline,
      actualFacility,
      actualPrep,
    ],
  },
};
