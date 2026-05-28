export const useHomeContent = () => {
  return useAsyncData('home', () => queryCollection('home').path('/home').first());
};
