import { SKILL_GRAPH, SKILL_BY_ID, SKILL_DOMAINS } from '../data/skillGraph.js';

export function validateSkillGraph() {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  SKILL_GRAPH.forEach((skill) => {
    if (!skill.id || ids.has(skill.id)) errors.push(`Duplicate or missing skill id: ${skill.id}`);
    ids.add(skill.id);
    ['domainId', 'topic', 'grade', 'difficulty', 'visualHint', 'masteryThreshold'].forEach((field) => {
      if (skill[field] == null || skill[field] === '') errors.push(`${skill.id}: missing ${field}`);
    });
    if (!Array.isArray(skill.representations) || skill.representations.length < 3) errors.push(`${skill.id}: insufficient representations`);
    if (!Array.isArray(skill.templateBlueprints) || skill.templateBlueprints.length < 4) errors.push(`${skill.id}: fewer than four template blueprints`);
    if (!Array.isArray(skill.hintSteps) || skill.hintSteps.length < 3) errors.push(`${skill.id}: insufficient hint steps`);
    if (!Array.isArray(skill.sceneMappings) || skill.sceneMappings.length === 0) errors.push(`${skill.id}: no scene mappings`);
    skill.prerequisites.forEach((id) => { if (!SKILL_BY_ID[id]) errors.push(`${skill.id}: missing prerequisite ${id}`); });
  });
  if (SKILL_GRAPH.length < 120 || SKILL_GRAPH.length > 160) errors.push(`Skill count ${SKILL_GRAPH.length} is outside 120-160`);
  if (SKILL_DOMAINS.length < 10) warnings.push(`Only ${SKILL_DOMAINS.length} domains defined`);
  return { ok: errors.length === 0, errors, warnings, counts: { skills: SKILL_GRAPH.length, domains: SKILL_DOMAINS.length } };
}
