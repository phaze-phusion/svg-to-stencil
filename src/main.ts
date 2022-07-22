import './styles.scss';
import {initializeInterface} from "./app/user-interface.controller";
import {initializePreview} from './app/svg-preview.controller';

window.addEventListener('DOMContentLoaded', () => {
  initializeInterface();
  initializePreview();
});
