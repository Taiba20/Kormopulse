import { useI18n } from "../i18n/I18nContext";

const COUNTRIES = [
  "bangladesh", "united_states", "united_kingdom", "australia", "canada", "germany",
  "france", "japan", "china", "brazil", "south_africa",
];
const ROLE_GROUPS = [
  { key: "technical", roles: ["software_engineer", "data_scientist", "system_admin"] },
  { key: "management", roles: ["project_manager", "product_manager", "team_lead"] },
  { key: "design", roles: ["ui_designer", "ux_designer", "graphic_designer"] },
];

/** Translated <select> options for the country, role and experience dropdowns. */
const useProfileOptions = ({ withDefaultExperience = false } = {}) => {
  const { t } = useI18n();

  const locationOptions = [
    { value: "default", label: t("profile.about_form.selectCountry") },
    ...COUNTRIES.map((key) => ({ value: key, label: t(`profile.countries.${key}`) })),
  ];
  const roleOptions = ROLE_GROUPS.map((group) => ({
    label: t(`profile.roleGroups.${group.key}`),
    options: group.roles.map((role) => ({ value: role, label: t(`profile.roles.${role}`) })),
  }));
  const experienceOptions = [
    ...(withDefaultExperience ? [{ value: "default", label: t("onboarding.seeker.selectYears") }] : []),
    ...[0, 1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: t(`profile.experienceOptions.${n}`) })),
  ];

  return { locationOptions, roleOptions, experienceOptions };
};

export default useProfileOptions;
