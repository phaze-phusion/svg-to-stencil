import './styles.scss';
import {EngineClass} from "./app/Engine.class";
import {pickById} from "./app/shared/utlis";
import {default as packageInfo} from '../package.json';
import {elementId} from './app/models/elementId.enum';

const VERSION = packageInfo.version;
const engine = new EngineClass();

window.addEventListener('DOMContentLoaded', () => {
  (pickById(elementId.appVersionOutput) as HTMLElement).textContent = `v${VERSION}`;
  engine.start();
});
