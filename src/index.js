import style from './scss/styles.scss'; // eslint-disable-line no-unused-vars
import {Shape} from "./es/Shape.class";

export const version = VERSION; // VERSION comes from webpack plugin

/**
 * @param {string} id
 * @return {HTMLElement}
 */
function _pickById( id ) {
  return document.getElementById( id );
}

const shape = new Shape(`<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>`);

function outputToTextarea(str) {
  const taId = 'mx-out';
  // if (!document.getElementById(taId)) {
  //   const ta = document.createElement('textarea');
  //   ta.id = taId;
  //   ta.style = 'width: 600px; height: 600px; position: absolute; top: 50px; left: 50px; background-color: #fff;';
  //   document.body.appendChild(ta);
  // }
  document.getElementById(taId).textContent = str;
}

/**
 * Once the DOM is ready to be manipulated, hit it with all our modification requests
 */
window.addEventListener('DOMContentLoaded', () => {
  document.head.title.insertAdjacentText('beforeend', ` v${version}`);
  outputToTextarea(shape.mxGraph);
});
