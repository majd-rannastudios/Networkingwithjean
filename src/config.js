// The Ranna palette, and nothing else.
//
// Ordered by how far apart they read across a room, not by the order they sit
// on the brand sheet: the operator picks how many circles are in play and gets
// the first N, so a four-circle event gets the four most separable.
//
// `floorRisk` marks the two that are hard to find on a dark event carpet under
// coloured uplighting. They still work - they are brand colours and they are in
// the set - but the console warns when a floor plan depends on them, because a
// guest who cannot spot their circle from across the room is a guest standing
// still.
export const PALETTE = [
  { id: 'ember',   name: 'Ember Dawn',       hex: '#FB9203', ink: '#080035' },
  { id: 'crimson', name: 'Crimson Bloom',    hex: '#C91B7A', ink: '#FFFFFF' },
  { id: 'veil',    name: 'Veil of Becoming', hex: '#68097D', ink: '#FFFFFF' },
  { id: 'burnt',   name: 'Burnt Horizon',    hex: '#E3500A', ink: '#FFFFFF' },
  { id: 'dusk',    name: 'Dusk Matter',      hex: '#3F184D', ink: '#FFFFFF', floorRisk: true },
  { id: 'abyss',   name: 'Abyssal Black',    hex: '#080035', ink: '#FFFFFF', floorRisk: true }
];

export const DEFAULT_COLOR_COUNT = 4;
export const DEFAULT_ROUND_MINUTES = 10;

// Icebreakers. Each circle gets a different one each round, so nobody is asked
// the same question twice and no two circles are running the same prompt.
export const QUESTIONS = [
  'What brought you to this event — and what would make it worth it?',
  'What is something you changed your mind about this year?',
  'What part of your job would surprise people who do not do it?',
  'What is the best thing you have read, watched or listened to lately?',
  'Which problem in your industry is everyone ignoring?',
  'What did you want to be when you were ten? How close did you get?',
  'What is one tool or habit you would not give up?',
  'Who in this room would you most like to be introduced to, and why?',
  'What is the most useful piece of advice you were given at work?',
  'What is something you are trying to get better at right now?',
  'What is the smallest change that made the biggest difference for you?',
  'What do you wish clients understood about what you do?',
  'What is a project you are proud of that nobody saw?',
  'If you had a free month and a budget, what would you build?',
  'What is your unpopular opinion about your own field?',
  'Where were you living five years ago, and what changed since?',
  'What is the last thing that genuinely impressed you?',
  'What is a skill outside work that helps you at work?',
  'What would you do differently if you started your career today?',
  'What is one thing you want to walk out of tonight with?'
];

// Assignment cost weights. Tune here, not in the algorithm.
export const WEIGHTS = {
  // Cost of sharing a circle with someone you already met. Superlinear, so a
  // necessary second meeting is tolerated but a third is fought hard.
  repeat: 12,
  // Cost of sharing a circle with a colleague from the same company. They can
  // talk at the office; the point of the night is everyone else.
  sameCompany: 25,
  // Cost of being handed the same colour two rounds running. Near-hard: the
  // whole activation depends on people physically moving.
  stayPut: 400
};
