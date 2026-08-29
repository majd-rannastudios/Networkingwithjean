// Circle colours.
//
// These are deliberately NOT the Ranna palette. They are wayfinding, not
// branding: a guest has to spot their circle across a dark room full of people
// and say the name out loud to a stranger. That wants plain, primary, unarguable
// colours - everybody already knows what blue means, and nobody has to be told
// which circle is "Veil of Becoming". The app around them carries the brand.
//
// Ordered by how far apart they read: the operator picks how many circles are in
// play and gets the first N, so a four-circle event gets red/blue/yellow/green -
// the four most separable colours there are.
export const PALETTE = [
  { id: 'red',    name: 'Red',    hex: '#E02B20', ink: '#FFFFFF' },
  { id: 'blue',   name: 'Blue',   hex: '#1F7FD4', ink: '#FFFFFF' },
  { id: 'yellow', name: 'Yellow', hex: '#FFC613', ink: '#2A1F00' },
  { id: 'green',  name: 'Green',  hex: '#3FAE49', ink: '#FFFFFF' },
  { id: 'purple', name: 'Purple', hex: '#8B44AD', ink: '#FFFFFF' },
  { id: 'orange', name: 'Orange', hex: '#F5821F', ink: '#2A1400' },
  { id: 'teal',   name: 'Teal',   hex: '#00A79D', ink: '#FFFFFF' },
  { id: 'pink',   name: 'Pink',   hex: '#EC4899', ink: '#FFFFFF' }
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
