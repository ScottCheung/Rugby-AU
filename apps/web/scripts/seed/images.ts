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
  // More match, crowd and community photos (Unsplash licence, checked by eye).
  lineoutStadium: unsplash(
    '1495329356033-eb76e0af9fd9',
    'A lineout jumper lifted high in front of red stadium seats',
  ),
  lineoutCrowd: unsplash(
    '1495329144860-da404d597791',
    'A lineout in a stadium with spectators in the stands',
  ),
  stadiumContest: unsplash(
    '1574602904329-56e2f95fb15e',
    'Players in black and in blue chasing the ball on a stadium pitch',
  ),
  lineoutSky: unsplash(
    '1613332331877-8a47030be80b',
    'A jumper in red and black lifted by teammates against a blue sky',
  ),
  tackleRedWhite: unsplash(
    '1573056019991-590821ff5438',
    'A ball carrier in red and white held up by tacklers in black',
  ),
  eveningMatch: unsplash(
    '1759760300494-7378d88180f9',
    'Players in blue and in red and white during an evening match',
  ),
  carryPastTackler: unsplash(
    '1574618519056-4f25ec2711f4',
    'A player in black carrying the ball past a tackler in green',
  ),
  ruckGreen: unsplash(
    '1574618500275-a5d3458db385',
    'Players in green and in black competing for the ball at a ruck',
  ),
  sidestep: unsplash(
    '1516689807549-04b4c3b4ee35',
    'A player in yellow leaping out of a tackle beside spectators',
  ),
  lineoutCatch: unsplash(
    '1573056019901-7d8c83cd2c7a',
    'A lineout jumper in dark green catching the ball',
  ),
  maulMud: unsplash(
    '1574618529433-ab11e5f3d962',
    'Players in black driving forward in a maul',
  ),
  scrumStripes: unsplash(
    '1631021694928-56b70c9be844',
    'Two packs in striped jerseys bound together in a scrum',
  ),
  tackleGround: unsplash(
    '1573056020034-fc367ec5ff3a',
    'A player in green brought to ground among players in red and white',
  ),
  maulRedWhite: unsplash(
    '1573056020071-9697f575f8d6',
    'Players in black and in red and white bound in a maul',
  ),
  grandstandChase: unsplash(
    '1662052282121-ca29557ad2d5',
    'Players in red and in green chasing the ball in front of a grandstand',
  ),
  divingTackle: unsplash(
    '1475505035646-a4680971b0fb',
    'A player in yellow diving to tackle a runner in white',
  ),
  lineoutTrees: unsplash(
    '1635356164637-92da6fb2072d',
    'A lineout jumper reaching for the ball in front of trees',
  ),
  lineoutPark: unsplash(
    '1635226091798-ff20bc3b19a5',
    'A lineout jumper in blue lifted above the players in a park',
  ),
  sevensLineout: unsplash(
    '1794239143174-74cb66fede3d',
    'Players in gold and in white contesting a lineout in a stadium',
  ),
  teamHoops: unsplash(
    '1643130083953-a34f369b612a',
    'A team in red and white hoops gathered in front of the goal posts',
  ),
  womenTackle: unsplash(
    '1601106780946-fb62d2db706b',
    'A women’s match: a ball carrier in white tackled by players in navy and red',
  ),
  womenGreenOrange: unsplash(
    '1580146400020-fc3f176baed8',
    'Women in green and in orange competing for the ball in a tackle',
  ),
  youthMatch: unsplash(
    '1600534745983-36df226d4381',
    'Players in orange and in green chasing the ball, with the referee in yellow',
  ),
  womenLineout: unsplash(
    '1551095318-8583a8da870b',
    'Women’s teams in white and in blue contesting a lineout',
  ),
  lineoutGreen: unsplash(
    '1580720320997-d26327263582',
    'A jumper in green catching the ball at a lineout, opponents in orange',
  ),
  clubMatch: unsplash(
    '1608719887150-4bd666822147',
    'A club match in progress on a sunny field',
  ),
  womenCarry: unsplash(
    '1601106770965-f8d5b3bcd271',
    'A woman in red carrying the ball into a tackle',
  ),
  runner: unsplash(
    '1709372349201-3c0cdd6a4eed',
    'A player in navy and orange running with the ball',
  ),
  youngSprinter: unsplash(
    '1729871337531-249297613423',
    'A young player in red and white sprinting with the ball',
  ),
  juniorMatch: unsplash(
    '1613425295165-dc4a15a98bbf',
    'Junior players in black and red chasing a runner in blue',
  ),
  tryJunior: unsplash(
    '1492303686649-6911c8127d9a',
    'A young player in a scrum cap placing the ball over the line',
  ),
  muddyContest: unsplash(
    '1585743432494-88df3550c99a',
    'Players in green and in orange competing for the ball on a muddy pitch',
  ),
  wetField: unsplash(
    '1532161388762-e4694f382a0e',
    'Players racing across a wet, muddy field',
  ),
  pitchSprinklers: unsplash(
    '1762644085617-39aa30dd9c52',
    'Sprinklers watering the pitch in a large stadium',
  ),
  fansCheering: unsplash(
    '1665413811870-5b29a250f64a',
    'Spectators on their feet in the stands',
  ),
  bigStadium: unsplash(
    '1693073410934-5e45e31a6b5c',
    'A large stadium filling up before a rugby match',
  ),
  pitchDusk: unsplash(
    '1735583573592-edacba3f36a8',
    'An empty rugby pitch with goal posts and blue stands at dusk',
  ),
  floodlitCrowd: unsplash(
    '1629217855633-79a6925d6c47',
    'A floodlit stadium packed with spectators',
  ),
  stadiumSunset: unsplash(
    '1512719994953-eabf50895df7',
    'A stadium under a purple sunset sky',
  ),
  floodlights: unsplash(
    '1706675780107-7c43cc487928',
    'A pitch under bright floodlights at night',
  ),
  coachBoard: unsplash(
    '1585757318177-0570a997dc3a',
    'A coach holding a tactics board beside a field',
  ),
  coachTalk: unsplash(
    '1771308378506-7f394413342c',
    'A coach talking to players gathered around',
  ),
  coachYoung: unsplash(
    '1529932398402-e0b30f66a559',
    'A coach giving instructions to a young player at training',
  ),
  kidsHuddle: unsplash(
    '1526232761682-d26e03ac148e',
    'A coach with a group of young children on a training pitch',
  ),
  huddleMaroon: unsplash(
    '1624295059100-0ca889087b54',
    'Players in maroon jerseys arm in arm in a team huddle',
  ),
  teamsTogether: unsplash(
    '1529325708907-1c972159dbfb',
    'Two teams gathered together on the field',
  ),
  huddleStripes: unsplash(
    '1752681304960-bd4e018a04bb',
    'A team in light blue and white in a huddle',
  ),
  womenHuddle: unsplash(
    '1557278444-248705f95d17',
    'A women’s team in white huddled on a stadium field',
  ),
  huddleNavy: unsplash(
    '1785216130375-48966f2d7912',
    'A team in navy huddled on a field',
  ),
  volunteerDrinks: unsplash(
    '1766066014260-2c886decef4b',
    'A volunteer handing out drinks at a community sports event',
  ),
  volunteersBlue: unsplash(
    '1774557937549-8844e48e8b22',
    'Volunteers in blue helping at an event',
  ),
  kidsPark: unsplash(
    '1502086223501-7ea6ecd79368',
    'Children playing in a misty park',
  ),
  kidsRunning: unsplash(
    '1777489689168-497290f235d5',
    'Children running across a sunny field',
  ),
  trophy: unsplash(
    '1578269174936-2709b6aeb913',
    'A gold trophy on a white background',
  ),
  trophyField: unsplash(
    '1637635753380-20bf6f46ede0',
    'A trophy standing on the grass of a field',
  ),
} as const;

export type SeedImage = (typeof images)[keyof typeof images];
