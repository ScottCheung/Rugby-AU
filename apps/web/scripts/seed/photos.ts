import { images, type SeedImage } from './images';

/**
 * Seed photos grouped by subject, so a "Coach" card shows a coach and a
 * stadium card shows a stadium.
 */
export const pools = {
  action: [
    images.tackle,
    images.match,
    images.breakaway,
    images.carry,
    images.stadiumContest,
    images.tackleRedWhite,
    images.eveningMatch,
    images.carryPastTackler,
    images.ruckGreen,
    images.sidestep,
    images.maulMud,
    images.tackleGround,
    images.maulRedWhite,
    images.grandstandChase,
    images.divingTackle,
    images.runner,
    images.muddyContest,
    images.wetField,
  ],
  setPiece: [
    images.scrum,
    images.lineoutStadium,
    images.scrumStripes,
    images.lineoutSky,
    images.lineoutCatch,
    images.lineoutTrees,
    images.lineoutPark,
    images.lineoutGreen,
    images.lineoutCrowd,
  ],
  women: [
    images.womenPlaying,
    images.womenTackle,
    images.womenCarry,
    images.womenLineout,
    images.womenGreenOrange,
    images.womenJerseys,
    images.womenHuddle,
  ],
  stadium: [
    images.stadium,
    images.bigStadium,
    images.stadiumStands,
    images.pitchDusk,
    images.stadiumSunny,
    images.stadiumSunset,
    images.floodlights,
    images.pitchSprinklers,
    images.stadiumSeats,
  ],
  crowd: [
    images.stadiumNight,
    images.fansCheering,
    images.floodlitCrowd,
    images.lineoutCrowd,
  ],
  team: [
    images.celebration,
    images.teamHoops,
    images.huddleMaroon,
    images.huddleNavy,
    images.teamsTogether,
    images.huddleStripes,
  ],
  coaching: [
    images.coachBoard,
    images.coachTalk,
    images.coachYoung,
    images.kidsHuddle,
  ],
  juniors: [
    images.juniorMatch,
    images.tryJunior,
    images.youngSprinter,
    images.youthMatch,
    images.kidsRunning,
    images.kidsPark,
  ],
  volunteers: [images.volunteerDrinks, images.volunteersBlue],
  ball: [
    images.ballField,
    images.ball,
    images.ballMorning,
    images.ballFieldClose,
    images.ballLeaves,
  ],
  // Titles and wins. Only one trophy photo is clearly not another sport's,
  // so celebrations fill the rest.
  trophy: [images.trophy, images.celebration, images.teamHoops],
} satisfies Record<string, SeedImage[]>;

export type Pool = keyof typeof pools;

/**
 * A photo picker for one site. Each pool is walked in order from an offset
 * that differs per site, so a site rarely shows the same photo twice and
 * neighbouring sites start on different photos.
 */
export function photoPicker(siteIndex: number) {
  const used: Partial<Record<Pool, number>> = {};
  return (pool: Pool): SeedImage => {
    const list = pools[pool];
    const count = used[pool] ?? 0;
    used[pool] = count + 1;
    return list[(siteIndex * 5 + count) % list.length];
  };
}
