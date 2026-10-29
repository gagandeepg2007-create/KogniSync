export interface ExploreDestination {
  id: string;
  name: string;
  origin: string;
  destination: string;
  category: string;
  tag: 'weekend' | 'budget2k' | 'budget5k' | 'beaches' | 'mountains' | 'heritage' | 'adventure' | 'food';
  image: string;
  startingPrice: number;
  duration: string;
  modes: ('flight' | 'train' | 'bus' | 'cab')[];
  description?: string;
}

export interface CuratedJourney {
  id: string;
  title: string;
  origin: string;
  destination: string;
  route: string;
  modesText: string;
  modes: ('flight' | 'train' | 'bus' | 'cab')[];
  duration: string;
  price: number;
  badge: string;
  badgeType: 'value' | 'fastest' | 'scenic';
  description: string;
  image: string;
}

export interface MoodCategory {
  id: string;
  name: string;
  iconName: 'waves' | 'mountain' | 'landmark' | 'leaf' | 'zap' | 'utensils';
  image: string;
  tag: string;
  accentBg: string;
  accentText: string;
  origin: string;
  destination: string;
}

export interface SmartTip {
  id: string;
  title: string;
  description: string;
  type: 'save' | 'time' | 'green';
}

export const DISCOVERY_CHIPS = [
  { id: 'all', label: 'Weekend Getaways' },
  { id: 'budget2k', label: 'Under ₹2,000' },
  { id: 'budget5k', label: 'Under ₹5,000' },
  { id: 'beaches', label: 'Beaches' },
  { id: 'mountains', label: 'Mountains' },
  { id: 'heritage', label: 'Heritage' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'food', label: 'Food & Culture' },
] as const;

export const POPULAR_DESTINATIONS: ExploreDestination[] = [
  {
    id: 'dest-coorg',
    name: 'Coorg',
    origin: 'Bangalore',
    destination: 'Coorg',
    category: 'Weekend escape',
    tag: 'weekend',
    image: '/images/explore/coorg.jpg',
    startingPrice: 1499,
    duration: '~ 5h',
    modes: ['bus', 'cab'],
    description: 'Misty hills, lush coffee plantations and roaring waterfalls in Karnataka.',
  },
  {
    id: 'dest-mysore',
    name: 'Mysore',
    origin: 'Bangalore',
    destination: 'Mysore',
    category: 'Culture & heritage',
    tag: 'heritage',
    image: '/images/explore/mysore.jpg',
    startingPrice: 899,
    duration: '~ 3h',
    modes: ['train', 'cab'],
    description: 'Regal palaces, rich silk heritage and magnificent sandalwood aromas.',
  },
  {
    id: 'dest-goa',
    name: 'Goa',
    origin: 'Bangalore',
    destination: 'Goa',
    category: 'Beach getaway',
    tag: 'beaches',
    image: '/images/explore/goa-popular.jpg',
    startingPrice: 2499,
    duration: '~ 10h',
    modes: ['flight', 'train', 'bus'],
    description: 'Golden sandy shores, vibrant coastal culture, and endless Arabian Sea sunsets.',
  },
  {
    id: 'dest-chennai',
    name: 'Chennai',
    origin: 'Bangalore',
    destination: 'Chennai',
    category: 'City escape',
    tag: 'food',
    image: '/images/explore/chennai-popular.jpg',
    startingPrice: 1299,
    duration: '~ 6h',
    modes: ['train', 'bus'],
    description: 'Historic Dravidian temples, Marina beach promenade, and South Indian coffee.',
  },
];

export const CURATED_JOURNEYS: CuratedJourney[] = [
  {
    id: 'curated-weekend-escape',
    title: 'The Weekend Escape',
    origin: 'Bangalore',
    destination: 'Coorg',
    route: 'Bangalore → Coorg',
    modesText: 'Bus → Cab',
    modes: ['bus', 'cab'],
    duration: '5h 20m',
    price: 1850,
    badge: 'Best Value',
    badgeType: 'value',
    description: 'A balanced weekend route optimized for cost and convenience.',
    image: '/images/explore/curated-bus.jpg',
  },
  {
    id: 'curated-fast-escape',
    title: 'The Fast Escape',
    origin: 'Bangalore',
    destination: 'Goa',
    route: 'Bangalore → Goa',
    modesText: 'Flight → Cab',
    modes: ['flight', 'cab'],
    duration: '3h 15m',
    price: 4950,
    badge: 'Fastest',
    badgeType: 'fastest',
    description: 'Reach the coast quickly with a comfortable flight and seamless transfers.',
    image: '/images/explore/curated-flight.jpg',
  },
  {
    id: 'curated-scenic-route',
    title: 'The Scenic Route',
    origin: 'Bangalore',
    destination: 'Coorg',
    route: 'Bangalore → Mysore → Coorg',
    modesText: 'Train → Cab',
    modes: ['train', 'cab'],
    duration: '6h 40m',
    price: 2100,
    badge: 'Most Scenic',
    badgeType: 'scenic',
    description: 'A beautiful rail journey through the Western Ghats with a scenic drive.',
    image: '/images/explore/curated-train.jpg',
  },
];

export const MOOD_CATEGORIES: MoodCategory[] = [
  {
    id: 'mood-beach',
    name: 'Beach escapes',
    iconName: 'waves',
    image: '/images/explore/mood-beach.jpg',
    tag: 'beaches',
    accentBg: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
    accentText: 'text-cyan-200',
    origin: 'Bangalore',
    destination: 'Goa',
  },
  {
    id: 'mood-mountains',
    name: 'Mountain retreats',
    iconName: 'mountain',
    image: '/images/explore/mood-mountains.jpg',
    tag: 'mountains',
    accentBg: 'bg-blue-500/20 text-blue-200 border-blue-400/40',
    accentText: 'text-blue-200',
    origin: 'Bangalore',
    destination: 'Ooty',
  },
  {
    id: 'mood-heritage',
    name: 'Heritage & culture',
    iconName: 'landmark',
    image: '/images/explore/mood-heritage.jpg',
    tag: 'heritage',
    accentBg: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    accentText: 'text-amber-200',
    origin: 'Bangalore',
    destination: 'Hampi',
  },
  {
    id: 'mood-nature',
    name: 'Nature & wellness',
    iconName: 'leaf',
    image: '/images/explore/mood-nature.jpg',
    tag: 'mountains',
    accentBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    accentText: 'text-emerald-200',
    origin: 'Bangalore',
    destination: 'Wayanad',
  },
  {
    id: 'mood-adventure',
    name: 'Adventure',
    iconName: 'zap',
    image: '/images/explore/mood-adventure.jpg',
    tag: 'adventure',
    accentBg: 'bg-orange-500/20 text-orange-200 border-orange-400/40',
    accentText: 'text-orange-200',
    origin: 'Bangalore',
    destination: 'Dandeli',
  },
  {
    id: 'mood-food',
    name: 'Food & city life',
    iconName: 'utensils',
    image: '/images/explore/mood-food.jpg',
    tag: 'food',
    accentBg: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    accentText: 'text-amber-200',
    origin: 'Bangalore',
    destination: 'Hyderabad',
  },
];

export const SMART_TIPS: SmartTip[] = [
  {
    id: 'tip-save',
    title: 'Save more',
    description: 'Compare complete journeys instead of individual tickets.',
    type: 'save',
  },
  {
    id: 'tip-time',
    title: 'Save time',
    description: 'KogniSync synchronizes transfers across multiple transport modes.',
    type: 'time',
  },
  {
    id: 'tip-green',
    title: 'Travel greener',
    description: 'Discover lower-carbon alternatives without manually comparing every route.',
    type: 'green',
  },
];

