/**
 * Photos from Unsplash (https://unsplash.com/license: free to use, no
 * permission needed). Alt text describes what is actually in each photo;
 * none of them shows a specific Australian venue or player.
 */
const unsplash = (id: string, alt: string) => ({
  url: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`,
  alt,
});

export const images = {
  // Rugby
  stadium: unsplash(
    '1529663297269-6d349ec39b57',
    'Rugby goal posts in a full stadium',
  ),
  stadiumStands: unsplash(
    '1767190937750-d6aaf8ea99d0',
    'Rugby stadium with goalposts and spectators in the stands',
  ),
  stadiumNight: unsplash(
    '1763854413165-1713bc5a7f4a',
    'Stadium full of spectators during a night game',
  ),
  stadiumSunny: unsplash(
    '1747200582045-ac3830336aaa',
    'Green rugby field in a sunny stadium',
  ),
  stadiumSeats: unsplash(
    '1747200582566-e4b9c1d229fa',
    'Stadium with goalposts and colourful seats',
  ),
  stadiumEmpty: unsplash(
    '1767190937767-27d584aedc40',
    'Empty stadium with a bright green field and a light tower',
  ),
  scrum: unsplash(
    '1480099225005-2513c8947aec',
    'Two packs of forwards in a scrum',
  ),
  tackle: unsplash(
    '1574618471715-61c6b64aaf31',
    'Players contesting the ball during a match',
  ),
  match: unsplash('1512299286776-c18be8ed6a1a', 'Two teams playing rugby'),
  breakaway: unsplash(
    '1485426337939-af69cf101909',
    'Five players chasing play during a match',
  ),
  pass: unsplash(
    '1779488388336-8b54e9284b02',
    'A player throws the ball on a green field',
  ),
  celebration: unsplash(
    '1574602904316-f84f62477265',
    'A rugby team celebrating together on the field',
  ),
  carry: unsplash('1558151507-c1aa3d917dbb', 'A player holding a rugby ball'),
  womenPlaying: unsplash(
    '1496224027003-38fc92be458c',
    'Black and white photo of women playing rugby',
  ),
  womenJerseys: unsplash('1534583000938-a375b825ea16', "Women's rugby jerseys"),
  ball: unsplash(
    '1676972523246-2ff4125551fb',
    'Close-up of a rugby ball on the grass',
  ),
  ballField: unsplash(
    '1698746019802-ec43b1b0db29',
    'A rugby ball on a green field',
  ),
  ballFieldClose: unsplash(
    '1709501602359-bc7c8ab95061',
    'Close-up of a rugby ball on a field',
  ),
  ballLeaves: unsplash(
    '1604689370687-930b15f59a79',
    'A rugby ball lying among autumn leaves',
  ),
  ballMorning: unsplash(
    '1686828601235-24f8dbfde37e',
    'A rugby ball resting on a lush field',
  ),
  // Cities
  sydneyHarbour: unsplash(
    '1624138784614-87fd1b6528f8',
    'Sydney Opera House beside the harbour',
  ),
  sydneyAerial: unsplash(
    '1546268060-2592ff93ee24',
    'Aerial view of Sydney Harbour Bridge and the Opera House',
  ),
  brisbaneSkyline: unsplash(
    '1566734904496-9309bb1798ae',
    'Brisbane city skyline under a clear sky',
  ),
  brisbaneRiver: unsplash(
    '1548661625-a30d197ce439',
    'Brisbane high-rise buildings beside the river',
  ),
  brisbaneBridge: unsplash(
    '1789758489987-bb2375d4b1bb',
    'The Story Bridge in Brisbane lit up at night',
  ),
  canberraCity: unsplash(
    '1570587371524-a187051b1b31',
    'Canberra cityscape in daylight',
  ),
  canberraLake: unsplash(
    '1773821023994-bffda5c96617',
    'Canberra lake with Parliament House in the distance',
  ),
  canberraBalloons: unsplash(
    '1528415187930-56a01a88be1a',
    'Hot air balloons over Canberra',
  ),
  perthCity: unsplash(
    '1524586410818-196d249560e4',
    'Perth city beside the Swan River',
  ),
  perthAerial: unsplash(
    '1606453338613-bcf41ddb9d50',
    'Aerial view of Perth city buildings by the water',
  ),
  melbourneSkyline: unsplash(
    '1595434971780-79d5c20c5090',
    'Melbourne city skyline',
  ),
  melbourneBridge: unsplash(
    '1545044846-351ba102b6d5',
    'A bridge across the river in Melbourne',
  ),
  adelaideStadium: unsplash(
    '1757477856875-43d0d7728ce4',
    'Adelaide stadium beside the river on a sunny day',
  ),
  adelaideCity: unsplash(
    '1720485757241-0402b031ec42',
    'An Adelaide city street lined with buildings',
  ),
  hobartHarbour: unsplash(
    '1728555429641-391c49d9754a',
    'Boats in Hobart harbour under a cloudy sky',
  ),
  hobartAerial: unsplash('1582539934730-cdf1770948d2', 'Aerial view of Hobart'),
  uluru: unsplash(
    '1529108190281-9a4f620bc2d8',
    'Uluru rising above the desert under a blue sky',
  ),
  topEndBeach: unsplash(
    '1589051194321-7201ca7194ae',
    'Trees along a tropical beach',
  ),
} as const;

export type SeedImage = (typeof images)[keyof typeof images];
