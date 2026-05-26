import '@fortawesome/fontawesome-svg-core/styles.css';
import { config, library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

import {
  faJava,
  faJs,
  faPhp,
  faPython,
  faRust,
  faSwift,
  faGithub,
} from '@fortawesome/free-brands-svg-icons';
import {
  faCode,
  faMagnifyingGlass,
  faMoon,
  faSun,
} from '@fortawesome/pro-light-svg-icons';

config.autoAddCss = false;
config.familyDefault = 'classic';
config.styleDefault = 'light';

library.add(
  faCode,
  faGithub,
  faJava,
  faJs,
  faMagnifyingGlass,
  faMoon,
  faPhp,
  faPython,
  faRust,
  faSun,
  faSwift,
);

export default defineNuxtPlugin((nuxtApp) => {
  if (!nuxtApp.vueApp._context.components['FontAwesomeIcon']) {
    nuxtApp.vueApp.component('FontAwesomeIcon', FontAwesomeIcon);
  }
});
