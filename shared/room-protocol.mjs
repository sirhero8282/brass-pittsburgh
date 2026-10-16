// Future server/client contract; deliberately independent of the two-seat legacy UI.
export const PROTOCOL_VERSION = 1;
export const MAX_PLAYERS = 4;
const ACTIONS = new Set(['build', 'network', 'develop', 'sell', 'loan', 'pass', 'confirm-turn']);
const safeId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value);
const plainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;

// Structural validation only. A future authoritative server MUST bind playerId
// to its authenticated connection, then check turn, resources and action legality.
export function validateCommand(command) {
  if (!plainObject(command) || command.protocol !== PROTOCOL_VERSION) throw new Error('Unsupported command protocol');
  if (!safeId(command.roomId) || !safeId(command.playerId) || !safeId(command.commandId)) throw new Error('Invalid command identity');
  if (!Number.isSafeInteger(command.expectedRevision) || command.expectedRevision < 0) throw new Error('Invalid expected revision');
  if (!ACTIONS.has(command.type) || !plainObject(command.payload)) throw new Error('Invalid action');
  const json = JSON.stringify(command);
  if (json.length > 16384) throw new Error('Command too large');
  return JSON.parse(json);
}

// The new multiplayer engine must explicitly supply a public view and each
// seat's private view. Never pass the current complete legacy state as public.
export function createPlayerSnapshot({ roomId, revision, players, publicState, privateByPlayer }, viewerId) {
  if (!safeId(roomId) || !Number.isSafeInteger(revision) || revision < 0) throw new Error('Invalid room');
  if (!Array.isArray(players) || players.length < 2 || players.length > MAX_PLAYERS ||
      !players.every(safeId) || new Set(players).size !== players.length || !players.includes(viewerId)) throw new Error('Invalid player roster');
  if (!plainObject(publicState) || !plainObject(privateByPlayer) || !Object.hasOwn(privateByPlayer, viewerId)) throw new Error('Missing player view');
  return structuredClone({ protocol: PROTOCOL_VERSION, roomId, revision, players, publicState, privateState: privateByPlayer[viewerId] });
}
