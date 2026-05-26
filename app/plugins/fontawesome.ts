import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

config.autoAddCss = false;
config.familyDefault = 'classic';
config.styleDefault = 'light';

export default defineNuxtPlugin((nuxtApp) => {
  if (!nuxtApp.vueApp._context.components['FontAwesomeIcon']) {
    nuxtApp.vueApp.component('FontAwesomeIcon', FontAwesomeIcon);
  }
});
