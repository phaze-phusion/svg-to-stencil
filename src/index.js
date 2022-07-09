import style from './scss/styles.scss'; // eslint-disable-line no-unused-vars
import {EngineClass} from "./es/Engine.class";
import {pickById} from "./es/utlis";

const version = VERSION; // VERSION comes from webpack plugin
const engine = new EngineClass();

window.addEventListener('DOMContentLoaded', () => {
  pickById('app-version').textContent = `v${version}`;
  engine.start();
});
