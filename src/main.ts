import './styles.scss';
import {initializeInterface} from "./app/interface";
import {initializePreview} from './app/svg-preview';

window.addEventListener('DOMContentLoaded', () => {
  initializeInterface();
  initializePreview();
});
