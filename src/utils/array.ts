export function shuffle<T>(source: T[]): T[] {
  const clone = [...source];

  let currentIndex = clone.length;

  // While there remain elements to shuffle...
  while (currentIndex > 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [clone[currentIndex], clone[randomIndex]] = [
      clone[randomIndex],
      clone[currentIndex],
    ];
  }

  return clone;
}
