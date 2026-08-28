// Palette of circle colours. The operator picks how many are in play (2..10).
// These are chosen to stay distinguishable on a dark event carpet and under
// coloured uplighting, and to be nameable out loud ("go to orange").
export const PALETTE = [
  { id: 'orange',  name: 'Orange',  hex: '#F58220', ink: '#1A1207' },
  { id: 'blue',    name: 'Blue',    hex: '#2D7DD2', ink: '#FFFFFF' },
  { id: 'green',   name: 'Green',   hex: '#4CAF3E', ink: '#0B1A08' },
  { id: 'purple',  name: 'Purple',  hex: '#7C4DBE', ink: '#FFFFFF' },
  { id: 'magenta', name: 'Magenta', hex: '#E5399B', ink: '#FFFFFF' },
  { id: 'yellow',  name: 'Yellow',  hex: '#FFC629', ink: '#1A1405' },
  { id: 'teal',    name: 'Teal',    hex: '#00A9A5', ink: '#04201F' },
  { id: 'red',     name: 'Red',     hex: '#E4402E', ink: '#FFFFFF' },
  { id: 'sky',     name: 'Sky',     hex: '#35C0E8', ink: '#04202B' },
  { id: 'indigo',  name: 'Indigo',  hex: '#4436A8', ink: '#FFFFFF' }
];

export const DEFAULT_COLOR_COUNT = 6;
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
