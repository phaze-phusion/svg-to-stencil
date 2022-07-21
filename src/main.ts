import './styles.scss';
import {initializeInterface} from "./app/Engine.class";
import {initializePreview} from './app/svg-preview';

window.addEventListener('DOMContentLoaded', () => {
  initializeInterface();
  initializePreview();
});
