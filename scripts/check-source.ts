import { MilitaryPageSource } from '../server/infrastructure/page-source.js';
const snapshot = await new MilitaryPageSource().fetch();
console.log(JSON.stringify({ hash: snapshot.hash, characters: snapshot.text.length, links: snapshot.links.length }, null, 2));
