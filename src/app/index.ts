import '../styles/styles.scss';
import {EngineClass} from "./classes/Engine.class";
import {pickById} from "./shared/utlis";
import {default as packageInfo} from '../../package.json';

const VERSION = packageInfo.version;
const engine = new EngineClass();

window.addEventListener('DOMContentLoaded', () => {
  (pickById('app-version') as HTMLElement).textContent = `v${VERSION}`;
  engine.start();
});
