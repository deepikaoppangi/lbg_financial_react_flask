import james from './james_thompson.json';
import sarah from './sarah_mitchell.json';
import david from './david_williams.json';

export const PROFILE_DATA = {
  james_thompson: james,
  sarah_mitchell: sarah,
  david_williams: david,
};

export const getAvailableProfiles = () => {
  return Object.entries(PROFILE_DATA).map(([id, data]) => ({
    id,
    name: data.name || id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  }));
};

